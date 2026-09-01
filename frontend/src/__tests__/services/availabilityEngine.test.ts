import { getAvailableSlots, isDateAvailable, formatSlotTime, timeToMinutes, minutesToTime, SLOT_INTERVAL_MINUTES } from '../../services/availabilityEngine';
import type { Availability, BlockedTime, Appointment, WorkSchedule, EffectiveSchedule } from '../../supabase/types';

// ============================================================================
// FACTORY HELPERS
// ============================================================================

function makeAvailability(overrides: Partial<Availability> & { weekday: number; start_time: string; end_time: string }): Availability {
  return {
    id: overrides.id ?? 'a1',
    professional_id: overrides.professional_id ?? 'p1',
    weekday: overrides.weekday,
    start_time: overrides.start_time,
    end_time: overrides.end_time,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function makeWorkSchedule(overrides: Partial<WorkSchedule> & { weekday: number; start_time: string; end_time: string }): WorkSchedule {
  return {
    id: overrides.id ?? 'ws1',
    professional_id: overrides.professional_id ?? 'p1',
    weekday: overrides.weekday,
    start_time: overrides.start_time,
    end_time: overrides.end_time,
    lunch_start: overrides.lunch_start,
    lunch_end: overrides.lunch_end,
    is_active: overrides.is_active ?? true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function makeEffectiveSchedule(overrides: Partial<EffectiveSchedule> & { is_off: boolean }): EffectiveSchedule {
  return {
    start_time: overrides.start_time ?? '09:00',
    end_time: overrides.end_time ?? '18:00',
    lunch_start: overrides.lunch_start,
    lunch_end: overrides.lunch_end,
    is_off: overrides.is_off,
  };
}

function makeBlocked(overrides: Partial<BlockedTime> & { start_at: string; end_at: string }): BlockedTime {
  return {
    id: overrides.id ?? 'b1',
    professional_id: overrides.professional_id ?? 'p1',
    start_at: overrides.start_at,
    end_at: overrides.end_at,
    reason: overrides.reason,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function makeAppointment(overrides: Partial<Appointment> & { start_at: string; end_at: string }): Appointment {
  return {
    id: overrides.id ?? 'ap1',
    client_user_id: overrides.client_user_id ?? 'c1',
    professional_id: overrides.professional_id ?? 'p1',
    service_id: overrides.service_id ?? 's1',
    start_at: overrides.start_at,
    end_at: overrides.end_at,
    status: overrides.status ?? 'confirmed',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function monday(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function getTimes(slots: ReturnType<typeof getAvailableSlots>): string[] {
  return slots.map((s) => formatSlotTime(s.startMinutes));
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('availabilityEngine', () => {
  // ==========================================================================
  // BASIC UTILITIES
  // ==========================================================================

  describe('timeToMinutes / minutesToTime', () => {
    it('converts 09:00 to 540', () => {
      expect(timeToMinutes('09:00')).toBe(540);
    });
    it('converts 17:30 to 1050', () => {
      expect(timeToMinutes('17:30')).toBe(1050);
    });
    it('converts 00:00 to 0', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });
    it('converts 23:59 to 1439', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });
    it('converts 12:00 to 720', () => {
      expect(timeToMinutes('12:00')).toBe(720);
    });
    it('roundtrips correctly', () => {
      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(1050)).toBe('17:30');
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(765)).toBe('12:45');
      expect(minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('SLOT_INTERVAL_MINUTES', () => {
    it('is 30 minutes', () => {
      expect(SLOT_INTERVAL_MINUTES).toBe(30);
    });
  });

  describe('formatSlotTime', () => {
    it('formats 540 as 09:00', () => {
      expect(formatSlotTime(540)).toBe('09:00');
    });
    it('formats 630 as 10:30', () => {
      expect(formatSlotTime(630)).toBe('10:30');
    });
    it('formats 0 as 00:00', () => {
      expect(formatSlotTime(0)).toBe('00:00');
    });
  });

  // ==========================================================================
  // DURATION CALCULATIONS (various service durations)
  // ==========================================================================

  describe('duration: 30min service, 09:00-12:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 slot exists with end at 09:30', () => {
      const slots = getAvailableSlots(date, 30, avail, [], []);
      const first = slots[0];
      expect(formatSlotTime(first.startMinutes)).toBe('09:00');
      expect(formatSlotTime(first.endMinutes)).toBe('09:30');
    });

    it('11:30 is available (11:30+30=12:00 fits)', () => {
      const slots = getAvailableSlots(date, 30, avail, [], []);
      const times = getTimes(slots);
      expect(times).toContain('11:30');
    });

    it('12:00 is NOT available (12:00+30=12:30 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 30, avail, [], []);
      const times = getTimes(slots);
      expect(times).not.toContain('12:00');
    });

    it('has 6 slots (09:00, 09:30, 10:00, 10:30, 11:00, 11:30)', () => {
      const slots = getAvailableSlots(date, 30, avail, [], []);
      expect(slots).toHaveLength(6);
    });
  });

  describe('duration: 60min service, 09:00-18:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('17:00 is available (17:00+60=18:00 fits)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = getTimes(slots);
      expect(times).toContain('17:00');
    });

    it('17:30 is NOT available (17:30+60=18:30 exceeds 18:00)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = getTimes(slots);
      expect(times).not.toContain('17:30');
    });

    it('slots start at 30-minute intervals', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      for (const s of slots) {
        expect(s.startMinutes % 30).toBe(0);
      }
    });

    it('last slot is 17:00', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(formatSlotTime(slots[slots.length - 1].startMinutes)).toBe('17:00');
    });

    it('has 17 slots (09:00 to 17:00)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots).toHaveLength(17);
    });
  });

  describe('duration: 45min service, 09:00-12:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 → end at 09:45', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      expect(formatSlotTime(slots[0].startMinutes)).toBe('09:00');
      expect(formatSlotTime(slots[0].endMinutes)).toBe('09:45');
    });

    it('09:30 → end at 10:15', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      expect(formatSlotTime(slots[1].startMinutes)).toBe('09:30');
      expect(formatSlotTime(slots[1].endMinutes)).toBe('10:15');
    });

    it('11:30 is NOT available (11:30+45=12:15 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      const times = getTimes(slots);
      expect(times).not.toContain('11:30');
    });

    it('last slot fits before 12:00', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      const last = slots[slots.length - 1];
      expect(last.endMinutes).toBeLessThanOrEqual(720);
    });
  });

  describe('duration: 75min service, 09:00-18:00', () => {
    const avail = [makeAvailability({ weekday: 2, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 8);

    it('10:30 is available (10:30+75=11:45)', () => {
      const slots = getAvailableSlots(date, 75, avail, [], []);
      const times = getTimes(slots);
      expect(times).toContain('10:30');
    });

    it('10:30 slot ends at 11:45', () => {
      const slots = getAvailableSlots(date, 75, avail, [], []);
      const slot = slots.find((s) => s.startMinutes === 630);
      expect(slot).toBeDefined();
      expect(slot!.endMinutes).toBe(705);
    });

    it('17:00 is NOT available (17:00+75=18:15 exceeds 18:00)', () => {
      const slots = getAvailableSlots(date, 75, avail, [], []);
      const times = getTimes(slots);
      expect(times).not.toContain('17:00');
    });

    it('16:30 is the last available slot (16:30+75=17:45)', () => {
      const slots = getAvailableSlots(date, 75, avail, [], []);
      expect(formatSlotTime(slots[slots.length - 1].startMinutes)).toBe('16:30');
    });
  });

  describe('duration: 90min service, 09:00-18:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 is available', () => {
      const slots = getAvailableSlots(date, 90, avail, [], []);
      const times = getTimes(slots);
      expect(times).toContain('09:00');
    });

    it('16:30 is NOT available (16:30+90=18:00 fits exactly)', () => {
      const slots = getAvailableSlots(date, 90, avail, [], []);
      const times = getTimes(slots);
      expect(times).toContain('16:30');
    });

    it('17:00 is NOT available (17:00+90=18:30 exceeds)', () => {
      const slots = getAvailableSlots(date, 90, avail, [], []);
      const times = getTimes(slots);
      expect(times).not.toContain('17:00');
    });
  });

  describe('duration: 120min service, 09:00-12:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('has exactly 3 slots (09:00, 09:30, 10:00)', () => {
      const slots = getAvailableSlots(date, 120, avail, [], []);
      expect(slots).toHaveLength(3);
      const times = getTimes(slots);
      expect(times).toEqual(['09:00', '09:30', '10:00']);
    });

    it('10:30 is NOT available (10:30+120=12:30 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 120, avail, [], []);
      const times = getTimes(slots);
      expect(times).not.toContain('10:30');
    });
  });

  describe('duration: 150min service, 09:00-11:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '11:00' })];
    const date = monday(2026, 9, 7);

    it('has NO slots (window too short)', () => {
      const slots = getAvailableSlots(date, 150, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('duration: service exceeds window', () => {
    const avail = [makeAvailability({ weekday: 5, start_time: '11:00', end_time: '12:00' })];
    const date = monday(2026, 9, 11);

    it('120min service in 1h window returns 0 slots', () => {
      const slots = getAvailableSlots(date, 120, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // LEGACY AVAILABILITY: SPLIT WINDOWS (manual break)
  // ==========================================================================

  describe('legacy: split window 09:00-12:00 + 13:00-18:00', () => {
    const avail = [
      makeAvailability({ weekday: 2, start_time: '09:00', end_time: '12:00' }),
      makeAvailability({ weekday: 2, start_time: '13:00', end_time: '18:00' }),
    ];
    const date = monday(2026, 9, 8);

    it('11:00 is available (fits in morning window)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('11:30 is NOT available (crosses morning boundary)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).not.toContain('11:30');
    });

    it('13:00 is available (afternoon start)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('13:00');
    });

    it('12:00 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('12:30 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).not.toContain('12:30');
    });

    it('17:00 is available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('17:00');
    });

    it('17:30 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).not.toContain('17:30');
    });
  });

  describe('legacy: 3-way split 08:00-11:00 + 12:00-15:00 + 16:00-19:00', () => {
    const avail = [
      makeAvailability({ weekday: 1, start_time: '08:00', end_time: '11:00' }),
      makeAvailability({ weekday: 1, start_time: '12:00', end_time: '15:00' }),
      makeAvailability({ weekday: 1, start_time: '16:00', end_time: '19:00' }),
    ];
    const date = monday(2026, 9, 7);

    it('10:00 is available (first window)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('10:00');
    });

    it('13:30 is available (second window)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('13:30');
    });

    it('17:30 is available (third window)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('17:30');
    });

    it('11:30 is NOT available (gap between windows)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).not.toContain('11:30');
    });

    it('15:30 is NOT available (gap between windows)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).not.toContain('15:30');
    });
  });

  // ==========================================================================
  // BLOCKED TIMES
  // ==========================================================================

  describe('blocked: 14:00-15:00 block', () => {
    const avail = [makeAvailability({ weekday: 3, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-09T14:00:00', end_at: '2026-09-09T15:00:00' })];
    const date = monday(2026, 9, 9);

    it('14:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('13:30 is NOT available (overlaps block)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).not.toContain('13:30');
    });

    it('15:00 is available (after block)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('15:00');
    });

    it('13:00 is available (adjacent to block, no overlap)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('13:00');
    });
  });

  describe('blocked: fully blocked day', () => {
    const avail = [makeAvailability({ weekday: 4, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-10T09:00:00', end_at: '2026-09-10T18:00:00' })];
    const date = monday(2026, 9, 10);

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('blocked: partial block at start of day', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('10:00 is available', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('blocked: partial block at end of day', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T17:00:00', end_at: '2026-09-07T18:00:00' })];
    const date = monday(2026, 9, 7);

    it('17:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).not.toContain('17:00');
    });

    it('16:00 is available (16:00+60=17:00, adjacent)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  describe('blocked: multiple blocks', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [
      makeBlocked({ id: 'b1', start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' }),
      makeBlocked({ id: 'b2', start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' }),
    ];
    const date = monday(2026, 9, 7);

    it('10:00 is NOT available (first block)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('14:00 is NOT available (second block)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('12:00 is available (between blocks)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('12:00');
    });

    it('16:00 is available (after both blocks)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  describe('blocked: block for different day does not affect', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-08T14:00:00', end_at: '2026-09-08T15:00:00' })]; // Tuesday
    const date = monday(2026, 9, 7); // Monday

    it('14:00 is available on Monday', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(getTimes(slots)).toContain('14:00');
    });
  });

  // ==========================================================================
  // APPOINTMENTS
  // ==========================================================================

  describe('appointment: 10:00-11:00 blocks correctly', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appts = [makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' })];
    const date = monday(2026, 9, 7);

    it('09:30 is NOT available (overlaps)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      expect(getTimes(slots)).not.toContain('09:30');
    });

    it('10:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('10:30 is NOT available (overlaps)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      expect(getTimes(slots)).not.toContain('10:30');
    });

    it('11:00 is available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('09:00 is available (adjacent)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      expect(getTimes(slots)).toContain('09:00');
    });
  });

  describe('appointment: cancelled does NOT block', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('10:00 available with cancelled appointment', () => {
      const appt = makeAppointment({
        start_at: '2026-09-07T10:00:00',
        end_at: '2026-09-07T11:00:00',
        status: 'cancelled',
      });
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('appointment: completed DOES block', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('10:00 NOT available with completed appointment', () => {
      const appt = makeAppointment({
        start_at: '2026-09-07T10:00:00',
        end_at: '2026-09-07T11:00:00',
        status: 'completed',
      });
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });
  });

  describe('appointment: adjacent appointments do not conflict', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('11:00 available after two adjacent appointments', () => {
      const appts = [
        makeAppointment({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' }),
        makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' }),
      ];
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      expect(getTimes(slots)).toContain('11:00');
    });
  });

  describe('appointment: overlapping appointments block correctly', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('combined 09:00-10:30 blocks 09:00, 09:30, 10:00', () => {
      const appts = [
        makeAppointment({ id: 'ap1', start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' }),
        makeAppointment({ id: 'ap2', start_at: '2026-09-07T09:30:00', end_at: '2026-09-07T10:30:00' }),
      ];
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = getTimes(slots);
      expect(times).not.toContain('09:00');
      expect(times).not.toContain('09:30');
      expect(times).not.toContain('10:00');
      expect(times).toContain('10:30');
    });
  });

  describe('appointment: create removes slot', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('10:00 available without appointment', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('10:00');
    });

    it('10:00 NOT available with appointment', () => {
      const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });
  });

  describe('appointment: engine does NOT filter by professional (caller must)', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const appt = makeAppointment({
      professional_id: 'p_other',
      start_at: '2026-09-07T10:00:00',
      end_at: '2026-09-07T11:00:00',
    });
    const date = monday(2026, 9, 7);

    it('10:00 is blocked if unfiltered appointment is passed (engine trusts caller)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('10:00 is available if caller filters correctly (no appointment passed)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('appointment: appointment for different date does not block', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const appt = makeAppointment({
      start_at: '2026-09-14T10:00:00', // Next Monday
      end_at: '2026-09-14T11:00:00',
    });
    const date = monday(2026, 9, 7); // This Monday

    it('10:00 is available on this Monday', () => {
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  // ==========================================================================
  // MIXED BLOCKED + APPOINTMENTS
  // ==========================================================================

  describe('mixed: blocked + appointment in same day', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
    const date = monday(2026, 9, 7);

    it('10:00 NOT available (appointment)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('14:00 NOT available (blocked)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('12:00 available (between block and appointment)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, [appt]);
      expect(getTimes(slots)).toContain('12:00');
    });

    it('16:00 available (after both)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, [appt]);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  // ==========================================================================
  // DAY-OF-WEEK
  // ==========================================================================

  describe('day-of-week: Sunday (no availability)', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = new Date(2026, 8, 6); // Sunday Sep 6

    it('returns no slots for Sunday', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('day-of-week: Saturday (no availability)', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = new Date(2026, 8, 12); // Saturday Sep 12

    it('returns no slots for Saturday', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('day-of-week: only Monday configured', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const tuesday = monday(2026, 9, 8); // Tuesday

    it('Tuesday returns no slots', () => {
      const slots = getAvailableSlots(tuesday, 60, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('day-of-week: all 7 days configured', () => {
    const avail = Array.from({ length: 7 }, (_, i) =>
      makeAvailability({ weekday: i, start_time: '09:00', end_time: '17:00' })
    );

    it('every day of the week has slots', () => {
      for (let d = 6; d <= 12; d++) { // Sep 6 (Sun) to Sep 12 (Sat)
        const date = monday(2026, 9, d);
        const slots = getAvailableSlots(date, 60, avail, [], []);
        expect(slots.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // NO AVAILABILITY
  // ==========================================================================

  describe('no availability: empty array', () => {
    const date = monday(2026, 9, 7);

    it('returns empty slots', () => {
      const slots = getAvailableSlots(date, 60, [], [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('no availability: no matching weekday', () => {
    const avail = [makeAvailability({ weekday: 3, start_time: '09:00', end_time: '18:00' })]; // Wednesday only
    const date = monday(2026, 9, 7); // Monday

    it('returns empty slots', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // isDateAvailable — LEGACY AVAILABILITY
  // ==========================================================================

  describe('isDateAvailable (legacy)', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];

    it('returns true for available weekday with service', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, avail, true)).toBe(true);
    });

    it('returns false for Sunday', () => {
      const date = new Date(2026, 8, 6);
      expect(isDateAvailable(date, avail, true)).toBe(false);
    });

    it('returns false if no service', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, avail, false)).toBe(false);
    });

    it('returns false if no availability for weekday', () => {
      const date = monday(2026, 9, 7);
      const tuesdayAvail = [makeAvailability({ weekday: 2, start_time: '09:00', end_time: '18:00' })];
      expect(isDateAvailable(date, tuesdayAvail, true)).toBe(false);
    });
  });

  // ==========================================================================
  // isDateAvailable — WORK SCHEDULE (new system)
  // ==========================================================================

  describe('isDateAvailable (WorkSchedule)', () => {
    const schedules = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00' })];

    it('returns true for configured weekday', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, schedules, true)).toBe(true);
    });

    it('returns false for unconfigured weekday', () => {
      const date = new Date(2026, 8, 6); // Sunday
      expect(isDateAvailable(date, schedules, true)).toBe(false);
    });

    it('returns false if no service', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, schedules, false)).toBe(false);
    });

    it('returns false for empty schedules', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, [], true)).toBe(false);
    });

    it('returns false for inactive schedule', () => {
      const inactive = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00', is_active: false })];
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, inactive, true)).toBe(false);
    });
  });

  // ==========================================================================
  // isDateAvailable — EFFECTIVE SCHEDULE
  // ==========================================================================

  describe('isDateAvailable (EffectiveSchedule)', () => {
    it('returns true when effective schedule exists', () => {
      const date = monday(2026, 9, 7);
      const effective = makeEffectiveSchedule({ is_off: false, start_time: '09:00', end_time: '18:00' });
      expect(isDateAvailable(date, [], true, effective)).toBe(true);
    });

    it('returns false when day off', () => {
      const date = monday(2026, 9, 7);
      const effective = makeEffectiveSchedule({ is_off: true });
      expect(isDateAvailable(date, [], true, effective)).toBe(false);
    });

    it('returns false when effectiveSchedule is null', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, [], true, null)).toBe(false);
    });

    it('takes precedence over WorkSchedule', () => {
      const date = monday(2026, 9, 7);
      const schedules = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
      const effective = makeEffectiveSchedule({ is_off: true }); // override says day off
      expect(isDateAvailable(date, schedules, true, effective)).toBe(false);
    });
  });

  // ==========================================================================
  // WORK SCHEDULE: getAvailableSlots
  // ==========================================================================

  describe('WorkSchedule: 60min service, 09:00-18:00', () => {
    const schedules = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('generates correct slots', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(slots).toHaveLength(17);
      expect(getTimes(slots)).toContain('09:00');
      expect(getTimes(slots)).toContain('17:00');
    });

    it('17:30 NOT available', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).not.toContain('17:30');
    });
  });

  describe('WorkSchedule: with lunch break 12:00-13:00', () => {
    const schedules = [makeWorkSchedule({
      weekday: 1, start_time: '09:00', end_time: '18:00',
      lunch_start: '12:00', lunch_end: '13:00',
    })];
    const date = monday(2026, 9, 7);

    it('11:30 is available (11:30+60=12:30, but lunch blocks it)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).not.toContain('11:30');
    });

    it('11:00 is available (11:00+60=12:00, adjacent to lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('12:00 NOT available (in lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('13:00 is available (after lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).toContain('13:00');
    });

    it('12:30 NOT available (in lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).not.toContain('12:30');
    });
  });

  describe('WorkSchedule: lunch 12:00-13:00, 30min service', () => {
    const schedules = [makeWorkSchedule({
      weekday: 1, start_time: '09:00', end_time: '18:00',
      lunch_start: '12:00', lunch_end: '13:00',
    })];
    const date = monday(2026, 9, 7);

    it('11:30 NOT available (11:30+30=12:00, adjacent to lunch)', () => {
      const slots = getAvailableSlots(date, 30, schedules, [], []);
      expect(getTimes(slots)).toContain('11:30');
    });

    it('12:00 NOT available (lunch)', () => {
      const slots = getAvailableSlots(date, 30, schedules, [], []);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('12:30 NOT available (lunch)', () => {
      const slots = getAvailableSlots(date, 30, schedules, [], []);
      expect(getTimes(slots)).not.toContain('12:30');
    });

    it('13:00 available', () => {
      const slots = getAvailableSlots(date, 30, schedules, [], []);
      expect(getTimes(slots)).toContain('13:00');
    });
  });

  describe('WorkSchedule: multi-window 08:00-12:00 + 14:00-18:00', () => {
    const schedules = [
      makeWorkSchedule({ weekday: 1, start_time: '08:00', end_time: '12:00' }),
      makeWorkSchedule({ weekday: 1, start_time: '14:00', end_time: '18:00' }),
    ];
    const date = monday(2026, 9, 7);

    it('morning slots available', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).toContain('09:00');
      expect(getTimes(slots)).toContain('11:00');
    });

    it('afternoon slots available', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).toContain('14:00');
      expect(getTimes(slots)).toContain('17:00');
    });

    it('12:30 NOT available (gap)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(getTimes(slots)).not.toContain('12:30');
    });

    it('no duplicate slots', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      const times = getTimes(slots);
      expect(new Set(times).size).toBe(times.length);
    });
  });

  describe('WorkSchedule: blocked times work with new system', () => {
    const schedules = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 NOT available (blocked)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('15:00 available (after block)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, []);
      expect(getTimes(slots)).toContain('15:00');
    });
  });

  describe('WorkSchedule: appointments work with new system', () => {
    const schedules = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
    const date = monday(2026, 9, 7);

    it('10:00 NOT available (appointment)', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('11:00 available', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], [appt]);
      expect(getTimes(slots)).toContain('11:00');
    });
  });

  describe('WorkSchedule: inactive schedule returns no slots', () => {
    const schedules = [makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '18:00', is_active: false })];
    const date = monday(2026, 9, 7);

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // EFFECTIVE SCHEDULE: getAvailableSlots
  // ==========================================================================

  describe('EffectiveSchedule: basic 09:00-18:00', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveSchedule({ is_off: false, start_time: '09:00', end_time: '18:00' });

    it('generates correct slots', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective);
      expect(slots).toHaveLength(17);
    });
  });

  describe('EffectiveSchedule: day off returns no slots', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveSchedule({ is_off: true });

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective);
      expect(slots).toHaveLength(0);
    });
  });

  describe('EffectiveSchedule: with lunch', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveSchedule({
      is_off: false, start_time: '09:00', end_time: '18:00',
      lunch_start: '12:00', lunch_end: '13:00',
    });

    it('11:00 available, 12:00 NOT, 13:00 available', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective);
      const times = getTimes(slots);
      expect(times).toContain('11:00');
      expect(times).not.toContain('12:00');
      expect(times).toContain('13:00');
    });
  });

  describe('EffectiveSchedule: with blocked times', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveSchedule({ is_off: false, start_time: '09:00', end_time: '18:00' });
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];

    it('14:00 NOT available', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [], undefined, effective);
      expect(getTimes(slots)).not.toContain('14:00');
    });
  });

  describe('EffectiveSchedule: with appointments', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveSchedule({ is_off: false, start_time: '09:00', end_time: '18:00' });
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });

    it('10:00 NOT available', () => {
      const slots = getAvailableSlots(date, 60, [], [], [appt], undefined, effective);
      expect(getTimes(slots)).not.toContain('10:00');
    });
  });

  // ==========================================================================
  // NOW FILTERING (past slots excluded for today)
  // ==========================================================================

  describe('now filtering: past slots on same day excluded', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);
    const now = new Date(2026, 8, 7, 10, 30); // Sep 7 10:30

    it('10:00 NOT available (past)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], [], now);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('10:30 NOT available (current time)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], [], now);
      expect(getTimes(slots)).not.toContain('10:30');
    });

    it('11:00 available (future)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], [], now);
      expect(getTimes(slots)).toContain('11:00');
    });
  });

  describe('now filtering: different day not affected', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 14); // Next Monday
    const now = new Date(2026, 8, 7, 10, 30); // Sep 7 10:30

    it('09:00 available (different day, now ignored)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], [], now);
      expect(getTimes(slots)).toContain('09:00');
    });
  });

  // ==========================================================================
  // DUPLICATE PREVENTION
  // ==========================================================================

  describe('no duplicate slots across windows', () => {
    const schedules = [
      makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '12:00' }),
      makeWorkSchedule({ weekday: 1, start_time: '09:00', end_time: '12:00' }), // duplicate config
    ];
    const date = monday(2026, 9, 7);

    it('no duplicate slots', () => {
      const slots = getAvailableSlots(date, 60, schedules, [], []);
      const times = getTimes(slots);
      expect(new Set(times).size).toBe(times.length);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('edge: very short window (30min) with 30min service', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '09:30' })];
    const date = monday(2026, 9, 7);

    it('exactly 1 slot', () => {
      const slots = getAvailableSlots(date, 30, avail, [], []);
      expect(slots).toHaveLength(1);
      expect(formatSlotTime(slots[0].startMinutes)).toBe('09:00');
      expect(formatSlotTime(slots[0].endMinutes)).toBe('09:30');
    });
  });

  describe('edge: service duration equals window', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '10:00' })];
    const date = monday(2026, 9, 7);

    it('1 slot at 09:00', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots).toHaveLength(1);
      expect(formatSlotTime(slots[0].startMinutes)).toBe('09:00');
    });
  });

  describe('edge: service 1 minute longer than window', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '10:00' })];
    const date = monday(2026, 9, 7);

    it('0 slots', () => {
      const slots = getAvailableSlots(date, 61, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('edge: start time not aligned to 30min', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:15', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('first slot at 09:15 (engine uses window start, not 30min boundary)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      if (slots.length > 0) {
        expect(formatSlotTime(slots[0].startMinutes)).toBe('09:15');
      }
    });
  });

  describe('edge: block overlaps lunch', () => {
    const schedules = [makeWorkSchedule({
      weekday: 1, start_time: '09:00', end_time: '18:00',
      lunch_start: '12:00', lunch_end: '13:00',
    })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T11:30:00', end_at: '2026-09-07T13:30:00' })];
    const date = monday(2026, 9, 7);

    it('10:30 available (10:30-11:30, adjacent to block start)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, []);
      expect(getTimes(slots)).toContain('10:30');
    });

    it('11:00 NOT available (11:00-12:00 overlaps block 11:30-13:30)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, []);
      expect(getTimes(slots)).not.toContain('11:00');
    });

    it('13:30 available (after both block and lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, []);
      expect(getTimes(slots)).toContain('13:30');
    });

    it('12:00 NOT available (lunch or block)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, []);
      expect(getTimes(slots)).not.toContain('12:00');
    });
  });

  describe('edge: block + appointment + lunch all in same day', () => {
    const schedules = [makeWorkSchedule({
      weekday: 1, start_time: '09:00', end_time: '18:00',
      lunch_start: '12:00', lunch_end: '13:00',
    })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T15:00:00', end_at: '2026-09-07T16:00:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' });
    const date = monday(2026, 9, 7);

    it('09:00 NOT available (appointment)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('12:00 NOT available (lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('15:00 NOT available (blocked)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('15:00');
    });

    it('11:00 available (between appointment and lunch)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, [appt]);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('14:00 available (between lunch and block)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, [appt]);
      expect(getTimes(slots)).toContain('14:00');
    });

    it('16:00 available (after block)', () => {
      const slots = getAvailableSlots(date, 60, schedules, blocked, [appt]);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  // ==========================================================================
  // SLOT FORMAT VALIDATION
  // ==========================================================================

  describe('slot format: startAt and endAt are correct ISO strings', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('first slot has correct format', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const first = slots[0];
      expect(first.startAt).toBe('2026-09-07T09:00');
      expect(first.endAt).toBe('2026-09-07T10:00');
    });

    it('all slots have available=true', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      for (const s of slots) {
        expect(s.available).toBe(true);
      }
    });

    it('startMinutes matches startAt time', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      for (const s of slots) {
        expect(s.startMinutes).toBe(timeToMinutes(s.startAt.split('T')[1]));
      }
    });
  });

  // ==========================================================================
  // MULTI-WINDOW WITH BLOCKS
  // ==========================================================================

  describe('multi-window with block in morning', () => {
    const avail = [
      makeAvailability({ weekday: 1, start_time: '08:00', end_time: '12:00' }),
      makeAvailability({ weekday: 1, start_time: '14:00', end_time: '18:00' }),
    ];
    const blocked = [makeBlocked({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' })];
    const date = monday(2026, 9, 7);

    it('morning slots respect block', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = getTimes(slots);
      expect(times).not.toContain('09:30');
      expect(times).not.toContain('10:00');
      expect(times).not.toContain('10:30');
      expect(times).toContain('09:00');
      expect(times).toContain('11:00');
    });

    it('afternoon slots unaffected', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = getTimes(slots);
      expect(times).toContain('14:00');
      expect(times).toContain('17:00');
    });
  });

  // ==========================================================================
  // CHANGE SERVICE RECALCULATES
  // ==========================================================================

  describe('change service recalculates', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '11:00' })];
    const date = monday(2026, 9, 7);

    it('60min service has slots', () => {
      expect(getAvailableSlots(date, 60, avail, [], []).length).toBeGreaterThan(0);
    });

    it('150min service has NO slots', () => {
      expect(getAvailableSlots(date, 150, avail, [], [])).toHaveLength(0);
    });

    it('30min service has more slots than 60min', () => {
      expect(getAvailableSlots(date, 30, avail, [], []).length).toBeGreaterThan(
        getAvailableSlots(date, 60, avail, [], []).length
      );
    });
  });
});
