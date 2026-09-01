import type { Availability, BlockedTime, Appointment, WorkSchedule, EffectiveSchedule } from '../supabase/types';

const SLOT_INTERVAL_MINUTES = 30;

export interface TimeSlot {
  startMinutes: number;
  endMinutes: number;
  startAt: string;
  endAt: string;
  available: boolean;
}

export interface WorkWindow {
  startMinutes: number;
  endMinutes: number;
  lunchStart?: number;
  lunchEnd?: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function intervalsOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function fitsInWindow(
  startMinutes: number,
  endMinutes: number,
  window: WorkWindow,
): boolean {
  return startMinutes >= window.startMinutes && endMinutes <= window.endMinutes;
}

function overlapsLunch(
  startMinutes: number,
  endMinutes: number,
  window: WorkWindow,
): boolean {
  if (window.lunchStart == null || window.lunchEnd == null) return false;
  return intervalsOverlap(startMinutes, endMinutes, window.lunchStart, window.lunchEnd);
}

function hasOverlap(
  startMinutes: number,
  endMinutes: number,
  busy: Array<{ startMinutes: number; endMinutes: number }>,
): boolean {
  return busy.some((b) => intervalsOverlap(startMinutes, endMinutes, b.startMinutes, b.endMinutes));
}

function getDateStr(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function parseTimestampToMinutes(ts: string, dateStr: string): number {
  const d = new Date(ts);
  const ds = getDateStr(d);
  if (ds !== dateStr) return -1;
  return d.getHours() * 60 + d.getMinutes();
}

// ============================================================================
// NEW: Build work windows from WorkSchedule[] (new system)
// ============================================================================
function buildWindowsFromWorkSchedules(
  schedules: WorkSchedule[],
  weekday: number,
): WorkWindow[] {
  return schedules
    .filter((ws) => ws.weekday === weekday && ws.is_active)
    .map((ws) => ({
      startMinutes: timeToMinutes(ws.start_time),
      endMinutes: timeToMinutes(ws.end_time),
      lunchStart: ws.lunch_start ? timeToMinutes(ws.lunch_start) : undefined,
      lunchEnd: ws.lunch_end ? timeToMinutes(ws.lunch_end) : undefined,
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

// ============================================================================
// NEW: Build work window from EffectiveSchedule (new system, single day)
// ============================================================================
function buildWindowFromEffectiveSchedule(
  effective: EffectiveSchedule,
): WorkWindow | null {
  if (effective.is_off || !effective.start_time || !effective.end_time) return null;
  return {
    startMinutes: timeToMinutes(effective.start_time),
    endMinutes: timeToMinutes(effective.end_time),
    lunchStart: effective.lunch_start ? timeToMinutes(effective.lunch_start) : undefined,
    lunchEnd: effective.lunch_end ? timeToMinutes(effective.lunch_end) : undefined,
  };
}

// ============================================================================
// LEGACY: Build work windows from Availability[] (old system)
// ============================================================================
function buildWindowsFromAvailability(
  availability: Availability[],
  weekday: number,
): WorkWindow[] {
  return availability
    .filter((a) => a.weekday === weekday)
    .map((a) => ({
      startMinutes: timeToMinutes(a.start_time),
      endMinutes: timeToMinutes(a.end_time),
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

function getBusyForDay(
  blockedTimes: BlockedTime[],
  appointments: Appointment[],
  dateStr: string,
): Array<{ startMinutes: number; endMinutes: number }> {
  const busy: Array<{ startMinutes: number; endMinutes: number }> = [];

  for (const bt of blockedTimes) {
    const s = parseTimestampToMinutes(bt.start_at, dateStr);
    const e = parseTimestampToMinutes(bt.end_at, dateStr);
    if (s >= 0 && e >= 0) {
      busy.push({ startMinutes: s, endMinutes: e });
    }
  }

  for (const ap of appointments) {
    if (ap.status !== 'confirmed' && ap.status !== 'completed') continue;
    const s = parseTimestampToMinutes(ap.start_at, dateStr);
    const e = parseTimestampToMinutes(ap.end_at, dateStr);
    if (s >= 0 && e >= 0) {
      busy.push({ startMinutes: s, endMinutes: e });
    }
  }

  return busy;
}

// ============================================================================
// isDateAvailable — supports both old (Availability) and new (WorkSchedule) systems
// ============================================================================
export function isDateAvailable(
  date: Date,
  availabilityOrSchedules: Availability[] | WorkSchedule[],
  professionalServiceExists: boolean,
  effectiveSchedule?: EffectiveSchedule | null,
): boolean {
  if (!professionalServiceExists) return false;
  const weekday = date.getDay();

  // New system: use effectiveSchedule if provided
  if (effectiveSchedule !== undefined) {
    if (effectiveSchedule?.is_off || !effectiveSchedule) return false;
    return !!effectiveSchedule.start_time && !!effectiveSchedule.end_time;
  }

  // New system: WorkSchedule[]
  if (availabilityOrSchedules.length > 0 && 'lunch_start' in availabilityOrSchedules[0]) {
    const windows = buildWindowsFromWorkSchedules(availabilityOrSchedules as WorkSchedule[], weekday);
    return windows.length > 0;
  }

  // Legacy: Availability[]
  const windows = buildWindowsFromAvailability(availabilityOrSchedules as Availability[], weekday);
  return windows.length > 0;
}

// ============================================================================
// getAvailableSlots — supports both systems
// ============================================================================
export function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  availabilityOrSchedules: Availability[] | WorkSchedule[],
  blockedTimes: BlockedTime[],
  appointments: Appointment[],
  now?: Date,
  effectiveSchedule?: EffectiveSchedule | null,
): TimeSlot[] {
  const weekday = date.getDay();
  const dateStr = getDateStr(date);
  let windows: WorkWindow[] = [];

  // New system: use effectiveSchedule if provided
  if (effectiveSchedule !== undefined) {
    if (effectiveSchedule) {
      const w = buildWindowFromEffectiveSchedule(effectiveSchedule);
      if (w) windows = [w];
    }
  } else if (availabilityOrSchedules.length > 0 && 'lunch_start' in availabilityOrSchedules[0]) {
    // New system: WorkSchedule[]
    windows = buildWindowsFromWorkSchedules(availabilityOrSchedules as WorkSchedule[], weekday);
  } else {
    // Legacy: Availability[]
    windows = buildWindowsFromAvailability(availabilityOrSchedules as Availability[], weekday);
  }

  if (windows.length === 0) return [];

  const busy = getBusyForDay(blockedTimes, appointments, dateStr);

  const slots: TimeSlot[] = [];

  for (const window of windows) {
    for (let startMin = window.startMinutes; startMin + durationMinutes <= window.endMinutes; startMin += SLOT_INTERVAL_MINUTES) {
      const endMin = startMin + durationMinutes;

      if (!fitsInWindow(startMin, endMin, window)) continue;
      if (overlapsLunch(startMin, endMin, window)) continue;
      if (hasOverlap(startMin, endMin, busy)) continue;

      if (now) {
        const nowDate = getDateStr(now);
        if (dateStr === nowDate) {
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          if (startMin <= nowMinutes) continue;
        }
      }

      // Avoid duplicate slots across windows
      if (slots.some((s) => s.startMinutes === startMin)) continue;

      slots.push({
        startMinutes: startMin,
        endMinutes: endMin,
        startAt: `${dateStr}T${minutesToTime(startMin)}`,
        endAt: `${dateStr}T${minutesToTime(endMin)}`,
        available: true,
      });
    }
  }

  return slots.sort((a, b) => a.startMinutes - b.startMinutes);
}

export function formatSlotTime(minutes: number): string {
  return minutesToTime(minutes);
}

export { SLOT_INTERVAL_MINUTES, timeToMinutes, minutesToTime };
