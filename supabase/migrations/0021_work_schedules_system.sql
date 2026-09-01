-- ============================================================================
-- 0021_work_schedules_system.sql
-- Reformulação completa do sistema de disponibilidade
-- ============================================================================

-- ============================================================================
-- 1. Nova tabela: work_schedules (substitui availability)
--    Define o horário de trabalho recorrente por dia da semana
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL CHECK (end_time > start_time),
  lunch_start TIME,
  lunch_end TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, weekday)
);

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_schedules_public_read"
  ON public.work_schedules FOR SELECT
  USING (true);

CREATE POLICY "work_schedules_admin_all"
  ON public.work_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.is_active = true
        AND u.deleted_at IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_work_schedules_professional
  ON public.work_schedules(professional_id, weekday);

-- ============================================================================
-- 2. Nova tabela: schedule_overrides (substitui blocked_times)
--    Exceções para datas específicas (folga, horário diferente, almoço diferente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  specific_date DATE NOT NULL,
  is_off BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, specific_date)
);

ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_overrides_public_read"
  ON public.schedule_overrides FOR SELECT
  USING (true);

CREATE POLICY "schedule_overrides_admin_all"
  ON public.schedule_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.is_active = true
        AND u.deleted_at IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_schedule_overrides_professional_date
  ON public.schedule_overrides(professional_id, specific_date);

-- ============================================================================
-- 3. Manter blocked_times para bloqueios pontuais de emergência
--    (uma única vez, não recorrente)
-- ============================================================================

