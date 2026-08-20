-- ============================================================================
-- 0003_functions_rpcs.sql
-- ============================================================================

-- ============================================================================
-- HELPER: get_available_slots
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_professional_id UUID,
  p_service_id UUID,
  p_date DATE
)
RETURNS TABLE (
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH service_duration AS (
    SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes) AS duration
    FROM public.professional_services ps
    JOIN public.services s ON s.id = ps.service_id
    WHERE ps.professional_id = p_professional_id
      AND ps.service_id = p_service_id
      AND ps.is_active = true
      AND s.is_active = true
    LIMIT 1
  ),
  day_schedule AS (
    SELECT 
      a.weekday,
      a.start_time,
      a.end_time
    FROM public.availability a
    WHERE a.professional_id = p_professional_id
      AND a.weekday = EXTRACT(DOW FROM p_date)::INTEGER
  ),
  day_blocked AS (
    SELECT b.start_at, b.end_at
    FROM public.blocked_times b
    WHERE b.professional_id = p_professional_id
      AND DATE(b.start_at AT TIME ZONE 'America/Sao_Paulo') = p_date
  ),
  existing_appointments AS (
    SELECT a.start_at, a.end_at
    FROM public.appointments a
    WHERE a.professional_id = p_professional_id
      AND a.status = 'confirmed'
      AND DATE(a.start_at AT TIME ZONE 'America/Sao_Paulo') = p_date
  ),
  slots AS (
    SELECT 
      generate_series(
        (p_date + ds.start_time)::TIMESTAMPTZ,
        (p_date + ds.end_time - INTERVAL '1 minute' * sd.duration)::TIMESTAMPTZ,
        INTERVAL '15 minutes'
      ) AS slot_start
    FROM day_schedule ds
    CROSS JOIN service_duration sd
  )
  SELECT 
    s.slot_start AS start_at,
    (s.slot_start + INTERVAL '1 minute' * sd.duration)::TIMESTAMPTZ AS end_at
  FROM slots s
  CROSS JOIN service_duration sd
  WHERE NOT EXISTS (
    SELECT 1 FROM existing_appointments ea
    WHERE s.slot_start < ea.end_at
      AND (s.slot_start + INTERVAL '1 minute' * sd.duration) > ea.start_at
  )
  AND NOT EXISTS (
    SELECT 1 FROM day_blocked db
    WHERE s.slot_start < db.end_at
      AND (s.slot_start + INTERVAL '1 minute' * sd.duration) > db.start_at
  )
  ORDER BY s.slot_start;
$$;

-- ============================================================================
-- HELPER: book_appointment (atomic creation with validation)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_at TIMESTAMPTZ,
  p_client_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_user_id UUID;
  v_duration INTEGER;
  v_end_at TIMESTAMPTZ;
  v_appointment_id UUID;
