/**
 * Real Supabase Integration Tests
 *
 * These tests require:
 * - EXPO_PUBLIC_SUPABASE_URL set to a real Supabase project
 * - EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY set (anon key)
 *
 * They create real auth users and test RLS, RPCs, and constraints.
 * Cleanup is best-effort.
 *
 * Run with: npx jest src/__tests__/integration/supabase-real.test.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function createTestClient(): SupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

const isConfigured = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return !!supabaseUrl && !supabaseUrl.includes('your-project');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Supabase Real Integration Tests', () => {
  if (!isConfigured()) {
    it('skips all real integration tests when Supabase is not configured', () => {
      console.warn('Skipping real integration tests: Supabase not configured');
    });
    return;
  }

  describe('Authentication', () => {
    it('should reject invalid credentials', async () => {
      const client = createTestClient();

      const { data, error } = await client.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(error).not.toBeNull();
      expect(data.user).toBeNull();
    });

    it('should sign up a new client user with valid data', async () => {
      const client = createTestClient();
      const email = `test-c-${Date.now()}@example.com`;
      const password = 'Test1234!Aa';

      await delay(3000);

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { name: 'Test Client', phone: '11999999999' },
        },
      });

      if ((error as any)?.message?.toLowerCase().includes('rate limit')) {
        console.warn('Rate limited on signup, skipping test');
        return;
      }

      expect(error).toBeNull();
      expect(data.user).not.toBeNull();
      expect(data.user?.email).toBe(email);
      expect(data.user?.email_confirmed_at).toBeNull();

      if (data.user) {
        try {
          await client.auth.admin.deleteUser(data.user.id);
        } catch {
          // cleanup best-effort; service_role may not be available
        }
      }
    });

    it('should require email confirmation before sign-in', async () => {
      const client = createTestClient();
      const email = `test-unconfirmed-${Date.now()}@example.com`;
      const password = 'Test1234!Aa';

      await delay(3000);

      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: { data: { name: 'Test', phone: '11999999999' } },
      });

      if ((signUpError as any)?.message?.toLowerCase().includes('rate limit')) {
        console.warn('Rate limited, skipping email confirmation test');
        return;
      }

      expect(signUpData.user).not.toBeNull();

      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      expect((signInError as any)?.message.toLowerCase()).toMatch(/email not confirmed|email_not_confirmed/);
      expect(signInData.user).toBeNull();

      if (signUpData.user) {
        try {
          await client.auth.admin.deleteUser(signUpData.user.id);
        } catch {
          // best-effort cleanup
        }
      }
    });
  });

  describe('RLS - Client Isolation', () => {
    let clientAId: string;
    let clientBId: string;
    let clientAToken: string;

    beforeAll(async () => {
      const client = createTestClient();

      await delay(3000);

      const emailA = `cla-${Date.now()}@example.com`;
      const password = 'Test1234!Aa';
      const { data: userA, error: userAError } = await client.auth.signUp({
        email: emailA,
        password,
        options: { data: { name: 'Client A', phone: '11999999991' } },
      });

      if ((userAError as any)?.message?.toLowerCase().includes('rate limit')) {
        console.warn('Rate limited in beforeAll, skipping RLS tests');
        return;
      }

      expect(userA?.user).not.toBeNull();
      if (!userA?.user) return;
      clientAId = userA.user.id;

      const { data: signInA, error: signInAError } = await client.auth.signInWithPassword({
        email: emailA,
        password,
      });

      expect(signInAError).toBeNull();
      expect(signInA?.session).not.toBeNull();
      if (!signInA?.session) return;
      clientAToken = signInA.session.access_token;

      const emailB = `clb-${Date.now()}@example.com`;
      const { data: userB } = await client.auth.signUp({
        email: emailB,
        password,
        options: { data: { name: 'Client B', phone: '11999999992' } },
      });

      expect(userB?.user).not.toBeNull();
      if (!userB?.user) return;
      clientBId = userB.user.id;

      const { data: signInB } = await client.auth.signInWithPassword({
        email: emailB,
        password,
      });

      expect(signInB?.session).not.toBeNull();
    });

    afterAll(async () => {
      if (!clientAId && !clientBId) return;
      const client = createTestClient();
      try {
        if (clientAId) await client.auth.admin.deleteUser(clientAId);
      } catch {
        // best-effort
      }
      try {
        if (clientBId) await client.auth.admin.deleteUser(clientBId);
      } catch {
        // best-effort
      }
    });

    it('Client A should see own profile', async () => {
      if (!clientAToken) {
        console.warn('Skipping: client A token not available');
        return;
      }

      const client = createTestClient();
      client.auth.setSession({ access_token: clientAToken, refresh_token: 'ignored' });

      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', clientAId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data?.id).toBe(clientAId);
    });

    it('Client A should NOT see Client B profile', async () => {
      if (!clientAToken) {
        console.warn('Skipping: client A token not available');
        return;
      }

      const client = createTestClient();
      client.auth.setSession({ access_token: clientAToken, refresh_token: 'ignored' });

      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', clientBId)
        .single();

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it('Client A should NOT update Client B profile', async () => {
      if (!clientAToken) {
        console.warn('Skipping: client A token not available');
        return;
      }

      const client = createTestClient();
      client.auth.setSession({ access_token: clientAToken, refresh_token: 'ignored' });

      const { error } = await client
        .from('users')
        .update({ name: 'Hacked' })
        .eq('id', clientBId);

      expect(error).not.toBeNull();
    });
  });

  describe('Mass Assignment Protection', () => {
    let userId: string;
    let userToken: string;

    beforeAll(async () => {
      const client = createTestClient();
      const email = `ma-${Date.now()}@example.com`;
      const password = 'Test1234!Aa';

      await delay(3000);

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { name: 'Test User', phone: '11999999999' } },
      });

      if ((error as any)?.message?.toLowerCase().includes('rate limit')) {
        console.warn('Rate limited in beforeAll, skipping mass assignment tests');
        return;
      }

      expect(data?.user).not.toBeNull();
      if (!data?.user) return;
      userId = data.user.id;

      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      expect(signInError).toBeNull();
      expect(signInData?.session).not.toBeNull();
      if (!signInData?.session) return;
      userToken = signInData.session.access_token;
    });

    afterAll(async () => {
      if (!userId) return;
      const client = createTestClient();
      try {
        await client.auth.admin.deleteUser(userId);
      } catch {
        // best-effort cleanup
      }
    });

    it('should not allow updating role via Data API', async () => {
      if (!userToken) {
        console.warn('Skipping: user token not available');
        return;
      }

      const client = createTestClient();
      client.auth.setSession({ access_token: userToken, refresh_token: 'ignored' });

      const { error } = await client
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId);

      expect(error).not.toBeNull();
    });

    it('should not allow updating is_active via Data API', async () => {
      if (!userToken) {
        console.warn('Skipping: user token not available');
        return;
      }

      const client = createTestClient();
      client.auth.setSession({ access_token: userToken, refresh_token: 'ignored' });

      const { error } = await client
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      expect(error).not.toBeNull();
    });

    it('should not allow updating deleted_at via Data API', async () => {
      if (!userToken) {
        console.warn('Skipping: user token not available');
        return;
      }

      const client = createTestClient();
      client.auth.setSession({ access_token: userToken, refresh_token: 'ignored' });

      const { error } = await client
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      expect(error).not.toBeNull();
    });
  });

  describe('Double Booking Prevention', () => {
    it('should prevent double booking with database constraint', async () => {
      const client = createTestClient();

      await delay(3000);

      const { data: professionals } = await client
        .from('professionals')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (!professionals || professionals.length === 0) {
        console.warn('Skipping double booking test: no active professionals');
        return;
      }

      const { data: services } = await client
        .from('services')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (!services || services.length === 0) {
        console.warn('Skipping double booking test: no active services');
        return;
      }

      const professionalId = professionals[0].id;
      const serviceId = services[0].id;
      const startAt = new Date(Date.now() + 86400000 * 7);

      const email1 = `db1-${Date.now()}@example.com`;
      const password = 'Test1234!Aa';
      const { data: user1, error: user1Error } = await client.auth.signUp({
        email: email1,
        password,
        options: { data: { name: 'User 1', phone: '11999999991' } },
      });

      if ((user1Error as any)?.message?.toLowerCase().includes('rate limit')) {
        console.warn('Rate limited, skipping double booking test');
        return;
      }

      expect(user1?.user).not.toBeNull();
      if (!user1?.user) return;

      const { data: signIn1, error: signIn1Error } = await client.auth.signInWithPassword({
        email: email1,
        password,
      });

      expect(signIn1Error).toBeNull();
      expect(signIn1?.session).not.toBeNull();
      if (!signIn1?.session) return;

      const client1 = createTestClient();
      client1.auth.setSession({ access_token: signIn1.session.access_token, refresh_token: 'ignored' });

      const { data: appointment1, error: error1 } = await client1.rpc('book_appointment', {
        p_professional_id: professionalId,
        p_service_id: serviceId,
        p_start_at: startAt.toISOString(),
        p_client_note: 'First booking',
      });

      expect(error1).toBeNull();
      expect(appointment1).not.toBeNull();

      const email2 = `db2-${Date.now()}@example.com`;
      const { data: user2 } = await client.auth.signUp({
        email: email2,
        password,
        options: { data: { name: 'User 2', phone: '11999999992' } },
      });

      expect(user2?.user).not.toBeNull();
      if (!user2?.user) return;

      const { data: signIn2 } = await client.auth.signInWithPassword({
        email: email2,
        password,
      });

      expect(signIn2?.session).not.toBeNull();
      if (!signIn2?.session) return;

      const client2 = createTestClient();
      client2.auth.setSession({ access_token: signIn2.session.access_token, refresh_token: 'ignored' });

      const { data: appointment2, error: error2 } = await client2.rpc('book_appointment', {
        p_professional_id: professionalId,
        p_service_id: serviceId,
        p_start_at: startAt.toISOString(),
        p_client_note: 'Double booking attempt',
      });

      expect(error2).not.toBeNull();
      expect(appointment2).toBeNull();

      if (appointment1) {
        await client.from('appointments').delete().eq('id', appointment1);
      }
      try {
        await client.auth.admin.deleteUser(user1!.user.id);
      } catch {
        // best-effort cleanup
      }
      try {
        await client.auth.admin.deleteUser(user2!.user.id);
      } catch {
        // best-effort cleanup
      }
    });
  });
});
