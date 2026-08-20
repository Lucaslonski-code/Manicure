-- ============================================================================
-- 0002_rls_policies.sql
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_professional_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id FROM public.professionals p
  JOIN public.users u ON u.id = p.user_id
  WHERE u.id = auth.uid() AND u.role = 'admin' AND u.deleted_at IS NULL AND p.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND deleted_at IS NULL
  );
$$;

-- ============================================================================
-- USERS
-- ============================================================================

-- Users can read own profile
CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_select_admin ON public.users
  FOR SELECT USING (public.is_admin());

-- Users can update own profile
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- No one can update other users via Data API.
-- Admin user management must be done through SECURITY DEFINER RPCs with explicit validation.

-- Only internal processes can insert users (via SECURITY DEFINER trigger/function)
CREATE POLICY users_insert_internal ON public.users
  FOR INSERT WITH CHECK (false);

-- No one can delete users via Data API
CREATE POLICY users_delete_internal ON public.users
  FOR DELETE USING (false);

-- ============================================================================
-- PROFESSIONALS
-- ============================================================================

-- Public read for active professionals
CREATE POLICY professionals_select_public ON public.professionals
  FOR SELECT USING (is_active = true);

-- Admins can read all professionals
CREATE POLICY professionals_select_admin ON public.professionals
  FOR SELECT USING (public.is_admin());

-- Only admins can insert/update/delete professionals
CREATE POLICY professionals_insert_admin ON public.professionals
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY professionals_update_admin ON public.professionals
  FOR UPDATE USING (public.is_admin());

CREATE POLICY professionals_delete_admin ON public.professionals
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- SERVICES
-- ============================================================================

-- Public read for active services
CREATE POLICY services_select_public ON public.services
  FOR SELECT USING (is_active = true);

-- Admins can read all services
CREATE POLICY services_select_admin ON public.services
  FOR SELECT USING (public.is_admin());

-- Only admins can insert/update/delete services
CREATE POLICY services_insert_admin ON public.services
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY services_update_admin ON public.services
  FOR UPDATE USING (public.is_admin());

CREATE POLICY services_delete_admin ON public.services
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- PROFESSIONAL_SERVICES
-- ============================================================================

-- Public read for active professional services
CREATE POLICY professional_services_select_public ON public.professional_services
  FOR SELECT USING (is_active = true);

-- Admins can read all professional services
CREATE POLICY professional_services_select_admin ON public.professional_services
  FOR SELECT USING (public.is_admin());

-- Only the professional owner can insert/update/delete their professional services
CREATE POLICY professional_services_insert_owner ON public.professional_services
  FOR INSERT WITH CHECK (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

CREATE POLICY professional_services_update_owner ON public.professional_services
  FOR UPDATE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

CREATE POLICY professional_services_delete_owner ON public.professional_services
  FOR DELETE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================

-- Client can read own appointments
CREATE POLICY appointments_select_client ON public.appointments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    client_user_id = auth.uid()
  );

-- Admin can read all appointments (global agenda)
CREATE POLICY appointments_select_admin ON public.appointments
  FOR SELECT USING (public.is_admin());

-- Client can insert own appointments
CREATE POLICY appointments_insert_client ON public.appointments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    client_user_id = auth.uid()
  );

-- Admin can update only own professional's appointments
CREATE POLICY appointments_update_admin ON public.appointments
  FOR UPDATE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

-- Admin can delete only own professional's appointments
CREATE POLICY appointments_delete_admin ON public.appointments
  FOR DELETE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

-- ============================================================================
-- AVAILABILITY
-- ============================================================================

-- Public read for availability
CREATE POLICY availability_select_public ON public.availability
  FOR SELECT USING (true);

-- Only the professional owner can insert/update/delete availability
CREATE POLICY availability_insert_owner ON public.availability
  FOR INSERT WITH CHECK (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

CREATE POLICY availability_update_owner ON public.availability
  FOR UPDATE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

CREATE POLICY availability_delete_owner ON public.availability
  FOR DELETE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

-- ============================================================================
-- BLOCKED_TIMES
-- ============================================================================

-- Public read for blocked times
CREATE POLICY blocked_times_select_public ON public.blocked_times
  FOR SELECT USING (true);

-- Only the professional owner can insert/update/delete blocked times
CREATE POLICY blocked_times_insert_owner ON public.blocked_times
  FOR INSERT WITH CHECK (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

CREATE POLICY blocked_times_update_owner ON public.blocked_times
  FOR UPDATE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

CREATE POLICY blocked_times_delete_owner ON public.blocked_times
  FOR DELETE USING (
    public.is_admin() AND
    professional_id = public.get_auth_professional_id()
  );

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Users can read own notifications
CREATE POLICY notifications_select_self ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- AUDIT_LOGS
-- ============================================================================

-- Only admins can read audit logs
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- Only internal processes can insert audit logs (via triggers or SECURITY DEFINER functions)
CREATE POLICY audit_logs_insert_internal ON public.audit_logs
  FOR INSERT WITH CHECK (false);

-- ============================================================================
-- BUSINESS_SETTINGS
-- ============================================================================

-- Public read for business settings
CREATE POLICY business_settings_select_public ON public.business_settings
  FOR SELECT USING (true);

-- Only admins can update business settings
CREATE POLICY business_settings_update_admin ON public.business_settings
  FOR UPDATE USING (public.is_admin());