-- ============================================================================
-- 4. RPC: get_effective_schedule
--    Retorna o horário efetivo para uma data específica
--    Prioridade: override > work_schedule > null
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_effective_schedule(
  p_professional_id UUID,
  p_date DATE
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  is_off BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- 1. Check for specific date override first
  SELECT
    so.start_time,
    so.end_time,
    so.lunch_start,
    so.lunch_end,
    so.is_off
  FROM public.schedule_overrides so
  WHERE so.professional_id = p_professional_id
    AND so.specific_date = p_date
  LIMIT 1

  UNION ALL

  -- 2. If no override, use the recurring work schedule for this weekday
  SELECT
    ws.start_time,
    ws.end_time,
    ws.lunch_start,
    ws.lunch_end,
    false AS is_off
  FROM public.work_schedules ws
  WHERE ws.professional_id = p_professional_id
    AND ws.weekday = EXTRACT(DOW FROM p_date)::INTEGER
    AND ws.is_active = true
    -- Only if no override exists for this date
    AND NOT EXISTS (
      SELECT 1 FROM public.schedule_overrides so2
      WHERE so2.professional_id = p_professional_id
        AND so2.specific_date = p_date
    )
  LIMIT 1;
$$;

-- ============================================================================
-- 5. RPC: get_effective_schedule_range
--    Retorna o horário efetivo para um range de datas (para o calendário)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_effective_schedule_range(
  p_professional_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  effective_date DATE,
  start_time TIME,
  end_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  is_off BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH dates AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE AS d
  ),
  with_weekday AS (
    SELECT d, EXTRACT(DOW FROM d)::INTEGER AS weekday FROM dates
  ),
  base AS (
    SELECT
      ww.d AS effective_date,
      ww.weekday,
      COALESCE(
        (SELECT so.start_time FROM public.schedule_overrides so
         WHERE so.professional_id = p_professional_id AND so.specific_date = ww.d LIMIT 1),
        (SELECT ws.start_time FROM public.work_schedules ws
         WHERE ws.professional_id = p_professional_id AND ws.weekday = ww.weekday AND ws.is_active = true LIMIT 1)
      ) AS start_time,
      COALESCE(
        (SELECT so.end_time FROM public.schedule_overrides so
         WHERE so.professional_id = p_professional_id AND so.specific_date = ww.d LIMIT 1),
        (SELECT ws.end_time FROM public.work_schedules ws
         WHERE ws.professional_id = p_professional_id AND ws.weekday = ww.weekday AND ws.is_active = true LIMIT 1)
      ) AS end_time,
      COALESCE(
        (SELECT so.lunch_start FROM public.schedule_overrides so
         WHERE so.professional_id = p_professional_id AND so.specific_date = ww.d LIMIT 1),
        (SELECT ws.lunch_start FROM public.work_schedules ws
         WHERE ws.professional_id = p_professional_id AND ws.weekday = ww.weekday AND ws.is_active = true LIMIT 1)
      ) AS lunch_start,
      COALESCE(
        (SELECT so.lunch_end FROM public.schedule_overrides so
         WHERE so.professional_id = p_professional_id AND so.specific_date = ww.d LIMIT 1),
        (SELECT ws.lunch_end FROM public.work_schedules ws
         WHERE ws.professional_id = p_professional_id AND ws.weekday = ww.weekday AND ws.is_active = true LIMIT 1)
      ) AS lunch_end,
      COALESCE(
        (SELECT so.is_off FROM public.schedule_overrides so
         WHERE so.professional_id = p_professional_id AND so.specific_date = ww.d LIMIT 1),
        false
      ) AS is_off
    FROM with_weekday ww
  )
  SELECT b.effective_date, b.start_time, b.end_time, b.lunch_start, b.lunch_end, b.is_off
  FROM base b
  WHERE b.start_time IS NOT NULL AND b.end_time IS NOT NULL
  ORDER BY b.effective_date;
$$;

-- ============================================================================
-- 6. RPC: upsert_work_schedules
--    Salva a agenda semanal completa (upsert por professional_id + weekday)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_work_schedules(
  p_professional_id UUID,
  p_schedules JSONB
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_item JSONB;
BEGIN
  -- Only the professional's admin can edit
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_admin_id AND role = 'admin' AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  -- Validate professional exists
  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not found' USING ERRCODE = '40402';
  END IF;

  -- Deactivate all existing schedules for this professional
  UPDATE public.work_schedules
  SET is_active = false, updated_at = now()
  WHERE professional_id = p_professional_id;

  -- Upsert each schedule item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_schedules)
  LOOP
    INSERT INTO public.work_schedules (
      professional_id, weekday, start_time, end_time,
      lunch_start, lunch_end, is_active
    ) VALUES (
      p_professional_id,
      (v_item->>'weekday')::INTEGER,
      (v_item->>'start_time')::TIME,
      (v_item->>'end_time')::TIME,
      CASE WHEN v_item->>'lunch_start' IS NOT NULL THEN (v_item->>'lunch_start')::TIME ELSE NULL END,
      CASE WHEN v_item->>'lunch_end' IS NOT NULL THEN (v_item->>'lunch_end')::TIME ELSE NULL END,
      true
    )
    ON CONFLICT (professional_id, weekday)
    DO UPDATE SET
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      lunch_start = EXCLUDED.lunch_start,
      lunch_end = EXCLUDED.lunch_end,
      is_active = true,
      updated_at = now();
  END LOOP;
END;
$$;

-- ============================================================================
-- 7. RPC: upsert_schedule_override
--    Cria ou atualiza uma exceção para uma data específica
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_schedule_override(
  p_professional_id UUID,
  p_specific_date DATE,
  p_is_off BOOLEAN DEFAULT false,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_lunch_start TIME DEFAULT NULL,
  p_lunch_end TIME DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_admin_id AND role = 'admin' AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not found' USING ERRCODE = '40402';
  END IF;

  -- Validate: if not off, must have start and end times
  IF NOT p_is_off AND (p_start_time IS NULL OR p_end_time IS NULL) THEN
    RAISE EXCEPTION 'Start and end times required when not off' USING ERRCODE = '42201';
  END IF;

  INSERT INTO public.schedule_overrides (
    professional_id, specific_date, is_off,
    start_time, end_time, lunch_start, lunch_end, reason
  ) VALUES (
    p_professional_id, p_specific_date, p_is_off,
    p_start_time, p_end_time, p_lunch_start, p_lunch_end, p_reason
  )
  ON CONFLICT (professional_id, specific_date)
  DO UPDATE SET
    is_off = EXCLUDED.is_off,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end,
    reason = EXCLUDED.reason,
    updated_at = now();
END;
$$;

-- ============================================================================
-- 8. RPC: delete_schedule_override
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
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  DELETE FROM public.schedule_overrides
  WHERE professional_id = p_professional_id
    AND specific_date = p_specific_date;
END;
$$;

-- ============================================================================
-- 9. Atualizar book_appointment para usar work_schedules + schedule_overrides
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
  v_date DATE;
  v_sched RECORD;
  v_lunch_overlap BOOLEAN;
BEGIN
  v_client_user_id := auth.uid();
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_client_user_id AND role = 'client' AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40301';
  END IF;

  SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes)
  INTO v_duration
  FROM public.professional_services ps
  JOIN public.services s ON s.id = ps.service_id
  WHERE ps.professional_id = p_professional_id AND ps.service_id = p_service_id
    AND ps.is_active = true AND s.is_active = true
  LIMIT 1;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not available for this professional' USING ERRCODE = '40401';
  END IF;

  v_end_at := p_start_at + (INTERVAL '1 minute' * v_duration);
  v_date := (p_start_at AT TIME ZONE 'America/Sao_Paulo')::DATE;

  IF p_start_at <= now() THEN
    RAISE EXCEPTION 'Invalid start time' USING ERRCODE = '42201';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not available' USING ERRCODE = '40402';
  END IF;

  -- Get effective schedule for the date
  SELECT es.* INTO v_sched
  FROM public.get_effective_schedule(p_professional_id, v_date) es
  LIMIT 1;

  -- If no schedule or day off, reject
  IF v_sched IS NULL OR v_sched.is_off THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate within work hours
  IF p_start_at::TIME < v_sched.start_time OR v_end_at::TIME > v_sched.end_time THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no lunch overlap
  IF v_sched.lunch_start IS NOT NULL AND v_sched.lunch_end IS NOT NULL THEN
    v_lunch_overlap := (p_start_at::TIME < v_sched.lunch_end AND v_end_at::TIME > v_sched.lunch_start);
    IF v_lunch_overlap THEN
      RAISE EXCEPTION 'Time overlaps with lunch break' USING ERRCODE = '42206';
    END IF;
  END IF;

  -- Validate no blocked time overlap
  IF EXISTS (
    SELECT 1 FROM public.blocked_times b
    WHERE b.professional_id = p_professional_id
      AND p_start_at < b.end_at AND v_end_at > b.start_at
  ) THEN
    RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '42203';
  END IF;

  INSERT INTO public.appointments (
    client_user_id, professional_id, service_id,
    start_at, end_at, status, client_note
  ) VALUES (
    v_client_user_id, p_professional_id, p_service_id,
    p_start_at, v_end_at, 'confirmed', p_client_note
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- ============================================================================
-- 10. Atualizar get_available_slots para usar work_schedules + schedule_overrides
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
    WHERE ps.professional_id = p_professional_id AND ps.service_id = p_service_id
      AND ps.is_active = true AND s.is_active = true
    LIMIT 1
  ),
  effective AS (
    SELECT es.* FROM public.get_effective_schedule(p_professional_id, p_date) es
    LIMIT 1
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
        (p_date + e.start_time)::TIMESTAMPTZ,
        (p_date + e.end_time - INTERVAL '1 minute' * sd.duration)::TIMESTAMPTZ,
        INTERVAL '30 minutes'
      ) AS slot_start
    FROM effective e
    CROSS JOIN service_duration sd
    WHERE e.is_off = false
  ),
  with_end AS (
    SELECT
      s.slot_start AS start_at,
      (s.slot_start + INTERVAL '1 minute' * sd.duration)::TIMESTAMPTZ AS end_at
    FROM slots s
    CROSS JOIN service_duration sd
  )
  SELECT we.start_at, we.end_at
  FROM with_end we
  -- Exclude lunch overlap
  WHERE NOT EXISTS (
    SELECT 1 FROM effective e
    WHERE e.lunch_start IS NOT NULL AND e.lunch_end IS NOT NULL
      AND we.start_at::TIME < e.lunch_end AND we.end_at::TIME > e.lunch_start
  )
  -- Exclude blocked times
  AND NOT EXISTS (
    SELECT 1 FROM day_blocked db
    WHERE we.start_at < db.end_at AND we.end_at > db.start_at
  )
  -- Exclude existing appointments
  AND NOT EXISTS (
    SELECT 1 FROM existing_appointments ea
    WHERE we.start_at < ea.end_at AND we.end_at > ea.start_at
  )
  ORDER BY we.start_at;
$$;
