-- ============================================================================
-- 0023_fix_professional_authorization.sql
-- CAUSA RAIZ: Todas as RPCs e RLS policies exigem role = 'admin', mas
-- get_auth_professional_id() em 0022 removeu essa verificacao. O profissional
-- autenticado com vinculo na tabela professionals DEVE ter acesso total ao
-- proprio contexto, sem precisar de role = 'admin'.
--
-- CORRECAO: Substituir verificacao de role = 'admin' por verificacao de
-- usuario ativo + ownership via professional_id.
-- ============================================================================

-- ============================================================================
-- 1. FIX: upsert_work_windows — remover role = 'admin'
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

  UPDATE public.work_windows
  SET is_active = false,
      effective_until = v_today - INTERVAL '1 day',
      updated_at = now()
  WHERE professional_id = p_professional_id
    AND is_active = true
    AND effective_from <= v_today;

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
-- 2. FIX: upsert_schedule_override — remover role = 'admin'
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_schedule_override(
  p_professional_id UUID,
  p_specific_date DATE,
  p_is_off BOOLEAN DEFAULT false,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_lunch_start TIME DEFAULT NULL,
  p_lunch_end TIME DEFAULT NULL,
  p_break_start TIME DEFAULT NULL,
  p_break_end TIME DEFAULT NULL,
  p_break_label TEXT DEFAULT 'Pausa',
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_auth_professional_id UUID;
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

  IF NOT p_is_off AND (p_start_time IS NULL OR p_end_time IS NULL) THEN
    RAISE EXCEPTION 'Start and end times required when not off' USING ERRCODE = '42201';
  END IF;

  IF p_break_start IS NOT NULL AND p_break_end IS NULL THEN
    RAISE EXCEPTION 'Break end time required when break start is provided' USING ERRCODE = '42207';
  END IF;
  IF p_break_end IS NOT NULL AND p_break_start IS NULL THEN
    RAISE EXCEPTION 'Break start time required when break end is provided' USING ERRCODE = '42208';
  END IF;

  IF p_break_start IS NOT NULL AND p_break_end IS NOT NULL AND NOT p_is_off THEN
    IF p_start_time IS NULL OR p_end_time IS NULL THEN
      RAISE EXCEPTION 'Start and end times required when break is provided' USING ERRCODE = '42201';
    END IF;
    IF p_break_start < p_start_time OR p_break_end > p_end_time THEN
      RAISE EXCEPTION 'Break must be within override time range' USING ERRCODE = '42209';
    END IF;
    IF p_break_start >= p_break_end THEN
      RAISE EXCEPTION 'Break end must be after break start' USING ERRCODE = '42210';
    END IF;
  END IF;

  INSERT INTO public.schedule_overrides (
    professional_id, specific_date, is_off,
    start_time, end_time, lunch_start, lunch_end,
    break_start, break_end, break_label, reason
  ) VALUES (
    p_professional_id, p_specific_date, p_is_off,
    p_start_time, p_end_time, p_lunch_start, p_lunch_end,
    p_break_start, p_break_end, p_break_label, p_reason
  )
  ON CONFLICT (professional_id, specific_date)
  DO UPDATE SET
    is_off = EXCLUDED.is_off,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end,
    break_start = EXCLUDED.break_start,
    break_end = EXCLUDED.break_end,
    break_label = EXCLUDED.break_label,
    reason = EXCLUDED.reason,
    updated_at = now();
END;
$$;

-- ============================================================================
-- 3. FIX: delete_schedule_override — remover role = 'admin'
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_schedule_override(
  p_professional_id UUID,
  p_specific_date DATE
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_auth_professional_id UUID;
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

  v_auth_professional_id := public.get_auth_professional_id();
  IF v_auth_professional_id IS NOT NULL AND v_auth_professional_id != p_professional_id THEN
    RAISE EXCEPTION 'Cannot modify another professional schedule' USING ERRCODE = '40303';
  END IF;

  DELETE FROM public.schedule_overrides
  WHERE professional_id = p_professional_id
    AND specific_date = p_specific_date;
END;
$$;

-- ============================================================================
-- 4. FIX: cleanup_old_appointments — exclusao global de appointments passados
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

  IF public.get_auth_professional_id() IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  DELETE FROM public.appointments
  WHERE (start_at AT TIME ZONE 'America/Sao_Paulo')::DATE < CURRENT_DATE;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- 5. FIX RLS: work_windows — remover role = 'admin'
-- ============================================================================
DROP POLICY IF EXISTS "work_windows_professional_all" ON public.work_windows;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'work_windows_professional_all' AND tablename = 'work_windows'
  ) THEN
    CREATE POLICY "work_windows_professional_all"
      ON public.work_windows FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.professionals p
          JOIN public.users u ON u.id = p.user_id
          WHERE p.id = work_windows.professional_id
            AND u.id = auth.uid()
            AND u.is_active = true
            AND u.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 6. FIX RLS: schedule_breaks — remover role = 'admin'
-- ============================================================================
DROP POLICY IF EXISTS "schedule_breaks_professional_all" ON public.schedule_breaks;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'schedule_breaks_professional_all' AND tablename = 'schedule_breaks'
  ) THEN
    CREATE POLICY "schedule_breaks_professional_all"
      ON public.schedule_breaks FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.work_windows ww
          JOIN public.professionals p ON p.id = ww.professional_id
          JOIN public.users u ON u.id = p.user_id
          WHERE ww.id = schedule_breaks.work_window_id
            AND u.id = auth.uid()
            AND u.is_active = true
            AND u.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 7. FIX RLS: schedule_overrides — remover role = 'admin'
