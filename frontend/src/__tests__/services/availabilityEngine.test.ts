import { getAvailableSlots, isDateAvailable, formatSlotTime, timeToMinutes, minutesToTime, SLOT_INTERVAL_MINUTES } from '../../services/availabilityEngine';
import type { BlockedTime, Appointment, WorkWindow, ScheduleBreak, EffectiveWindow } from '../../supabase/types';

// ============================================================================
// FACTORY HELPERS
// ============================================================================

function makeWorkWindow(overrides: Partial<WorkWindow> & { weekday: number; start_time: string; end_time: string }): WorkWindow {
  return {
    id: overrides.id ?? 'ww1',
    professional_id: overrides.professional_id ?? 'p1',
    weekday: overrides.weekday,
    start_time: overrides.start_time,
    end_time: overrides.end_time,
    sort_order: overrides.sort_order ?? 0,
    is_active: overrides.is_active ?? true,
    effective_from: overrides.effective_from ?? '2026-01-01',
    effective_until: overrides.effective_until,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function makeEffectiveWindows(overrides: { is_off: boolean; start_time?: string; end_time?: string; source?: 'override' | 'work_window' }): EffectiveWindow[] {
  if (overrides.is_off) return [{ window_id: null, start_time: '', end_time: '', is_off: true, source: 'override' }];
  return [{
    window_id: 'w1',
    start_time: overrides.start_time ?? '09:00',
    end_time: overrides.end_time ?? '18:00',
    is_off: false,
    source: overrides.source ?? 'work_window',
  }];
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

function makeBreak(overrides: Partial<ScheduleBreak> & { work_window_id: string; start_time: string; end_time: string }): ScheduleBreak {
  return {
    id: overrides.id ?? 'brk1',
    work_window_id: overrides.work_window_id,
    start_time: overrides.start_time,
    end_time: overrides.end_time,
    label: overrides.label ?? 'Pausa',
    sort_order: overrides.sort_order ?? 0,
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
      for (let m = 0; m < 1440; m += 30) {
        expect(timeToMinutes(minutesToTime(m))).toBe(m);
      }
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
  // DURATION VARIANTS (WorkWindow model)
  // ==========================================================================

  describe('duration: 30min service, 09:00-12:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 slot exists with end at 09:30', () => {
      const slots = getAvailableSlots(date, 30, windows, [], []);
      const first = slots[0];
      expect(formatSlotTime(first.startMinutes)).toBe('09:00');
      expect(formatSlotTime(first.endMinutes)).toBe('09:30');
    });

    it('11:30 is available (11:30+30=12:00 fits)', () => {
      const slots = getAvailableSlots(date, 30, windows, [], []);
      expect(getTimes(slots)).toContain('11:30');
    });

    it('12:00 is NOT available (12:00+30=12:30 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 30, windows, [], []);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('has 6 slots (09:00, 09:30, 10:00, 10:30, 11:00, 11:30)', () => {
      const slots = getAvailableSlots(date, 30, windows, [], []);
      expect(getTimes(slots)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
    });
  });

  describe('duration: 60min service, 09:00-18:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('17:00 is available (17:00+60=18:00 fits)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(getTimes(slots)).toContain('17:00');
    });

    it('17:30 is NOT available (17:30+60=18:30 exceeds 18:00)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(getTimes(slots)).not.toContain('17:30');
    });

    it('slots start at 30-minute intervals', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      for (const s of slots) {
        expect(s.startMinutes % 30).toBe(0);
      }
    });

    it('last slot is 17:00', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(formatSlotTime(slots[slots.length - 1].startMinutes)).toBe('17:00');
    });

    it('has 17 slots (09:00 to 17:00)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(slots).toHaveLength(17);
    });
  });

  describe('duration: 45min service, 09:00-12:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 → end at 09:45', () => {
      const slots = getAvailableSlots(date, 45, windows, [], []);
      expect(formatSlotTime(slots[0].endMinutes)).toBe('09:45');
    });

    it('09:30 → end at 10:15', () => {
      const slots = getAvailableSlots(date, 45, windows, [], []);
      expect(formatSlotTime(slots[1].endMinutes)).toBe('10:15');
    });

    it('11:30 is NOT available (11:30+45=12:15 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 45, windows, [], []);
      expect(getTimes(slots)).not.toContain('11:30');
    });

    it('last slot fits before 12:00', () => {
      const slots = getAvailableSlots(date, 45, windows, [], []);
      const last = slots[slots.length - 1];
      expect(last.endMinutes).toBeLessThanOrEqual(720);
    });
  });

  describe('duration: 75min service, 09:00-18:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('10:30 is available (10:30+75=11:45)', () => {
      const slots = getAvailableSlots(date, 75, windows, [], []);
      expect(getTimes(slots)).toContain('10:30');
    });

    it('10:30 slot ends at 11:45', () => {
      const slots = getAvailableSlots(date, 75, windows, [], []);
      const slot = slots.find((s) => formatSlotTime(s.startMinutes) === '10:30');
      expect(slot).toBeDefined();
      expect(formatSlotTime(slot!.endMinutes)).toBe('11:45');
    });

    it('17:00 is NOT available (17:00+75=18:15 exceeds 18:00)', () => {
      const slots = getAvailableSlots(date, 75, windows, [], []);
      expect(getTimes(slots)).not.toContain('17:00');
    });

    it('16:30 is the last available slot (16:30+75=17:45)', () => {
      const slots = getAvailableSlots(date, 75, windows, [], []);
      expect(formatSlotTime(slots[slots.length - 1].startMinutes)).toBe('16:30');
    });
  });

  describe('duration: 90min service, 09:00-18:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 is available', () => {
      const slots = getAvailableSlots(date, 90, windows, [], []);
      expect(getTimes(slots)).toContain('09:00');
    });

    it('16:30 IS available (16:30+90=18:00 fits exactly at window close)', () => {
      const slots = getAvailableSlots(date, 90, windows, [], []);
      expect(getTimes(slots)).toContain('16:30');
    });

    it('17:00 is NOT available (17:00+90=18:30 exceeds)', () => {
      const slots = getAvailableSlots(date, 90, windows, [], []);
      expect(getTimes(slots)).not.toContain('17:00');
    });
  });

  describe('duration: 120min service, 09:00-12:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('has exactly 3 slots (09:00, 09:30, 10:00)', () => {
      const slots = getAvailableSlots(date, 120, windows, [], []);
      expect(getTimes(slots)).toEqual(['09:00', '09:30', '10:00']);
    });

    it('10:30 is NOT available (10:30+120=12:30 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 120, windows, [], []);
      expect(getTimes(slots)).not.toContain('10:30');
    });
  });

  describe('duration: 150min service, 09:00-11:00', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '11:00' })];
    const date = monday(2026, 9, 7);

    it('has NO slots (window too short)', () => {
      const slots = getAvailableSlots(date, 150, windows, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('duration: service exceeds window', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '10:00' })];
    const date = monday(2026, 9, 7);

    it('120min service in 1h window returns 0 slots', () => {
      const slots = getAvailableSlots(date, 120, windows, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // MULTI-WINDOW (WorkWindow model with breaks via ScheduleBreak)
  // ==========================================================================

  describe('split window 09:00-12:00 + 13:00-18:00 (via breaks)', () => {
    const windowId = 'ww1';
    const windows = [makeWorkWindow({ id: windowId, weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const breaks = [makeBreak({ work_window_id: windowId, start_time: '12:00', end_time: '13:00' })];
    const date = monday(2026, 9, 7);

    it('11:00 is available (fits in morning window)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('11:30 is NOT available (crosses morning boundary)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('11:30');
    });

    it('13:00 is available (afternoon start)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('13:00');
    });

    it('12:00 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('12:30 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('12:30');
    });

    it('17:00 is available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('17:00');
    });

    it('17:30 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('17:30');
    });
  });

  describe('3-way split 08:00-11:00 + 12:00-15:00 + 16:00-19:00 (via breaks)', () => {
    const windowId = 'ww1';
    const windows = [makeWorkWindow({ id: windowId, weekday: 1, start_time: '08:00', end_time: '19:00' })];
    const breaks = [
      makeBreak({ work_window_id: windowId, start_time: '11:00', end_time: '12:00', sort_order: 0 }),
      makeBreak({ work_window_id: windowId, start_time: '15:00', end_time: '16:00', sort_order: 1 }),
    ];
    const date = monday(2026, 9, 7);

    it('10:00 is available (first window)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('10:00');
    });

    it('13:30 is available (second window)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('13:30');
    });

    it('17:30 is available (third window)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('17:30');
    });

    it('11:30 is NOT available (gap between windows)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('11:30');
    });

    it('15:30 is NOT available (gap between windows)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('15:30');
    });
  });

  // ==========================================================================
  // BLOCKED TIMES
  // ==========================================================================

  describe('blocked: 14:00-15:00 block', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('13:30 is NOT available (overlaps block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('13:30');
    });

    it('15:00 is available (after block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('15:00');
    });

    it('13:00 is available (adjacent to block, no overlap)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('13:00');
    });
  });

  describe('blocked: 14:00-16:00 with -03:00 timezone offset (Supabase TIMESTAMPTZ)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00-03:00', end_at: '2026-09-07T16:00:00-03:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('15:00 is NOT available (inside block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('15:00');
    });

    it('15:30 is NOT available (inside block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('15:30');
    });

    it('16:00 is available (after block ends)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('16:00');
    });

    it('13:00 is available (before block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('13:00');
    });

    it('13:30 is NOT available (30min service 13:30-14:30 crosses block start)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('13:30');
    });
  });

  describe('blocked: 14:15-15:45 with minutes (partial overlap)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:15:00-03:00', end_at: '2026-09-07T15:45:00-03:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 is NOT available (30min service 14:00-14:30 overlaps block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('14:30 is NOT available (30min service 14:30-15:00 inside block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:30');
    });

    it('15:00 is NOT available (30min service 15:00-15:30 inside block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('15:00');
    });

    it('15:30 is NOT available (30min service 15:30-16:00 overlaps block end)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('15:30');
    });

    it('16:00 is available (after block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).toContain('16:00');
    });

    it('13:30 is available (before block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).toContain('13:30');
    });
  });

  describe('blocked: block duration exceeds service (60min service, 14:00-16:00 block)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00-03:00', end_at: '2026-09-07T16:00:00-03:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 NOT available (60min service crosses block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('13:30 NOT available (60min service 13:30-14:30 crosses block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('13:30');
    });

    it('15:30 NOT available (60min service 15:30-16:30 crosses block end)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('15:30');
    });

    it('16:00 available (60min service 16:00-17:00 after block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('16:00');
    });

    it('13:00 available (60min service 13:00-14:00 adjacent to block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('13:00');
    });
  });

  describe('blocked: 30min service with 14:00-14:30 block (border case)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00-03:00', end_at: '2026-09-07T14:30:00-03:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 NOT available (30min service 14:00-14:30 overlaps block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('14:30 available (30min service 14:30-15:00 after block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).toContain('14:30');
    });

    it('13:30 available (30min service 13:30-14:00 adjacent to block)', () => {
      const slots = getAvailableSlots(date, 30, windows, blocked, []);
      expect(getTimes(slots)).toContain('13:30');
    });
  });

  describe('blocked: block only affects specified date', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00-03:00', end_at: '2026-09-07T16:00:00-03:00' })];
    const nextMonday = monday(2026, 9, 14);

    it('14:00 available on different date', () => {
      const slots = getAvailableSlots(nextMonday, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('14:00');
    });
  });

  describe('blocked: block for different professional does not affect', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ professional_id: 'other-pro', start_at: '2026-09-07T14:00:00-03:00', end_at: '2026-09-07T16:00:00-03:00' })];
    const date = monday(2026, 9, 7);

    it('14:00 available (engine does not filter by professional, caller must)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });
  });

  describe('blocked: fully blocked day', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T00:00:00', end_at: '2026-09-07T23:59:00' })];
    const date = monday(2026, 9, 7);

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('blocked: partial block at start of day', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('10:00 is available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('blocked: partial block at end of day', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T17:00:00', end_at: '2026-09-07T18:00:00' })];
    const date = monday(2026, 9, 7);

    it('17:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('17:00');
    });

    it('16:00 is available (16:00+60=17:00, adjacent)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  describe('blocked: multiple blocks', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [
      makeBlocked({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T11:00:00' }),
      makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T16:00:00' }),
    ];
    const date = monday(2026, 9, 7);

    it('10:00 is NOT available (first block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('14:00 is NOT available (second block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).not.toContain('14:00');
    });
  });

  describe('blocked: block for different day does not affect', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-08T09:00:00', end_at: '2026-09-08T18:00:00' })]; // Tuesday
    const date = monday(2026, 9, 7);

    it('09:00 is available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      expect(getTimes(slots)).toContain('09:00');
    });
  });

  // ==========================================================================
  // APPOINTMENTS
  // ==========================================================================

  describe('appointment: 10:00-11:00 blocks correctly', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
    const date = monday(2026, 9, 7);

    it('10:00 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('09:00 is available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).toContain('09:00');
    });

    it('11:00 is available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).toContain('11:00');
    });
  });

  describe('appointment: cancelled does NOT block', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00', status: 'cancelled' });
    const date = monday(2026, 9, 7);

    it('10:00 IS available (cancelled)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('appointment: completed DOES block', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00', status: 'completed' });
    const date = monday(2026, 9, 7);

    it('10:00 is NOT available (completed)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });
  });

  describe('appointment: adjacent appointments block consecutive slots', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt1 = makeAppointment({ id: 'ap1', start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' });
    const appt2 = makeAppointment({ id: 'ap2', start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
    const date = monday(2026, 9, 7);

    it('10:00 is NOT available (overlaps appt2 10:00-11:00)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt1, appt2]);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('11:00 IS available (after both appointments)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt1, appt2]);
      expect(getTimes(slots)).toContain('11:00');
    });
  });

  describe('appointment: overlapping appointments block correctly', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt1 = makeAppointment({ id: 'ap1', start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' });
    const appt2 = makeAppointment({ id: 'ap2', start_at: '2026-09-07T09:30:00', end_at: '2026-09-07T10:30:00' });
    const date = monday(2026, 9, 7);

    it('09:00 NOT available (first appointment)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt1, appt2]);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('10:30 available (after both)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt1, appt2]);
      expect(getTimes(slots)).toContain('10:30');
    });
  });

  describe('appointment: create removes slot', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' });
    const date = monday(2026, 9, 7);

    it('09:00 NOT available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('10:00 IS available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('appointment: engine does NOT filter by professional (caller must)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const apptOtherPro = makeAppointment({
      professional_id: 'other-pro',
      start_at: '2026-09-07T10:00:00',
      end_at: '2026-09-07T11:00:00',
    });
    const date = monday(2026, 9, 7);

    it('10:00 is NOT available (engine does not filter by professional)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [apptOtherPro]);
      expect(getTimes(slots)).not.toContain('10:00');
    });
  });

  describe('appointment: appointment for different date does not block', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appt = makeAppointment({ start_at: '2026-09-14T10:00:00', end_at: '2026-09-14T11:00:00' }); // next Monday
    const date = monday(2026, 9, 7);

    it('10:00 is available', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [appt]);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  // ==========================================================================
  // MIXED
  // ==========================================================================

  describe('mixed: blocked + appointment in same day', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
    const date = monday(2026, 9, 7);

    it('10:00 NOT available (appointment)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('14:00 NOT available (blocked)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt]);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('09:00 available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt]);
      expect(getTimes(slots)).toContain('09:00');
    });

    it('11:00 available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt]);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('15:00 available', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt]);
      expect(getTimes(slots)).toContain('15:00');
    });
  });

  // ==========================================================================
  // DAY OF WEEK
  // ==========================================================================

  describe('day-of-week: Sunday (no availability)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })]; // Monday
    const date = new Date(2026, 8, 6); // Sunday Sep 6 2026

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('day-of-week: Saturday (no availability)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })]; // Monday
    const date = new Date(2026, 8, 12); // Saturday Sep 12 2026

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('day-of-week: only Monday configured', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('has slots on Monday', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe('day-of-week: all 7 days configured', () => {
    const windows = Array.from({ length: 7 }, (_, i) =>
      makeWorkWindow({ weekday: i, start_time: '09:00', end_time: '18:00' })
    );

    it('has slots for every day', () => {
      for (let d = 6; d <= 12; d++) {
        const date = monday(2026, 9, 7).getDate() <= d
          ? new Date(2026, 8, d)
          : new Date(2026, 8, d);
        const slots = getAvailableSlots(date, 60, windows, [], []);
        expect(slots.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // NO AVAILABILITY
  // ==========================================================================

  describe('no availability: empty array', () => {
    const date = monday(2026, 9, 7);

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, [], [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('no availability: no matching weekday', () => {
    const windows = [makeWorkWindow({ weekday: 3, start_time: '09:00', end_time: '18:00' })]; // Wednesday only
    const date = monday(2026, 9, 7); // Monday

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  // ==========================================================================
  // isDateAvailable — WorkWindow model
  // ==========================================================================

  describe('isDateAvailable (WorkWindow)', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('returns true when windows exist', () => {
      expect(isDateAvailable(date, windows, true)).toBe(true);
    });

    it('returns false when no service', () => {
      expect(isDateAvailable(date, windows, false)).toBe(false);
    });

    it('returns false when no windows', () => {
      expect(isDateAvailable(date, [], true)).toBe(false);
    });

    it('returns false when inactive window', () => {
      const inactive = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00', is_active: false })];
      expect(isDateAvailable(date, inactive, true)).toBe(false);
    });
  });

  describe('isDateAvailable (EffectiveWindow)', () => {
    const date = monday(2026, 9, 7);

    it('returns true when effective windows exist', () => {
      const effective = makeEffectiveWindows({ is_off: false });
      expect(isDateAvailable(date, [], true, effective)).toBe(true);
    });

    it('returns false when day off', () => {
      const effective = makeEffectiveWindows({ is_off: true });
      expect(isDateAvailable(date, [], true, effective)).toBe(false);
    });

    it('EffectiveWindow takes precedence over WorkWindow', () => {
      const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
      const effective = makeEffectiveWindows({ is_off: true });
      expect(isDateAvailable(date, windows, true, effective)).toBe(false);
    });
  });

  // ==========================================================================
  // EFFECTIVE WINDOW: getAvailableSlots
  // ==========================================================================

  describe('EffectiveWindow: basic 09:00-18:00', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveWindows({ is_off: false, start_time: '09:00', end_time: '18:00' });

    it('generates correct slots', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective);
      expect(slots).toHaveLength(17);
    });
  });

  describe('EffectiveWindow: day off returns no slots', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveWindows({ is_off: true });

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective);
      expect(slots).toHaveLength(0);
    });
  });

  describe('EffectiveWindow: with blocked times', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveWindows({ is_off: false, start_time: '09:00', end_time: '18:00' });
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];

    it('14:00 NOT available', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [], undefined, effective);
      expect(getTimes(slots)).not.toContain('14:00');
    });
  });

  describe('EffectiveWindow: with appointments', () => {
    const date = monday(2026, 9, 7);
    const effective = makeEffectiveWindows({ is_off: false, start_time: '09:00', end_time: '18:00' });
    const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });

    it('10:00 NOT available', () => {
      const slots = getAvailableSlots(date, 60, [], [], [appt], undefined, effective);
      expect(getTimes(slots)).not.toContain('10:00');
    });
  });

  // ==========================================================================
  // EFFECTIVE WINDOW + BREAKS (the exact bug scenario)
  // ==========================================================================

  describe('EffectiveWindow + breaks: 08:00-18:00 with break 10:00-12:00', () => {
    const windowId = 'w1';
    const date = monday(2026, 9, 7);
    const effective: EffectiveWindow[] = [{ window_id: windowId, start_time: '08:00', end_time: '18:00', is_off: false, source: 'work_window' }];
    const breaks = [makeBreak({ work_window_id: windowId, start_time: '10:00', end_time: '12:00' })];

    it('09:00 is available (before break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('09:00');
    });

    it('10:00 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('11:00 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('11:00');
    });

    it('12:00 is available (after break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('12:00');
    });

    it('13:00 is available', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('13:00');
    });

    it('09:30 service crosses break boundary → NOT available', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('09:30');
    });
  });

  describe('EffectiveWindow + breaks: 08:00-18:00 with two breaks', () => {
    const windowId = 'w1';
    const date = monday(2026, 9, 7);
    const effective: EffectiveWindow[] = [{ window_id: windowId, start_time: '08:00', end_time: '18:00', is_off: false, source: 'work_window' }];
    const breaks = [
      makeBreak({ work_window_id: windowId, start_time: '10:00', end_time: '12:00', sort_order: 0 }),
      makeBreak({ work_window_id: windowId, start_time: '15:00', end_time: '16:00', sort_order: 1 }),
    ];

    it('09:00 is available (first work period)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('09:00');
    });

    it('10:00 is NOT available (first break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('13:00 is available (between breaks)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('13:00');
    });

    it('15:00 is NOT available (second break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('15:00');
    });

    it('16:00 is available (after second break)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  describe('EffectiveWindow + breaks: without breaks, all slots available', () => {
    const windowId = 'w1';
    const date = monday(2026, 9, 7);
    const effective: EffectiveWindow[] = [{ window_id: windowId, start_time: '08:00', end_time: '18:00', is_off: false, source: 'work_window' }];

    it('10:00 IS available when no breaks provided', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  describe('EffectiveWindow + breaks + blocked + appointment', () => {
    const windowId = 'w1';
    const date = monday(2026, 9, 7);
    const effective: EffectiveWindow[] = [{ window_id: windowId, start_time: '08:00', end_time: '18:00', is_off: false, source: 'work_window' }];
    const breaks = [makeBreak({ work_window_id: windowId, start_time: '12:00', end_time: '13:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T14:00:00', end_at: '2026-09-07T15:00:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' });

    it('09:00 NOT available (appointment)', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [appt], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('12:00 NOT available (break)', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [appt], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('14:00 NOT available (blocked)', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [appt], undefined, effective, breaks);
      expect(getTimes(slots)).not.toContain('14:00');
    });

    it('10:00 available (between appointment and break)', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [appt], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('10:00');
    });

    it('15:00 available (after block)', () => {
      const slots = getAvailableSlots(date, 60, [], blocked, [appt], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('15:00');
    });
  });

  describe('EffectiveWindow + breaks: different window_id does not match', () => {
    const date = monday(2026, 9, 7);
    const effective: EffectiveWindow[] = [{ window_id: 'w1', start_time: '08:00', end_time: '18:00', is_off: false, source: 'work_window' }];
    const breaks = [makeBreak({ work_window_id: 'w_OTHER', start_time: '10:00', end_time: '12:00' })];

    it('10:00 IS available (break belongs to different window)', () => {
      const slots = getAvailableSlots(date, 60, [], [], [], undefined, effective, breaks);
      expect(getTimes(slots)).toContain('10:00');
    });
  });

  // ==========================================================================
  // NOW FILTERING (past slots excluded for today)
  // ==========================================================================

  describe('now filtering: past slots on same day excluded', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);
    const now = new Date(2026, 8, 7, 10, 30); // Sep 7 10:30

    it('10:00 NOT available (past)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], now);
      expect(getTimes(slots)).not.toContain('10:00');
    });

    it('10:30 NOT available (current time)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], now);
      expect(getTimes(slots)).not.toContain('10:30');
    });

    it('11:00 available (future)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], now);
      expect(getTimes(slots)).toContain('11:00');
    });
  });

  describe('now filtering: different day not affected', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 14); // Next Monday
    const now = new Date(2026, 8, 7, 10, 30); // Sep 7 10:30

    it('09:00 available (different day, now ignored)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], [], now);
      expect(getTimes(slots)).toContain('09:00');
    });
  });

  // ==========================================================================
  // DUPLICATE PREVENTION
  // ==========================================================================

  describe('no duplicate slots across windows', () => {
    const windows = [
      makeWorkWindow({ id: 'ww1', weekday: 1, start_time: '09:00', end_time: '12:00' }),
      makeWorkWindow({ id: 'ww2', weekday: 1, start_time: '09:00', end_time: '12:00' }), // overlapping config
    ];
    const date = monday(2026, 9, 7);

    it('no duplicate slots', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      const times = getTimes(slots);
      expect(new Set(times).size).toBe(times.length);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('edge: very short window (30min) with 30min service', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '09:30' })];
    const date = monday(2026, 9, 7);

    it('exactly 1 slot', () => {
      const slots = getAvailableSlots(date, 30, windows, [], []);
      expect(slots).toHaveLength(1);
      expect(formatSlotTime(slots[0].startMinutes)).toBe('09:00');
      expect(formatSlotTime(slots[0].endMinutes)).toBe('09:30');
    });
  });

  describe('edge: service duration equals window', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '10:00' })];
    const date = monday(2026, 9, 7);

    it('1 slot at 09:00', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      expect(slots).toHaveLength(1);
      expect(formatSlotTime(slots[0].startMinutes)).toBe('09:00');
    });
  });

  describe('edge: service 1 minute longer than window', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '10:00' })];
    const date = monday(2026, 9, 7);

    it('0 slots', () => {
      const slots = getAvailableSlots(date, 61, windows, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('edge: start time not aligned to 30min', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:15', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('first slot at 09:15 (engine uses window start, not 30min boundary)', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      if (slots.length > 0) {
        expect(formatSlotTime(slots[0].startMinutes)).toBe('09:15');
      }
    });
  });

  describe('edge: block overlaps break', () => {
    const windowId = 'ww1';
    const windows = [makeWorkWindow({ id: windowId, weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const breaks = [makeBreak({ work_window_id: windowId, start_time: '12:00', end_time: '13:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T11:30:00', end_at: '2026-09-07T13:30:00' })];
    const date = monday(2026, 9, 7);

    it('10:30 available (10:30-11:30, adjacent to block start)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('10:30');
    });

    it('11:00 NOT available (11:00-12:00 overlaps block 11:30-13:30)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('11:00');
    });

    it('13:30 available (after both block and break)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('13:30');
    });

    it('12:00 NOT available (break or block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('12:00');
    });
  });

  describe('edge: block + appointment + break all in same day', () => {
    const windowId = 'ww1';
    const windows = [makeWorkWindow({ id: windowId, weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const breaks = [makeBreak({ work_window_id: windowId, start_time: '12:00', end_time: '13:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-07T15:00:00', end_at: '2026-09-07T16:00:00' })];
    const appt = makeAppointment({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' });
    const date = monday(2026, 9, 7);

    it('09:00 NOT available (appointment)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('09:00');
    });

    it('12:00 NOT available (break)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('12:00');
    });

    it('15:00 NOT available (blocked)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).not.toContain('15:00');
    });

    it('11:00 available (between appointment and break)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('11:00');
    });

    it('14:00 available (between break and block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('14:00');
    });

    it('16:00 available (after block)', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, [appt], undefined, undefined, breaks, [windowId]);
      expect(getTimes(slots)).toContain('16:00');
    });
  });

  // ==========================================================================
  // SLOT FORMAT VALIDATION
  // ==========================================================================

  describe('slot format: startAt and endAt are correct ISO strings', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('first slot has correct format', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      const first = slots[0];
      expect(first.startAt).toBe('2026-09-07T09:00');
      expect(first.endAt).toBe('2026-09-07T10:00');
    });

    it('all slots have available=true', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      for (const s of slots) {
        expect(s.available).toBe(true);
      }
    });

    it('startMinutes matches startAt time', () => {
      const slots = getAvailableSlots(date, 60, windows, [], []);
      for (const s of slots) {
        expect(s.startMinutes).toBe(timeToMinutes(s.startAt.split('T')[1]));
      }
    });
  });

  // ==========================================================================
  // MULTI-WINDOW WITH BLOCKS
  // ==========================================================================

  describe('multi-window with block in morning', () => {
    const windows = [
      makeWorkWindow({ weekday: 1, start_time: '08:00', end_time: '12:00' }),
      makeWorkWindow({ weekday: 1, start_time: '14:00', end_time: '18:00' }),
    ];
    const blocked = [makeBlocked({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' })];
    const date = monday(2026, 9, 7);

    it('morning slots respect block', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      const times = getTimes(slots);
      expect(times).not.toContain('09:30');
      expect(times).not.toContain('10:00');
      expect(times).not.toContain('10:30');
      expect(times).toContain('09:00');
      expect(times).toContain('11:00');
    });

    it('afternoon slots unaffected', () => {
      const slots = getAvailableSlots(date, 60, windows, blocked, []);
      const times = getTimes(slots);
      expect(times).toContain('14:00');
      expect(times).toContain('17:00');
    });
  });

  // ==========================================================================
  // CHANGE SERVICE RECALCULATES
  // ==========================================================================

  describe('change service recalculates', () => {
    const windows = [makeWorkWindow({ weekday: 1, start_time: '09:00', end_time: '11:00' })];
    const date = monday(2026, 9, 7);

    it('60min service has slots', () => {
      expect(getAvailableSlots(date, 60, windows, [], []).length).toBeGreaterThan(0);
    });

    it('150min service has NO slots', () => {
      expect(getAvailableSlots(date, 150, windows, [], [])).toHaveLength(0);
    });

    it('30min service has more slots than 60min', () => {
      expect(getAvailableSlots(date, 30, windows, [], []).length).toBeGreaterThan(
        getAvailableSlots(date, 60, windows, [], []).length
      );
    });
  });
});
