-- ============================================================================
-- 0020_avatar_and_client_edit.sql
-- ============================================================================

-- ============================================================================
-- 1. Add avatar_url column to users table
-- ============================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- 2. edit_appointment_by_client — true PUT (updates in place)
--    Accepts: appointment_id, new professional_id, new service_id, new start_at
--    Validates: ownership, status=confirmed, availability, blocks, overlap
--    Updates: professional_id, service_id, start_at, end_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.edit_appointment_by_client(
  p_appointment_id UUID,
  p_new_professional_id UUID,
  p_new_service_id UUID,
  p_new_start_at TIMESTAMPTZ,
  p_client_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_user_id UUID;
  v_current_status TEXT;
  v_duration INTEGER;
  v_new_end_at TIMESTAMPTZ;
BEGIN
  v_client_user_id := auth.uid();
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  -- Get current appointment
  SELECT status
  INTO v_current_status
  FROM public.appointments
  WHERE id = p_appointment_id
    AND client_user_id = v_client_user_id
  LIMIT 1;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Appointment not found' USING ERRCODE = '40403';
  END IF;

  IF v_current_status != 'confirmed' THEN
    RAISE EXCEPTION 'Appointment cannot be edited' USING ERRCODE = '42205';
  END IF;

  -- Validate new professional is active
  IF NOT EXISTS (
    SELECT 1 FROM public.professionals
    WHERE id = p_new_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not available' USING ERRCODE = '40402';
  END IF;

  -- Validate new service is offered by the new professional
  SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes)
  INTO v_duration
  FROM public.professional_services ps
  JOIN public.services s ON s.id = ps.service_id
  WHERE ps.professional_id = p_new_professional_id
    AND ps.service_id = p_new_service_id
    AND ps.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not available for this professional' USING ERRCODE = '40401';
  END IF;

  v_new_end_at := p_new_start_at + (INTERVAL '1 minute' * v_duration);

  -- Validate start_at is in the future
  IF p_new_start_at <= now() THEN
    RAISE EXCEPTION 'Invalid start time' USING ERRCODE = '42201';
  END IF;

  -- Validate within availability
  IF NOT EXISTS (
    SELECT 1 FROM public.availability a
    WHERE a.professional_id = p_new_professional_id
      AND a.weekday = EXTRACT(DOW FROM p_new_start_at)::INTEGER
      AND p_new_start_at::TIME >= a.start_time
      AND v_new_end_at::TIME <= a.end_time
  ) THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no blocked time overlap
  IF EXISTS (
    SELECT 1 FROM public.blocked_times b
    WHERE b.professional_id = p_new_professional_id
      AND p_new_start_at < b.end_at
      AND v_new_end_at > b.start_at
  ) THEN
    RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '42203';
  END IF;

  -- Validate no conflict with other appointments (excluding this one)
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.professional_id = p_new_professional_id
      AND a.id != p_appointment_id
      AND a.status = 'confirmed'
      AND p_new_start_at < a.end_at
      AND v_new_end_at > a.start_at
  ) THEN
    RAISE EXCEPTION 'Time conflict' USING ERRCODE = '40901';
  END IF;

  -- Apply update (true PUT — same appointment, new values)
  UPDATE public.appointments
  SET professional_id = p_new_professional_id,
      service_id = p_new_service_id,
      start_at = p_new_start_at,
      end_at = v_new_end_at,
      client_note = COALESCE(p_client_note, client_note),
      updated_at = now()
  WHERE id = p_appointment_id;
END;
$$;

-- ============================================================================
-- 3. Storage bucket for avatars (manual step)
-- ============================================================================
-- Run in Supabase Dashboard > Storage > New bucket:
--   Name: avatars
--   Public: true
--   File size limit: 2MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