BEGIN
  -- Get authenticated user
  v_client_user_id := auth.uid();
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  -- Validate client is active
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_client_user_id
      AND role = 'client'
      AND is_active = true
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40301';
  END IF;

  -- Get service duration
  SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes)
  INTO v_duration
  FROM public.professional_services ps
  JOIN public.services s ON s.id = ps.service_id
  WHERE ps.professional_id = p_professional_id
    AND ps.service_id = p_service_id
    AND ps.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not available for this professional' USING ERRCODE = '40401';
  END IF;

  v_end_at := p_start_at + (INTERVAL '1 minute' * v_duration);

  -- Validate start_at is in the future
  IF p_start_at <= now() THEN
    RAISE EXCEPTION 'Invalid start time' USING ERRCODE = '42201';
  END IF;

  -- Validate professional is active
  IF NOT EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not available' USING ERRCODE = '40402';
  END IF;

  -- Validate time is within availability
  IF NOT EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.professional_id = p_professional_id
      AND a.weekday = EXTRACT(DOW FROM p_start_at)::INTEGER
      AND p_start_at::TIME >= a.start_time
      AND v_end_at::TIME <= a.end_time
  ) THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no blocked time overlap
  IF EXISTS (
    SELECT 1 FROM public.blocked_times b
    WHERE b.professional_id = p_professional_id
      AND p_start_at < b.end_at
      AND v_end_at > b.start_at
  ) THEN
    RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '42203';
  END IF;

  -- Insert appointment (constraint gist will catch concurrent conflicts)
  INSERT INTO public.appointments (
    client_user_id,
    professional_id,
    service_id,
    start_at,
    end_at,
    status,
    client_note
  ) VALUES (
    v_client_user_id,
    p_professional_id,
    p_service_id,
    p_start_at,
    v_end_at,
    'confirmed',
    p_client_note
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- ============================================================================
-- HELPER: cancel_appointment_by_client
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_client(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_user_id UUID;
  v_current_status TEXT;
BEGIN
  v_client_user_id := auth.uid();
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  SELECT status INTO v_current_status
  FROM public.appointments
  WHERE id = p_appointment_id
    AND client_user_id = v_client_user_id
  LIMIT 1;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Appointment not found' USING ERRCODE = '40403';
  END IF;

  IF v_current_status != 'confirmed' THEN
    RAISE EXCEPTION 'Appointment cannot be cancelled' USING ERRCODE = '42204';
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by_user_id = v_client_user_id,
      cancellation_reason = p_reason,
      updated_at = now()
  WHERE id = p_appointment_id;
END;
$$;

-- ============================================================================
-- HELPER: reschedule_appointment_by_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reschedule_appointment_by_admin(
  p_appointment_id UUID,
  p_new_start_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_professional_id UUID;
  v_appointment_professional_id UUID;
  v_service_id UUID;
  v_duration INTEGER;
  v_new_end_at TIMESTAMPTZ;
  v_current_status TEXT;
BEGIN
  -- Resolve professional_id for the admin
  v_admin_professional_id := public.get_auth_professional_id();
  IF v_admin_professional_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  -- Get appointment details
  SELECT professional_id, service_id, status
  INTO v_appointment_professional_id, v_service_id, v_current_status
  FROM public.appointments
  WHERE id = p_appointment_id
  LIMIT 1;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Appointment not found' USING ERRCODE = '40403';
  END IF;

  IF v_current_status != 'confirmed' THEN
    RAISE EXCEPTION 'Appointment cannot be rescheduled' USING ERRCODE = '42205';
  END IF;

  -- Verify the appointment belongs to the admin's professional
  IF v_appointment_professional_id != v_admin_professional_id THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40303';
  END IF;

  -- Get service duration
  SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes)
  INTO v_duration
  FROM public.professional_services ps
  JOIN public.services s ON s.id = ps.service_id
  WHERE ps.professional_id = v_appointment_professional_id
    AND ps.service_id = v_service_id
    AND ps.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not available' USING ERRCODE = '40401';
  END IF;

  v_new_end_at := p_new_start_at + (INTERVAL '1 minute' * v_duration);

  -- Validate new start time is in the future
  IF p_new_start_at <= now() THEN
    RAISE EXCEPTION 'Invalid start time' USING ERRCODE = '42201';
  END IF;

  -- Validate within availability
  IF NOT EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.professional_id = v_appointment_professional_id
      AND a.weekday = EXTRACT(DOW FROM p_new_start_at)::INTEGER
      AND p_new_start_at::TIME >= a.start_time
      AND v_new_end_at::TIME <= a.end_time
  ) THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no conflict with other appointments
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.professional_id = v_appointment_professional_id
      AND a.id != p_appointment_id
      AND a.status = 'confirmed'
      AND p_new_start_at < a.end_at
      AND v_new_end_at > a.start_at
  ) THEN
    RAISE EXCEPTION 'Time conflict' USING ERRCODE = '40901';
  END IF;

  UPDATE public.appointments
  SET start_at = p_new_start_at,
      end_at = v_new_end_at,
      updated_at = now()
  WHERE id = p_appointment_id;
END;
$$;

-- ============================================================================
-- HELPER: cancel_appointment_by_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_admin(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_professional_id UUID;
  v_appointment_professional_id UUID;
  v_current_status TEXT;
BEGIN
  v_admin_professional_id := public.get_auth_professional_id();
  IF v_admin_professional_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  SELECT professional_id, status
  INTO v_appointment_professional_id, v_current_status
  FROM public.appointments
  WHERE id = p_appointment_id
  LIMIT 1;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Appointment not found' USING ERRCODE = '40403';
  END IF;

  IF v_current_status != 'confirmed' THEN
    RAISE EXCEPTION 'Appointment cannot be cancelled' USING ERRCODE = '42204';
  END IF;

  IF v_appointment_professional_id != v_admin_professional_id THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40303';
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by_user_id = auth.uid(),
      cancellation_reason = p_reason,
      updated_at = now()
  WHERE id = p_appointment_id;
END;
$$;
