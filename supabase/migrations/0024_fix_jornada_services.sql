-- ============================================================================
-- 0024_fix_jornada_services.sql
-- FIXES:
-- 1. upsert_work_windows: fix constraint violation when closing today's windows
-- 2. check_jornada_conflicts: detect appointments conflicting with new schedule
-- 3. services RLS: allow professionals to update services they've linked
-- ============================================================================

-- ============================================================================
-- 1. FIX: upsert_work_windows — close windows correctly
--    ROOT CAUSE: UPDATE sets effective_until = yesterday for windows where
--    effective_from = today, violating CHECK (effective_until >= effective_from)
--    FIX: Only close windows where effective_from < today.
--          Delete windows where effective_from = today (not yet in effect).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_work_windows(
  p_professional_id UUID,
  p_windows JSONB
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_auth_professional_id UUID;
  v_item JSONB;
  v_break JSONB;
  v_window_id UUID;
  v_weekday INTEGER;
  v_effective_from DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_caller_id AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not found' USING ERRCODE = '40402';
  END IF;

  v_auth_professional_id := public.get_auth_professional_id();
  IF v_auth_professional_id IS NOT NULL AND v_auth_professional_id != p_professional_id THEN
    RAISE EXCEPTION 'Cannot modify another professional schedule' USING ERRCODE = '40303';
  END IF;

  -- FIX: Close windows that started BEFORE today (effective_from < today)
  -- These can safely have effective_until set to yesterday
  UPDATE public.work_windows
  SET is_active = false,
      effective_until = v_today - INTERVAL '1 day',
      updated_at = now()
  WHERE professional_id = p_professional_id
    AND is_active = true
    AND effective_from < v_today;

  -- FIX: Delete windows starting TODAY (they haven't been in effect yet)
  -- Cannot set effective_until = yesterday because effective_from = today
  -- would violate CHECK (effective_until >= effective_from)
  DELETE FROM public.work_windows
  WHERE professional_id = p_professional_id
    AND is_active = true
    AND effective_from = v_today;

  -- Upsert each window with vigência
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_windows)
  LOOP
    v_weekday := (v_item->>'weekday')::INTEGER;
    v_effective_from := COALESCE((v_item->>'effective_from')::DATE, v_today);

    INSERT INTO public.work_windows (
      professional_id, weekday, start_time, end_time,
      sort_order, is_active, effective_from, effective_until
    ) VALUES (
      p_professional_id,
      v_weekday,
      (v_item->>'start_time')::TIME,
      (v_item->>'end_time')::TIME,
      COALESCE((v_item->>'sort_order')::INTEGER, 0),
      true,
      v_effective_from,
      CASE WHEN v_item->>'effective_until' IS NOT NULL
           THEN (v_item->>'effective_until')::DATE
           ELSE NULL END
    )
    RETURNING id INTO v_window_id;

    -- Insert breaks for this window
    IF v_item ? 'breaks' THEN
      FOR v_break IN SELECT * FROM jsonb_array_elements(v_item->'breaks')
      LOOP
        IF (v_break->>'start_time')::TIME < (v_item->>'start_time')::TIME
           OR (v_break->>'end_time')::TIME > (v_item->>'end_time')::TIME
        THEN
          RAISE EXCEPTION 'Break must be within window time range' USING ERRCODE = '42209';
        END IF;
        IF (v_break->>'start_time')::TIME >= (v_break->>'end_time')::TIME THEN
          RAISE EXCEPTION 'Break end must be after break start' USING ERRCODE = '42210';
        END IF;

        INSERT INTO public.schedule_breaks (
          work_window_id, start_time, end_time, label, sort_order
        ) VALUES (
          v_window_id,
          (v_break->>'start_time')::TIME,
          (v_break->>'end_time')::TIME,
          COALESCE(v_break->>'label', 'Pausa'),
          COALESCE((v_break->>'sort_order')::INTEGER, 0)
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- 2. NEW RPC: check_jornada_conflicts
--    Check if proposed weekly schedule conflicts with existing appointments.
--    Returns conflicting appointment details for explicit display.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_jornada_conflicts(
  p_professional_id UUID,
  p_windows JSONB
)
RETURNS TABLE (
  appointment_id UUID,
  client_name TEXT,
  appointment_date DATE,
  appointment_time TIME,
  service_name TEXT,
  professional_name TEXT
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_item JSONB;
  v_weekday INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_break_start TIME;
  v_break_end TIME;
  v_win JSONB;
  v_conflict_rec RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  -- Check each proposed window against existing appointments
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_windows)
  LOOP
    v_weekday := (v_item->>'weekday')::INTEGER;
    v_start_time := (v_item->>'start_time')::TIME;
    v_end_time := (v_item->>'end_time')::TIME;

    -- Find confirmed appointments on this weekday that fall outside the new window
    -- or overlap with new breaks
    FOR v_conflict_rec IN
      SELECT
        a.id AS appointment_id,
        COALESCE(u.full_name, 'Cliente') AS client_name,
        (a.start_at AT TIME ZONE 'America/Sao_Paulo')::DATE AS appointment_date,
        (a.start_at AT TIME ZONE 'America/Sao_Paulo')::TIME AS appointment_time,
        s.name AS service_name,
        p.display_name AS professional_name
      FROM public.appointments a
      JOIN public.users u ON u.id = a.client_user_id
      JOIN public.services s ON s.id = a.service_id
      JOIN public.professionals p ON p.id = a.professional_id
      WHERE a.professional_id = p_professional_id
        AND a.status IN ('confirmed', 'completed')
        AND EXTRACT(DOW FROM a.start_at AT TIME ZONE 'America/Sao_Paulo')::INTEGER = v_weekday
        AND (
          -- Appointment starts before the new window
          (a.start_at AT TIME ZONE 'America/Sao_Paulo')::TIME < v_start_time
          OR
          -- Appointment ends after the new window
          (a.end_at AT TIME ZONE 'America/Sao_Paulo')::TIME > v_end_time
        )
    LOOP
      appointment_id := v_conflict_rec.appointment_id;
      client_name := v_conflict_rec.client_name;
      appointment_date := v_conflict_rec.appointment_date;
      appointment_time := v_conflict_rec.appointment_time;
      service_name := v_conflict_rec.service_name;
      professional_name := v_conflict_rec.professional_name;
      RETURN NEXT;
    END LOOP;

    -- Also check if appointments overlap with new breaks
    IF v_item ? 'breaks' THEN
      FOR v_win IN SELECT * FROM jsonb_array_elements(v_item->'breaks')
      LOOP
        v_break_start := (v_win->>'start_time')::TIME;
        v_break_end := (v_win->>'end_time')::TIME;

        FOR v_conflict_rec IN
          SELECT
            a.id AS appointment_id,
            COALESCE(u.full_name, 'Cliente') AS client_name,
            (a.start_at AT TIME ZONE 'America/Sao_Paulo')::DATE AS appointment_date,
            (a.start_at AT TIME ZONE 'America/Sao_Paulo')::TIME AS appointment_time,
            s.name AS service_name,
            p.display_name AS professional_name
          FROM public.appointments a
          JOIN public.users u ON u.id = a.client_user_id
          JOIN public.services s ON s.id = a.service_id
          JOIN public.professionals p ON p.id = a.professional_id
          WHERE a.professional_id = p_professional_id
            AND a.status IN ('confirmed', 'completed')
            AND EXTRACT(DOW FROM a.start_at AT TIME ZONE 'America/Sao_Paulo')::INTEGER = v_weekday
            AND (a.start_at AT TIME ZONE 'America/Sao_Paulo')::TIME < v_break_end
            AND (a.end_at AT TIME ZONE 'America/Sao_Paulo')::TIME > v_break_start
        LOOP
          appointment_id := v_conflict_rec.appointment_id;
          client_name := v_conflict_rec.client_name;
          appointment_date := v_conflict_rec.appointment_date;
          appointment_time := v_conflict_rec.appointment_time;
          service_name := v_conflict_rec.service_name;
          professional_name := v_conflict_rec.professional_name;
          RETURN NEXT;
        END LOOP;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- 3. FIX RLS: services — allow professionals to update services they've linked
-- ============================================================================
DROP POLICY IF EXISTS "services_update_admin" ON public.services;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'services_update_linked' AND tablename = 'services'
  ) THEN
    CREATE POLICY "services_update_linked" ON public.services
      FOR UPDATE USING (
        -- Allow if caller is admin (global admin)
        public.is_admin()
        OR
        -- Allow if caller is a professional who has linked this service
        EXISTS (
          SELECT 1 FROM public.professional_services ps
          WHERE ps.service_id = services.id
            AND ps.professional_id = public.get_auth_professional_id()
        )
      );
  END IF;
END $$;

-- Also allow professionals to delete services they've linked
DROP POLICY IF EXISTS "services_delete_admin" ON public.services;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'services_delete_linked' AND tablename = 'services'
  ) THEN
    CREATE POLICY "services_delete_linked" ON public.services
      FOR DELETE USING (
        public.is_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.professional_services ps
          WHERE ps.service_id = services.id
            AND ps.professional_id = public.get_auth_professional_id()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. FIX: Ensure get_auth_professional_id works without role = 'admin'
--    The function in 0022 already doesn't check role, but let's ensure
--    the version from 0002 (which checks role = 'admin') is replaced
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_professional_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id
  FROM public.professionals p
  JOIN public.users u ON u.id = p.user_id
  WHERE u.id = auth.uid()
    AND u.is_active = true
    AND u.deleted_at IS NULL
  LIMIT 1;
$$;

-- ============================================================================
-- 5. Ensure cleanup_old_appointments is not restricted
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_appointments()
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted INTEGER;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  -- Allow any authenticated professional to trigger cleanup
  IF public.get_auth_professional_id() IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  DELETE FROM public.appointments
  WHERE (start_at AT TIME ZONE 'America/Sao_Paulo')::DATE < CURRENT_DATE
    AND status = 'confirmed';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
