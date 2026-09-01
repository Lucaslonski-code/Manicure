#!/usr/bin/env node

/**
 * Idempotent seed script for AppManicure test data.
 *
 * Uses the NEW architecture: work_windows + schedule_breaks + schedule_overrides.
 * Also seeds legacy availability for backward compatibility.
 *
 * Usage:
 *   npx ts-node supabase/seed.ts
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

// ============================================================================
// NEW: Work Windows + Breaks
// ============================================================================

async function upsertWorkWindow(
  professionalId: string,
  weekday: number,
  startTime: string,
  endTime: string,
  sortOrder: number = 0,
): Promise<string | null> {
  const { data: existing } = await sb.from('work_windows')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('weekday', weekday)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .maybeSingle();
  if (existing) {
    console.log(`  work_window weekday=${weekday} ${startTime}-${endTime} already exists`);
    return existing.id;
  }
  const { data, error } = await sb.from('work_windows').insert({
    professional_id: professionalId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    sort_order: sortOrder,
    is_active: true,
    effective_from: '2026-01-01',
  }).select('id').single();
  if (error) {
    console.error(`  work_window error weekday=${weekday}:`, error.message);
    return null;
  }
  console.log(`  created work_window weekday=${weekday} ${startTime}-${endTime}`);
  return data.id;
}

async function upsertScheduleBreak(
  workWindowId: string,
  startTime: string,
  endTime: string,
  label: string,
  sortOrder: number = 0,
) {
  const { data: existing } = await sb.from('schedule_breaks')
    .select('id')
    .eq('work_window_id', workWindowId)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .maybeSingle();
  if (existing) {
    console.log(`  schedule_break ${startTime}-${endTime} already exists`);
    return;
  }
  const { error } = await sb.from('schedule_breaks').insert({
    work_window_id: workWindowId,
    start_time: startTime,
    end_time: endTime,
    label,
    sort_order: sortOrder,
  });
  if (error) {
    console.error(`  schedule_break error:`, error.message);
    return;
  }
  console.log(`  created schedule_break ${label} ${startTime}-${endTime}`);
}

// ============================================================================
// Schedule Override
// ============================================================================

async function upsertScheduleOverride(
  professionalId: string,
  specificDate: string,
  options: {
    is_off?: boolean;
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    break_label?: string;
    reason?: string;
  },
) {
  const { data: existing } = await sb.from('schedule_overrides')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('specific_date', specificDate)
    .maybeSingle();
  if (existing) {
    console.log(`  schedule_override for ${specificDate} already exists`);
    return;
  }
  const { error } = await sb.from('schedule_overrides').insert({
    professional_id: professionalId,
    specific_date: specificDate,
    is_off: options.is_off ?? false,
    start_time: options.start_time || null,
    end_time: options.end_time || null,
    break_start: options.break_start || null,
    break_end: options.break_end || null,
    break_label: options.break_label || null,
    reason: options.reason || null,
  });
  if (error) {
    console.error(`  schedule_override error for ${specificDate}:`, error.message);
    return;
  }
  console.log(`  created schedule_override for ${specificDate}`);
}

// ============================================================================
// Legacy: Availability (kept for backward compatibility)
// ============================================================================

async function upsertAvailability(professionalId: string, weekday: number, startTime: string, endTime: string) {
  const { data: existing } = await sb.from('availability')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('weekday', weekday)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .maybeSingle();
  if (existing) {
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
  }
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
  console.log('[1/6] Users');
  const profUserId = await upsertUser('profissional1@appmanicure.test', 'Profissional1', 'admin');
  const adminUserId = await upsertUser('adminteste@appmanicure.test', 'AdminTeste', 'admin');
  const client1UserId = await upsertUser('cliente1@appmanicure.test', 'Cliente1', 'client');
  const client2UserId = await upsertUser('cliente2@appmanicure.test', 'Cliente2', 'client');

  // 2. Professionals
  console.log('\n[2/6] Professionals');
  const profId = profUserId ? await upsertProfessional(profUserId, 'Profissional1') : null;

  // 3. Services
  console.log('\n[3/6] Services');
  const svcTraditional = await upsertService('Manicure tradicional', 'Cuidado clássico das unhas', 45);
  const svcGel = await upsertService('Manicure em gel', 'Unhas em gel com acabamento premium', 60);
  const svcFrench = await upsertService('Francesinha', 'Francesinha clássica ou moderna', 60);
  const svcEnamel = await upsertService('Esmaltação', 'Esmaltação com cores e acabamento', 30);
  const svcSpa = await upsertService('Spa das mãos', 'Tratamento completo de spa para as mãos', 75);
  const svcExtension = await upsertService('Alongamento', 'Alongamento de unhas profissional', 120);

  // 4. Professional Services (link)
  console.log('\n[4/6] Professional Services');
  if (profId) {
    await upsertProfessionalService(profId, svcTraditional!, 45, 45);
    await upsertProfessionalService(profId, svcGel!, 60, 80);
    await upsertProfessionalService(profId, svcFrench!, 60, 60);
    await upsertProfessionalService(profId, svcEnamel!, 30, 35);
    await upsertProfessionalService(profId, svcSpa!, 75, 70);
    await upsertProfessionalService(profId, svcExtension!, 120, 120);
  }

  // 5. Work Windows + Breaks (NEW architecture)
  console.log('\n[5/6] Work Windows + Breaks');
  if (profId) {
    // Monday-Friday: 09:00-18:00 with lunch 12:00-13:00
    // Friday ends at 17:00
    for (let weekday = 1; weekday <= 5; weekday++) {
      const endTime = weekday === 5 ? '17:00' : '18:00';
      const windowId = await upsertWorkWindow(profId, weekday, '09:00', endTime, 0);
      if (windowId) {
        await upsertScheduleBreak(windowId, '12:00', '13:00', 'Almoço', 0);
      }
    }

    // Legacy availability (for backward compatibility)
    console.log('\n  [bonus] Legacy availability');
    for (let weekday = 1; weekday <= 5; weekday++) {
      await upsertAvailability(profId, weekday, '09:00', '12:00');
      if (weekday <= 4) {
        await upsertAvailability(profId, weekday, '13:00', '18:00');
      } else {
        await upsertAvailability(profId, weekday, '13:00', '17:00');
      }
    }
  }

  // 6. Overrides, Blocked Times, Test Appointments
  console.log('\n[6/6] Overrides + Blocked Times + Test Data');
  if (profId) {
    // Override: Saturday 19/09/2026 — exceptional work day 09:00-13:00
    await upsertScheduleOverride(profId, '2026-09-19', {
      is_off: false,
      start_time: '09:00',
      end_time: '13:00',
      reason: 'Sábado excepcional',
    });

    // Override: Sunday 20/09/2026 — exceptional work day 09:00-13:00
    await upsertScheduleOverride(profId, '2026-09-20', {
      is_off: false,
      start_time: '09:00',
      end_time: '13:00',
      reason: 'Domingo excepcional',
    });

    // Override: Wednesday 23/09/2026 — day off
    await upsertScheduleOverride(profId, '2026-09-23', {
      is_off: true,
      reason: 'Folga',
    });

    // Blocked time: 16/09 15:00-16:30
    await upsertBlockedTime(profId, '2026-09-16T15:00:00', '2026-09-16T16:30:00', 'Emergência');

    // Blocked times: lunch for next 10 weekdays
    console.log('\n  [bonus] Test blocked times');
    const now = new Date();
    let blockedCount = 0;
    for (let i = 1; i <= 30 && blockedCount < 10; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const wd = d.getDay();
      if (wd >= 1 && wd <= 5) {
        const dateStr = d.toISOString().split('T')[0];
        await upsertBlockedTime(profId, `${dateStr}T12:00:00`, `${dateStr}T13:00:00`, 'Intervalo de almoço (teste)');
        blockedCount++;
      }
    }

    // Test appointment: 17/09 14:00-15:00
    if (client1UserId) {
      const { data: existingAppt } = await sb.from('appointments')
        .select('id')
        .eq('professional_id', profId)
        .eq('client_user_id', client1UserId)
        .gte('start_at', '2026-09-17T14:00:00')
        .lte('start_at', '2026-09-17T15:00:00')
        .maybeSingle();
      if (!existingAppt) {
        const { error } = await sb.from('appointments').insert({
          client_user_id: client1UserId,
          professional_id: profId,
          service_id: svcGel!,
          start_at: '2026-09-17T14:00:00',
          end_at: '2026-09-17T15:00:00',
          status: 'confirmed',
        });
        if (error) {
          console.error(`  test appointment error:`, error.message);
        } else {
          console.log(`  created test appointment 17/09 14:00-15:00`);
        }
      } else {
        console.log(`  test appointment already exists`);
      }
    }
  }

  console.log('\n=== Seed complete ===');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
