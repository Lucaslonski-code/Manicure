-- ============================================================================
-- 0022_schedule_reformulation.sql
-- Reformulação completa: multi-window, multi-break, vigência, autorização
-- FIXES: DROP→IF NOT EXISTS, get_available_slots WHERE, upsert vigência,
--        book_appointment overbooking, authorization clarity
-- ============================================================================

-- ============================================================================
-- 1. NOVA TABELA: work_windows (substitui work_schedules)
--    Cada linha = 1 janela de trabalho por dia da semana
--    Suporta múltiplas janelas por dia + vigência
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT work_windows_end_after_start CHECK (end_time > start_time),
  CONSTRAINT work_windows_valid_vigencia CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

ALTER TABLE public.work_windows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'work_windows_public_read' AND tablename = 'work_windows'
  ) THEN
    CREATE POLICY "work_windows_public_read"
      ON public.work_windows FOR SELECT
      USING (true);
  END IF;
END $$;

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
            AND u.role = 'admin'
            AND u.is_active = true
            AND u.deleted_at IS NULL
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_windows_professional_weekday
  ON public.work_windows(professional_id, weekday, effective_from);
CREATE INDEX IF NOT EXISTS idx_work_windows_effective
  ON public.work_windows(professional_id, effective_from, effective_until);

-- ============================================================================
-- 2. NOVA TABELA: schedule_breaks
--    Pausas associadas a uma work_window específica
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.schedule_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_window_id UUID NOT NULL REFERENCES public.work_windows(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT DEFAULT 'Pausa',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT schedule_breaks_end_after_start CHECK (end_time > start_time)
);

ALTER TABLE public.schedule_breaks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'schedule_breaks_public_read' AND tablename = 'schedule_breaks'
  ) THEN
    CREATE POLICY "schedule_breaks_public_read"
      ON public.schedule_breaks FOR SELECT
      USING (true);
  END IF;
END $$;

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
            AND u.role = 'admin'
            AND u.is_active = true
            AND u.deleted_at IS NULL
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schedule_breaks_window
  ON public.schedule_breaks(work_window_id);

-- ============================================================================
-- 3. ATUALIZAR schedule_overrides: adicionar colunas de pausa
-- ============================================================================
ALTER TABLE public.schedule_overrides
  ADD COLUMN IF NOT EXISTS break_start TIME,
  ADD COLUMN IF NOT EXISTS break_end TIME,
  ADD COLUMN IF NOT EXISTS break_label TEXT DEFAULT 'Pausa';

-- RLS atualizada para schedule_overrides: professional ownership
DROP POLICY IF EXISTS "schedule_overrides_admin_all" ON public.schedule_overrides;

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
            AND u.role = 'admin'
            AND u.is_active = true
            AND u.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. RPC: get_auth_professional_id
