#!/usr/bin/env node

/**
 * Idempotent seed script for AppManicure test data.
 *
 * Usage:
 *   npx ts-node supabase/seed.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars,
 * or falls back to the hardcoded test project values.
 *
 * Running twice creates NO duplicates.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aheyyslmngobpavszbur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXl5c2xtbmdvYnBhdnN6YnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI0NDc4NSwiZXhwIjoyMTAyODIwNzg1fQ.q2A7Fp373Hd57KH3ox6B5sI7VYXYpgG7zvF4k17419c';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function upsertUser(email: string, name: string, role: 'client' | 'admin') {
  const { data: existing } = await sb.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    console.log(`  user ${email} already exists (${existing.id})`);
    return existing.id;
  }
  const { data: authUser, error: authErr } = await sb.auth.admin.createUser({
    email,
    password: 'Test@AppManicure2025',
    email_confirm: true,
  });
  if (authErr) {
    console.error(`  auth error for ${email}:`, authErr.message);
    return null;
  }
  const userId = authUser.user.id;
  const { error: profileErr } = await sb.from('users').insert({ id: userId, email, name, role });
  if (profileErr) {
    console.error(`  profile error for ${email}:`, profileErr.message);
    return null;
  }
  console.log(`  created user ${email} (${userId})`);
  return userId;
}

async function upsertProfessional(userId: string, displayName: string) {
  const { data: existing } = await sb.from('professionals').select('id').eq('user_id', userId).maybeSingle();
  if (existing) {
    console.log(`  professional ${displayName} already exists (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await sb.from('professionals').insert({ user_id: userId, display_name: displayName }).select('id').single();
  if (error) {
    console.error(`  professional error for ${displayName}:`, error.message);
    return null;
  }
  console.log(`  created professional ${displayName} (${data.id})`);
  return data.id;
}

async function upsertService(name: string, description: string, durationMinutes: number) {
  const { data: existing } = await sb.from('services').select('id').eq('name', name).maybeSingle();
  if (existing) {
    console.log(`  service "${name}" already exists (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await sb.from('services').insert({
    name,
    description,
    default_duration_minutes: durationMinutes,
  }).select('id').single();
  if (error) {
    console.error(`  service error for "${name}":`, error.message);
    return null;
  }
  console.log(`  created service "${name}" (${data.id})`);
  return data.id;
}

async function upsertProfessionalService(professionalId: string, serviceId: string, durationMinutes: number, price: number) {
  const { data: existing } = await sb.from('professional_services')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('service_id', serviceId)
    .maybeSingle();
  if (existing) {
    console.log(`  professional_service link already exists (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await sb.from('professional_services').insert({
    professional_id: professionalId,
    service_id: serviceId,
    duration_minutes: durationMinutes,
    price,
  }).select('id').single();
  if (error) {
    console.error(`  professional_service error:`, error.message);
    return null;
  }
  console.log(`  linked service to professional (${data.id})`);
  return data.id;
}

async function upsertAvailability(professionalId: string, weekday: number, startTime: string, endTime: string) {
  const { data: existing } = await sb.from('availability')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('weekday', weekday)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .maybeSingle();
  if (existing) {
    console.log(`  availability weekday=${weekday} ${startTime}-${endTime} already exists`);
    return;
  }
  const { error } = await sb.from('availability').insert({
    professional_id: professionalId,
    weekday,
    start_time: startTime,
    end_time: endTime,
  });
  if (error) {
    console.error(`  availability error weekday=${weekday}:`, error.message);
    return;
  }
  console.log(`  created availability weekday=${weekday} ${startTime}-${endTime}`);
}

async function upsertBlockedTime(professionalId: string, startAt: string, endAt: string, reason: string) {
  const { data: existing } = await sb.from('blocked_times')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('start_at', startAt)
    .eq('end_at', endAt)
    .maybeSingle();
  if (existing) {
    console.log(`  blocked time ${startAt} already exists`);
    return;
  }
  const { error } = await sb.from('blocked_times').insert({
    professional_id: professionalId,
    start_at: startAt,
    end_at: endAt,
    reason,
  });
  if (error) {
    console.error(`  blocked time error:`, error.message);
    return;
  }
  console.log(`  created blocked time ${reason} (${startAt} - ${endAt})`);
}

async function main() {
  console.log('=== AppManicure Seed (idempotent) ===\n');

  // 1. Users
  console.log('[1/5] Users');
  const profUserId = await upsertUser('profissional1@appmanicure.test', 'Profissional1', 'admin');
  const adminUserId = await upsertUser('adminteste@appmanicure.test', 'AdminTeste', 'admin');
  const client1UserId = await upsertUser('cliente1@appmanicure.test', 'Cliente1', 'client');
  const client2UserId = await upsertUser('cliente2@appmanicure.test', 'Cliente2', 'client');

  // 2. Professionals
  console.log('\n[2/5] Professionals');
  const profId = profUserId ? await upsertProfessional(profUserId, 'Profissional1') : null;

  // 3. Services
  console.log('\n[3/5] Services');
  const svcTraditional = await upsertService('Manicure tradicional', 'Cuidado clássico das unhas', 45);
  const svcGel = await upsertService('Manicure em gel', 'Unhas em gel com acabamento premium', 60);
  const svcFrench = await upsertService('Francesinha', 'Francesinha clássica ou moderna', 60);
  const svcEnamel = await upsertService('Esmaltação', 'Esmaltação com cores e acabamento', 30);
  const svcSpa = await upsertService('Spa das mãos', 'Tratamento completo de spa para as mãos', 75);
  const svcExtension = await upsertService('Alongamento', 'Alongamento de unhas profissional', 120);

  // 4. Professional Services (link)
  console.log('\n[4/5] Professional Services');
  if (profId) {
    await upsertProfessionalService(profId, svcTraditional!, 45, 45);
    await upsertProfessionalService(profId, svcGel!, 60, 80);
    await upsertProfessionalService(profId, svcFrench!, 60, 60);
    await upsertProfessionalService(profId, svcEnamel!, 30, 35);
    await upsertProfessionalService(profId, svcSpa!, 75, 70);
    await upsertProfessionalService(profId, svcExtension!, 120, 120);
  }

  // 5. Availability (recurring weekly rules)
  console.log('\n[5/5] Availability');
  if (profId) {
    // Monday-Friday: morning 09:00-12:00, afternoon 13:00-18:00
    // Friday afternoon ends at 17:00
    for (let weekday = 1; weekday <= 5; weekday++) {
      await upsertAvailability(profId, weekday, '09:00', '12:00');
      if (weekday <= 4) {
        await upsertAvailability(profId, weekday, '13:00', '18:00');
      } else {
        await upsertAvailability(profId, weekday, '13:00', '17:00');
      }
    }

    // Test blocked times: lunch break for next 10 weekdays
    console.log('\n  [bonus] Test blocked times');
    const now = new Date();
    let blockedCount = 0;
    for (let i = 1; i <= 30 && blockedCount < 10; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const wd = d.getDay();
      if (wd >= 1 && wd <= 5) {
        const dateStr = d.toISOString().split('T')[0];
        await upsertBlockedTime(
          profId,
          `${dateStr}T12:00:00`,
          `${dateStr}T13:00:00`,
          'Intervalo de almoço (teste)',
        );
        blockedCount++;
      }
    }
  }

  console.log('\n=== Seed complete ===');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