-- ============================================================================
DROP POLICY IF EXISTS "schedule_overrides_professional_all" ON public.schedule_overrides;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'schedule_overrides_professional_all' AND tablename = 'schedule_overrides'
  ) THEN
    CREATE POLICY "schedule_overrides_professional_all"
      ON public.schedule_overrides FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.professionals p
          JOIN public.users u ON u.id = p.user_id
          WHERE p.id = schedule_overrides.professional_id
            AND u.id = auth.uid()
            AND u.is_active = true
            AND u.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 8. FIX RLS: services — permitir INSERT para qualquer autenticado
-- ============================================================================
DROP POLICY IF EXISTS "services_insert_admin" ON public.services;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'services_insert_authenticated' AND tablename = 'services'
  ) THEN
    CREATE POLICY "services_insert_authenticated" ON public.services
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- 9. FIX RLS: professional_services — remover is_admin()
-- ============================================================================
DROP POLICY IF EXISTS "professional_services_insert_owner" ON public.professional_services;
DROP POLICY IF EXISTS "professional_services_update_owner" ON public.professional_services;
DROP POLICY IF EXISTS "professional_services_delete_owner" ON public.professional_services;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'professional_services_insert_owner' AND tablename = 'professional_services'
  ) THEN
    CREATE POLICY "professional_services_insert_owner" ON public.professional_services
      FOR INSERT WITH CHECK (
        professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'professional_services_update_owner' AND tablename = 'professional_services'
  ) THEN
    CREATE POLICY "professional_services_update_owner" ON public.professional_services
      FOR UPDATE USING (
        professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'professional_services_delete_owner' AND tablename = 'professional_services'
  ) THEN
    CREATE POLICY "professional_services_delete_owner" ON public.professional_services
      FOR DELETE USING (
        professional_id = public.get_auth_professional_id()
      );
  END IF;
END $$;

-- ============================================================================
-- 10. FIX RLS: blocked_times — remover is_admin()
-- ============================================================================
DROP POLICY IF EXISTS "blocked_times_insert_owner" ON public.blocked_times;
DROP POLICY IF EXISTS "blocked_times_update_owner" ON public.blocked_times;
DROP POLICY IF EXISTS "blocked_times_delete_owner" ON public.blocked_times;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'blocked_times_insert_owner' AND tablename = 'blocked_times'
  ) THEN
    CREATE POLICY "blocked_times_insert_owner" ON public.blocked_times
      FOR INSERT WITH CHECK (
        professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'blocked_times_update_owner' AND tablename = 'blocked_times'
  ) THEN
    CREATE POLICY "blocked_times_update_owner" ON public.blocked_times
      FOR UPDATE USING (
        professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'blocked_times_delete_owner' AND tablename = 'blocked_times'
  ) THEN
    CREATE POLICY "blocked_times_delete_owner" ON public.blocked_times
      FOR DELETE USING (
        professional_id = public.get_auth_professional_id()
      );
  END IF;
END $$;

-- ============================================================================
-- 11. FIX RLS: availability — remover is_admin()
-- ============================================================================
DROP POLICY IF EXISTS "availability_insert_owner" ON public.availability;
DROP POLICY IF EXISTS "availability_update_owner" ON public.availability;
DROP POLICY IF EXISTS "availability_delete_owner" ON public.availability;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'availability_insert_owner' AND tablename = 'availability'
  ) THEN
    CREATE POLICY "availability_insert_owner" ON public.availability
      FOR INSERT WITH CHECK (
        professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'availability_update_owner' AND tablename = 'availability'
  ) THEN
    CREATE POLICY "availability_update_owner" ON public.availability
      FOR UPDATE USING (
        professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'availability_delete_owner' AND tablename = 'availability'
  ) THEN
    CREATE POLICY "availability_delete_owner" ON public.availability
      FOR DELETE USING (
        professional_id = public.get_auth_professional_id()
      );
  END IF;
END $$;

-- ============================================================================
-- 12. FIX RLS: appointments — permitir leitura global para profissionais
-- ============================================================================
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'appointments_select_professional' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY "appointments_select_professional" ON public.appointments
      FOR SELECT USING (
        public.get_auth_professional_id() IS NOT NULL
      );
  END IF;
END $$;

-- ============================================================================
-- 13. FIX RLS: appointments — permitir update/delete para profissional owner
-- ============================================================================
DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_admin" ON public.appointments;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'appointments_update_professional' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY "appointments_update_professional" ON public.appointments
      FOR UPDATE USING (
        public.get_auth_professional_id() IS NOT NULL
        AND professional_id = public.get_auth_professional_id()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'appointments_delete_professional' AND tablename = 'appointments'
  ) THEN
    CREATE POLICY "appointments_delete_professional" ON public.appointments
      FOR DELETE USING (
        public.get_auth_professional_id() IS NOT NULL
        AND professional_id = public.get_auth_professional_id()
      );
  END IF;
END $$;
