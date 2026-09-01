-- ============================================================================
-- 0020_avatar_and_client_edit.sql
-- ============================================================================

-- ============================================================================
-- 1. Add avatar_url column to users table
-- ============================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- 2. Add service_id update support via reschedule_appointment_by_client
-- ============================================================================
-- This RPC allows a client to reschedule their own appointment (date/time).
-- Changing service or professional requires cancel + rebook (handled in frontend).
CREATE OR REPLACE FUNCTION public.reschedule_appointment_by_client(
  p_appointment_id UUID,
  p_new_start_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_user_id UUID;
  v_service_id UUID;
  v_duration INTEGER;
  v_new_end_at TIMESTAMPTZ;
  v_current_status TEXT;
BEGIN
  v_client_user_id := auth.uid();
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  SELECT service_id, status
  INTO v_service_id, v_current_status
  FROM public.appointments
  WHERE id = p_appointment_id
    AND client_user_id = v_client_user_id
  LIMIT 1;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Appointment not found' USING ERRCODE = '40403';
  END IF;

  IF v_current_status != 'confirmed' THEN
    RAISE EXCEPTION 'Appointment cannot be rescheduled' USING ERRCODE = '42205';
  END IF;

  -- Get service duration from the appointment's professional+service
  SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes)
  INTO v_duration
  FROM public.professional_services ps
  JOIN public.services s ON s.id = ps.service_id
  JOIN public.appointments a ON a.professional_id = ps.professional_id AND a.service_id = ps.service_id
  WHERE a.id = p_appointment_id
    AND ps.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not available' USING ERRCODE = '40401';
  END IF;

  v_new_end_at := p_new_start_at + (INTERVAL '1 minute' * v_duration);

  -- Validate new start time is in the future
  IF p_new_start_at <= now() THEN
    RAISE EXCEPTION 'Invalid start time' USING ERRCODE = 42201;
  END IF;

  -- Validate within availability
  IF NOT EXISTS (
    SELECT 1 FROM public.availability a
    JOIN public.appointments ap ON ap.id = p_appointment_id
    WHERE a.professional_id = ap.professional_id
      AND a.weekday = EXTRACT(DOW FROM p_new_start_at)::INTEGER
      AND p_new_start_at::TIME >= a.start_time
      AND v_new_end_at::TIME <= a.end_time
  ) THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no blocked time overlap
  IF EXISTS (
    SELECT 1 FROM public.blocked_times b
    JOIN public.appointments ap ON ap.id = p_appointment_id
    WHERE b.professional_id = ap.professional_id
      AND p_new_start_at < b.end_at
      AND v_new_end_at > b.start_at
  ) THEN
    RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '42203';
  END IF;

  -- Validate no conflict with other appointments
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.appointments ap ON ap.id = p_appointment_id
    WHERE a.professional_id = ap.professional_id
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
-- 3. Storage bucket for avatars
-- ============================================================================
-- Note: Supabase storage buckets must be created via Dashboard or API.
-- Run this in the Supabase Dashboard > Storage > New bucket:
--   Name: avatars
--   Public: true
--   File size limit: 2MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