--    Retorna o professional_id do usuário autenticado (ou NULL)
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
-- 5. RPC: get_effective_windows
--    Retorna todas as janelas efetivas para uma data
--    Prioridade: override (com is_off) > work_windows dentro da vigência
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_effective_windows(
  p_professional_id UUID,
  p_date DATE
)
RETURNS TABLE (
  window_id UUID,
  start_time TIME,
  end_time TIME,
  is_off BOOLEAN,
  source TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- 1. Check override first (at most one per professional+date due to UNIQUE)
  SELECT
    NULL::UUID AS window_id,
    so.start_time,
    so.end_time,
    so.is_off,
    'override' AS source
  FROM public.schedule_overrides so
  WHERE so.professional_id = p_professional_id
    AND so.specific_date = p_date

  UNION ALL

  -- 2. If no override, use work_windows within vigência
  SELECT
    ww.id AS window_id,
    ww.start_time,
    ww.end_time,
    false AS is_off,
    'work_window' AS source
  FROM public.work_windows ww
  WHERE ww.professional_id = p_professional_id
    AND ww.weekday = EXTRACT(DOW FROM p_date)::INTEGER
    AND ww.is_active = true
    AND ww.effective_from <= p_date
    AND (ww.effective_until IS NULL OR ww.effective_until >= p_date)
    AND NOT EXISTS (
      SELECT 1 FROM public.schedule_overrides so2
      WHERE so2.professional_id = p_professional_id
        AND so2.specific_date = p_date
    )
  ORDER BY ww.sort_order, ww.start_time;
$$;

-- ============================================================================
-- 6. RPC: get_window_breaks
--    Retorna as pausas de uma janela específica
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_window_breaks(
  p_window_id UUID
)
RETURNS TABLE (
  break_id UUID,
  start_time TIME,
  end_time TIME,
  label TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    sb.id AS break_id,
    sb.start_time,
    sb.end_time,
    sb.label
  FROM public.schedule_breaks sb
  WHERE sb.work_window_id = p_window_id
  ORDER BY sb.sort_order, sb.start_time;
$$;

-- ============================================================================
-- 7. RPC: get_override_breaks
--    Retorna as pausas de uma exceção de data específica
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_override_breaks(
  p_professional_id UUID,
  p_date DATE
)
RETURNS TABLE (
  break_start TIME,
  break_end TIME,
  break_label TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    so.break_start,
    so.break_end,
    so.break_label
  FROM public.schedule_overrides so
  WHERE so.professional_id = p_professional_id
    AND so.specific_date = p_date
    AND so.break_start IS NOT NULL
    AND so.break_end IS NOT NULL
  ORDER BY so.break_start;
$$;

-- ============================================================================
-- 8. RPC: upsert_work_windows
--    Salva a jornada semanal completa (vigência-based: preserva histórico)
--    Aceita array de janelas, cada uma com suas pausas
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

  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_caller_id AND role = 'admin' AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  -- Verify professional exists
  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not found' USING ERRCODE = '40402';
  END IF;

  -- Authorization: if caller is a professional, they can only edit their own schedule
  -- If caller is admin but NOT a professional (global admin), they can edit any schedule
  v_auth_professional_id := public.get_auth_professional_id();
  IF v_auth_professional_id IS NOT NULL AND v_auth_professional_id != p_professional_id THEN
    RAISE EXCEPTION 'Cannot modify another professional schedule' USING ERRCODE = '40303';
  END IF;

  -- Close current-period active windows: set effective_until to yesterday
  -- Only close windows that are already in effect (effective_from <= today)
  -- Future-dated windows (effective_from > today) are preserved
  UPDATE public.work_windows
  SET is_active = false,
      effective_until = v_today - INTERVAL '1 day',
      updated_at = now()
  WHERE professional_id = p_professional_id
    AND is_active = true
    AND effective_from <= v_today;

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
        -- Validate break falls within the window
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
-- 9. RPC: upsert_schedule_override
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
    WHERE id = v_caller_id AND role = 'admin' AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not found' USING ERRCODE = '40402';
  END IF;

  -- Authorization: professional can only edit own schedule; global admin can edit any
  v_auth_professional_id := public.get_auth_professional_id();
  IF v_auth_professional_id IS NOT NULL AND v_auth_professional_id != p_professional_id THEN
    RAISE EXCEPTION 'Cannot modify another professional schedule' USING ERRCODE = '40303';
  END IF;

  -- Validate: if not off, must have start and end times
  IF NOT p_is_off AND (p_start_time IS NULL OR p_end_time IS NULL) THEN
    RAISE EXCEPTION 'Start and end times required when not off' USING ERRCODE = '42201';
  END IF;

  -- Validate break: if break_start provided, break_end must be too
  IF p_break_start IS NOT NULL AND p_break_end IS NULL THEN
    RAISE EXCEPTION 'Break end time required when break start is provided' USING ERRCODE = '42207';
  END IF;
  IF p_break_end IS NOT NULL AND p_break_start IS NULL THEN
    RAISE EXCEPTION 'Break start time required when break end is provided' USING ERRCODE = '42208';
  END IF;

  -- Validate break falls within override time range
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
-- 10. RPC: delete_schedule_override
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
    WHERE id = v_caller_id AND role = 'admin' AND is_active = true AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '40302';
  END IF;

  -- Authorization: professional can only delete own overrides; global admin can delete any
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
-- 11. RPC: book_appointment
--     Atualizada com multi-window + overbooking protection explícito
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
  v_slot_valid BOOLEAN := false;
  v_win RECORD;
  v_break_rec RECORD;
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

  -- Check each effective window for this date
  FOR v_win IN
    SELECT * FROM public.get_effective_windows(p_professional_id, v_date)
  LOOP
    -- Skip if day off
    IF v_win.is_off THEN
      CONTINUE;
    END IF;

    -- Check if slot fits within this window
    IF p_start_at::TIME >= v_win.start_time AND v_end_at::TIME <= v_win.end_time THEN
      v_slot_valid := true;

      -- Check window's breaks (from work_windows)
      IF v_win.window_id IS NOT NULL THEN
        FOR v_break_rec IN
          SELECT * FROM public.get_window_breaks(v_win.window_id)
        LOOP
          IF p_start_at::TIME < v_break_rec.end_time AND v_end_at::TIME > v_break_rec.start_time THEN
            RAISE EXCEPTION 'Time overlaps with break' USING ERRCODE = '42206';
          END IF;
        END LOOP;
      END IF;

      -- Check override's break
      IF v_win.source = 'override' THEN
        FOR v_break_rec IN
          SELECT * FROM public.get_override_breaks(p_professional_id, v_date)
        LOOP
          IF p_start_at::TIME < v_break_rec.break_end AND v_end_at::TIME > v_break_rec.break_start THEN
            RAISE EXCEPTION 'Time overlaps with break' USING ERRCODE = '42206';
          END IF;
        END LOOP;
      END IF;

      EXIT; -- Found valid window
    END IF;
  END LOOP;

  IF NOT v_slot_valid THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no blocked time overlap
  IF EXISTS (
    SELECT 1 FROM public.blocked_times b
    WHERE b.professional_id = p_professional_id
      AND p_start_at < b.end_at AND v_end_at > b.start_at
  ) THEN
    RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '42203';
  END IF;

  -- Explicit overbooking protection: check for overlapping confirmed appointments
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.professional_id = p_professional_id
      AND a.status IN ('confirmed', 'completed')
      AND p_start_at < a.end_at AND v_end_at > a.start_at
  ) THEN
    RAISE EXCEPTION 'Time conflict with existing appointment' USING ERRCODE = '40901';
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
-- 12. RPC: get_available_slots
--     Atualizada com multi-window + breaks
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
  effective_windows AS (
    SELECT ew.window_id, ew.start_time, ew.end_time, ew.is_off
    FROM public.get_effective_windows(p_professional_id, p_date) ew
    WHERE ew.is_off = false
  ),
  window_breaks AS (
    SELECT sb.start_time, sb.end_time
    FROM public.schedule_breaks sb
    JOIN effective_windows ew ON ew.window_id = sb.work_window_id
  ),
  override_breaks AS (
    SELECT so.break_start AS start_time, so.break_end AS end_time
    FROM public.schedule_overrides so
    WHERE so.professional_id = p_professional_id
      AND so.specific_date = p_date
      AND so.break_start IS NOT NULL
      AND so.break_end IS NOT NULL
  ),
  all_breaks AS (
    SELECT * FROM window_breaks
    UNION ALL
    SELECT * FROM override_breaks
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
      AND a.status IN ('confirmed', 'completed')
      AND DATE(a.start_at AT TIME ZONE 'America/Sao_Paulo') = p_date
  ),
  slots AS (
    SELECT
      ew.window_id,
      generate_series(
        (p_date + ew.start_time)::TIMESTAMPTZ,
        (p_date + ew.end_time - INTERVAL '1 minute' * sd.duration)::TIMESTAMPTZ,
        INTERVAL '30 minutes'
      ) AS slot_start
    FROM effective_windows ew
    CROSS JOIN service_duration sd
  ),
  with_end AS (
    SELECT
      s.window_id,
      s.slot_start AS start_at,
      (s.slot_start + INTERVAL '1 minute' * sd.duration)::TIMESTAMPTZ AS end_at
    FROM slots s
    CROSS JOIN service_duration sd
  )
  SELECT we.start_at, we.end_at
  FROM with_end we
  WHERE NOT EXISTS (
    SELECT 1 FROM all_breaks ab
    WHERE we.start_at::TIME < ab.end_time AND we.end_at::TIME > ab.start_time
  )
  AND NOT EXISTS (
    SELECT 1 FROM day_blocked db
    WHERE we.start_at < db.end_at AND we.end_at > db.start_at
  )
  AND NOT EXISTS (
    SELECT 1 FROM existing_appointments ea
    WHERE we.start_at < ea.end_at AND we.end_at > ea.start_at
  )
  AND we.start_at > now()
  ORDER BY we.start_at;
$$;

-- ============================================================================
-- 13. RPC: get_professional_schedule_data
--     Retorna dados completos da agenda para o profissional/admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_professional_schedule_data(
  p_professional_id UUID
)
RETURNS TABLE (
  window_id UUID,
  weekday INTEGER,
  start_time TIME,
  end_time TIME,
  sort_order INTEGER,
  is_active BOOLEAN,
  effective_from DATE,
  effective_until DATE,
  break_id UUID,
  break_start TIME,
  break_end TIME,
  break_label TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    ww.id AS window_id,
    ww.weekday,
    ww.start_time,
    ww.end_time,
    ww.sort_order,
    ww.is_active,
    ww.effective_from,
    ww.effective_until,
    sb.id AS break_id,
    sb.start_time AS break_start,
    sb.end_time AS break_end,
    sb.label AS break_label
  FROM public.work_windows ww
  LEFT JOIN public.schedule_breaks sb ON sb.work_window_id = ww.id
  WHERE ww.professional_id = p_professional_id
  ORDER BY ww.weekday, ww.sort_order, ww.start_time, sb.sort_order, sb.start_time;
$$;

-- ============================================================================
-- 14. LIMPAR SISTEMA LEGADO (manter blocked_times para bloqueios pontuais)
-- ============================================================================
-- As tabelas availability e blocked_times permanecem para backward compatibility
-- Mas os novos dados devem usar work_windows + schedule_breaks + schedule_overrides

-- ============================================================================
-- 14a. ATUALIZAR edit_appointment_by_client para usar get_effective_windows
--      (substitui validação legada contra tabela availability)
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
  v_date DATE;
  v_slot_valid BOOLEAN := false;
  v_win RECORD;
  v_break_rec RECORD;
BEGIN
  v_client_user_id := auth.uid();
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40101';
  END IF;

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

  IF NOT EXISTS (
    SELECT 1 FROM public.professionals WHERE id = p_new_professional_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Professional not available' USING ERRCODE = '40402';
  END IF;

  SELECT COALESCE(ps.duration_minutes, s.default_duration_minutes)
  INTO v_duration
  FROM public.professional_services ps
  JOIN public.services s ON s.id = ps.service_id
  WHERE ps.professional_id = p_new_professional_id
    AND ps.service_id = p_new_service_id
    AND ps.is_active = true AND s.is_active = true
  LIMIT 1;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not available for this professional' USING ERRCODE = '40401';
  END IF;

  v_new_end_at := p_new_start_at + (INTERVAL '1 minute' * v_duration);
  v_date := (p_new_start_at AT TIME ZONE 'America/Sao_Paulo')::DATE;

  IF p_new_start_at <= now() THEN
    RAISE EXCEPTION 'Invalid start time' USING ERRCODE = '42201';
  END IF;

  -- Validate within effective windows (same logic as book_appointment)
  FOR v_win IN
    SELECT * FROM public.get_effective_windows(p_new_professional_id, v_date)
  LOOP
    IF v_win.is_off THEN CONTINUE; END IF;

    IF p_new_start_at::TIME >= v_win.start_time AND v_new_end_at::TIME <= v_win.end_time THEN
      v_slot_valid := true;

      IF v_win.window_id IS NOT NULL THEN
        FOR v_break_rec IN SELECT * FROM public.get_window_breaks(v_win.window_id) LOOP
          IF p_new_start_at::TIME < v_break_rec.end_time AND v_new_end_at::TIME > v_break_rec.start_time THEN
            RAISE EXCEPTION 'Time overlaps with break' USING ERRCODE = '42206';
          END IF;
        END LOOP;
      END IF;

      IF v_win.source = 'override' THEN
        FOR v_break_rec IN SELECT * FROM public.get_override_breaks(p_new_professional_id, v_date) LOOP
          IF p_new_start_at::TIME < v_break_rec.break_end AND v_new_end_at::TIME > v_break_rec.break_start THEN
            RAISE EXCEPTION 'Time overlaps with break' USING ERRCODE = '42206';
          END IF;
        END LOOP;
      END IF;

      EXIT;
    END IF;
  END LOOP;

  IF NOT v_slot_valid THEN
    RAISE EXCEPTION 'Time outside availability' USING ERRCODE = '42202';
  END IF;

  -- Validate no blocked time overlap
  IF EXISTS (
    SELECT 1 FROM public.blocked_times b
    WHERE b.professional_id = p_new_professional_id
      AND p_new_start_at < b.end_at AND v_new_end_at > b.start_at
  ) THEN
    RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '42203';
  END IF;

  -- Validate no overlap with other appointments (excluding this one)
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.professional_id = p_new_professional_id
      AND a.id != p_appointment_id
      AND a.status IN ('confirmed', 'completed')
      AND p_new_start_at < a.end_at AND v_new_end_at > a.start_at
  ) THEN
    RAISE EXCEPTION 'Time conflict' USING ERRCODE = '40901';
  END IF;

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
-- 15. MIGRAR DADOS DE work_schedules PARA work_windows
--     Idempotent: checks for existing data before inserting
-- ============================================================================
INSERT INTO public.work_windows (
  professional_id, weekday, start_time, end_time,
  sort_order, is_active, effective_from, effective_until
)
SELECT
  ws.professional_id,
  ws.weekday,
  ws.start_time,
  ws.end_time,
  0 AS sort_order,
  ws.is_active,
  CURRENT_DATE AS effective_from,
  ws.effective_until
FROM public.work_schedules ws
WHERE ws.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.work_windows ww
    WHERE ww.professional_id = ws.professional_id
      AND ww.weekday = ws.weekday
      AND ww.start_time = ws.start_time
      AND ww.end_time = ws.end_time
      AND ww.is_active = true
  );

-- Migrar lunch breaks de work_schedules para schedule_breaks (idempotent)
INSERT INTO public.schedule_breaks (
  work_window_id, start_time, end_time, label, sort_order
)
SELECT
  ww.id,
  ws.lunch_start,
  ws.lunch_end,
  'Almoço' AS label,
  0 AS sort_order
FROM public.work_schedules ws
JOIN public.work_windows ww ON
  ww.professional_id = ws.professional_id
  AND ww.weekday = ws.weekday
WHERE ws.is_active = true
  AND ws.lunch_start IS NOT NULL
  AND ws.lunch_end IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.schedule_breaks sb
    WHERE sb.work_window_id = ww.id
      AND sb.start_time = ws.lunch_start
      AND sb.end_time = ws.lunch_end
  );
