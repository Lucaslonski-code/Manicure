import { getAvailableSlots, isDateAvailable, formatSlotTime, timeToMinutes, minutesToTime, SLOT_INTERVAL_MINUTES } from '../../services/availabilityEngine';
import type { Availability, BlockedTime, Appointment } from '../../supabase/types';

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

describe('availabilityEngine', () => {
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
    it('roundtrips correctly', () => {
      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(1050)).toBe('17:30');
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(765)).toBe('12:45');
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
  });

  describe('TESTE 1 - 60min service, 09:00-18:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7); // Monday

    it('17:00 is available (17:00+60=18:00 fits)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('17:00');
    });

    it('17:30 is NOT available (17:30+60=18:30 exceeds 18:00)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('17:30');
    });

    it('slots start at 30-minute intervals', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => s.startMinutes);
      for (const t of times) {
        expect(t % 30).toBe(0);
      }
    });

    it('last slot is 17:00', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const last = slots[slots.length - 1];
      expect(formatSlotTime(last.startMinutes)).toBe('17:00');
    });
  });

  describe('TESTE 2 - 60min service, split window 09:00-12:00 + 13:00-18:00', () => {
    const avail = [
      makeAvailability({ weekday: 2, start_time: '09:00', end_time: '12:00' }),
      makeAvailability({ weekday: 2, start_time: '13:00', end_time: '18:00' }),
    ];
    const date = monday(2026, 9, 8); // Tuesday

    it('11:00 is available (11:00+60=12:00 fits in morning window)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('11:00');
    });

    it('11:30 is NOT available (11:30+60=12:30 crosses lunch break)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('11:30');
    });

    it('13:00 is available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('13:00');
    });

    it('17:00 is available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('17:00');
    });

    it('17:30 is NOT available', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('17:30');
    });

    it('12:00 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('12:00');
    });

    it('12:30 is NOT available (in break)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('12:30');
    });
  });

  describe('TESTE 3 - 60min service, blocked time 14:00-15:00', () => {
    const avail = [makeAvailability({ weekday: 3, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-09T14:00:00', end_at: '2026-09-09T15:00:00' })];
    const date = monday(2026, 9, 9); // Wednesday

    it('14:00 is NOT available (overlaps block)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('14:00');
    });

    it('13:30 is NOT available (13:30+60=14:30 overlaps block 14:00-15:00)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('13:30');
    });

    it('15:00 is available (after block ends)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('15:00');
    });

    it('13:00 is available (13:00+60=14:00, adjacent to block, no overlap)', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('13:00');
    });
  });

  describe('TESTE 4 - 60min service, existing appointment 10:00-11:00', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const appts = [makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' })];
    const date = monday(2026, 9, 7);

    it('09:30 is NOT available (09:30+60=10:30 overlaps 10:00-11:00)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('09:30');
    });

    it('10:00 is NOT available (overlaps appointment)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('10:00');
    });

    it('10:30 is NOT available (10:30+60=11:30 overlaps 10:00-11:00)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('10:30');
    });

    it('11:00 is available (after appointment ends)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('11:00');
    });

    it('09:00 is available (09:00+60=10:00, adjacent to appointment, no overlap)', () => {
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('09:00');
    });
  });

  describe('TESTE 5 - 120min service, insufficient window', () => {
    const avail = [makeAvailability({ weekday: 5, start_time: '11:00', end_time: '12:00' })];
    const date = monday(2026, 9, 11); // Friday

    it('11:00 is NOT available (11:00+120=13:00 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 120, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('TESTE 6 - 45min service, real end times', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('09:00 → end at 09:45', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      const first = slots[0];
      expect(formatSlotTime(first.startMinutes)).toBe('09:00');
      expect(formatSlotTime(first.endMinutes)).toBe('09:45');
    });

    it('09:30 → end at 10:15', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      const second = slots[1];
      expect(formatSlotTime(second.startMinutes)).toBe('09:30');
      expect(formatSlotTime(second.endMinutes)).toBe('10:15');
    });

    it('last slot fits before 12:00', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      const last = slots[slots.length - 1];
      expect(last.endMinutes).toBeLessThanOrEqual(720); // 12:00 = 720 min
    });

    it('11:30 is NOT available (11:30+45=12:15 exceeds 12:00)', () => {
      const slots = getAvailableSlots(date, 45, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('11:30');
    });
  });

  describe('TESTE 7 - 75min service, start 10:30', () => {
    const avail = [makeAvailability({ weekday: 2, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 8); // Tuesday

    it('10:30 is available (10:30+75=11:45, fits in window)', () => {
      const slots = getAvailableSlots(date, 75, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('10:30');
    });

    it('10:30 slot ends at 11:45', () => {
      const slots = getAvailableSlots(date, 75, avail, [], []);
      const slot = slots.find((s) => s.startMinutes === 630); // 10:30 = 630
      expect(slot).toBeDefined();
      expect(slot!.endMinutes).toBe(705); // 11:45 = 705
    });
  });

  describe('TESTE 8 - fully blocked day', () => {
    const avail = [makeAvailability({ weekday: 4, start_time: '09:00', end_time: '18:00' })];
    const blocked = [makeBlocked({ start_at: '2026-09-10T09:00:00', end_at: '2026-09-10T18:00:00' })];
    const date = monday(2026, 9, 10); // Thursday

    it('returns no slots', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('TESTE 9 - Sunday (no availability)', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = new Date(2026, 8, 6); // Sunday Sep 6

    it('returns no slots for Sunday', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('TESTE 10 - change service recalculates', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '11:00' })];
    const date = monday(2026, 9, 7);

    it('60min service has slots', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      expect(slots.length).toBeGreaterThan(0);
    });

    it('150min service has NO slots in 2h window', () => {
      const slots = getAvailableSlots(date, 150, avail, [], []);
      expect(slots).toHaveLength(0);
    });

    it('30min service has more slots than 60min', () => {
      const slots30 = getAvailableSlots(date, 30, avail, [], []);
      const slots60 = getAvailableSlots(date, 60, avail, [], []);
      expect(slots30.length).toBeGreaterThan(slots60.length);
    });
  });

  describe('TESTE 13 - create appointment removes slot', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('10:00 available without appointment', () => {
      const slots = getAvailableSlots(date, 60, avail, [], []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('10:00');
    });

    it('10:00 NOT available with appointment', () => {
      const appt = makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' });
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('10:00');
    });
  });

  describe('TESTE 14 - cancelled appointment does NOT block', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('10:00 available with cancelled appointment', () => {
      const appt = makeAppointment({
        start_at: '2026-09-07T10:00:00',
        end_at: '2026-09-07T11:00:00',
        status: 'cancelled',
      });
      const slots = getAvailableSlots(date, 60, avail, [], [appt]);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('10:00');
    });
  });

  describe('isDateAvailable', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];

    it('returns true for available weekday with service', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, avail, true)).toBe(true);
    });

    it('returns false for unavailable weekday', () => {
      const date = new Date(2026, 8, 6); // Sunday
      expect(isDateAvailable(date, avail, true)).toBe(false);
    });

    it('returns false if professional has no service', () => {
      const date = monday(2026, 9, 7);
      expect(isDateAvailable(date, avail, false)).toBe(false);
    });

    it('returns false if no availability for weekday', () => {
      const date = monday(2026, 9, 7); // Monday, but only Tuesday configured
      const tuesdayAvail = [makeAvailability({ weekday: 2, start_time: '09:00', end_time: '18:00' })];
      expect(isDateAvailable(date, tuesdayAvail, true)).toBe(false);
    });
  });

  describe('overlap detection', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '18:00' })];
    const date = monday(2026, 9, 7);

    it('adjacent appointments do not conflict', () => {
      const appts = [
        makeAppointment({ start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' }),
        makeAppointment({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' }),
      ];
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('11:00');
    });

    it('overlapping appointments block correctly', () => {
      const appts = [
        makeAppointment({ id: 'ap1', start_at: '2026-09-07T09:00:00', end_at: '2026-09-07T10:00:00' }),
        makeAppointment({ id: 'ap2', start_at: '2026-09-07T09:30:00', end_at: '2026-09-07T10:30:00' }),
      ];
      const slots = getAvailableSlots(date, 60, avail, [], appts);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      // 09:00, 09:30, 10:00 all blocked by combined 09:00-10:30
      expect(times).not.toContain('09:00');
      expect(times).not.toContain('09:30');
      expect(times).not.toContain('10:00');
      expect(times).toContain('10:30');
    });
  });

  describe('long service duration', () => {
    const avail = [makeAvailability({ weekday: 1, start_time: '09:00', end_time: '12:00' })];
    const date = monday(2026, 9, 7);

    it('120min service in 3h window has limited slots', () => {
      const slots = getAvailableSlots(date, 120, avail, [], []);
      // 09:00+120=11:00 ok, 09:30+120=11:30 ok, 10:00+120=12:00 ok
      expect(slots).toHaveLength(3);
    });

    it('all 120min slots start at 30-min intervals', () => {
      const slots = getAvailableSlots(date, 120, avail, [], []);
      for (const s of slots) {
        expect(s.startMinutes % 30).toBe(0);
      }
    });
  });

  describe('multi-window with block', () => {
    const avail = [
      makeAvailability({ weekday: 1, start_time: '08:00', end_time: '12:00' }),
      makeAvailability({ weekday: 1, start_time: '14:00', end_time: '18:00' }),
    ];
    const blocked = [makeBlocked({ start_at: '2026-09-07T10:00:00', end_at: '2026-09-07T11:00:00' })];
    const date = monday(2026, 9, 7);

    it('slots in morning window respect block', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).not.toContain('09:30'); // overlaps block 10:00-11:00
      expect(times).not.toContain('10:00');
      expect(times).not.toContain('10:30');
      expect(times).toContain('09:00');
      expect(times).toContain('11:00');
    });

    it('slots in afternoon window are unaffected', () => {
      const slots = getAvailableSlots(date, 60, avail, blocked, []);
      const times = slots.map((s) => formatSlotTime(s.startMinutes));
      expect(times).toContain('14:00');
      expect(times).toContain('17:00');
    });
  });
});
