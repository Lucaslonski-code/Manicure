import type { BlockedTime, Appointment, WorkWindow, ScheduleBreak, EffectiveWindow } from '../supabase/types';

const SLOT_INTERVAL_MINUTES = 30;

export interface TimeSlot {
  startMinutes: number;
  endMinutes: number;
  startAt: string;
  endAt: string;
  available: boolean;
}

export interface WorkWindowInternal {
  startMinutes: number;
  endMinutes: number;
  breaks: Array<{ startMinutes: number; endMinutes: number }>;
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
  window: WorkWindowInternal,
): boolean {
  return startMinutes >= window.startMinutes && endMinutes <= window.endMinutes;
}

function overlapsAnyBreak(
  startMinutes: number,
  endMinutes: number,
  window: WorkWindowInternal,
): boolean {
  return window.breaks.some((brk) =>
    intervalsOverlap(startMinutes, endMinutes, brk.startMinutes, brk.endMinutes)
  );
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
// Build work windows from WorkWindow[] (new system with multi-window + multi-break)
// ============================================================================
function buildWindowsFromWorkWindows(
  windows: WorkWindow[],
  weekday: number,
): WorkWindowInternal[] {
  return windows
    .filter((ww) => ww.weekday === weekday && ww.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.start_time.localeCompare(b.start_time))
    .map((ww) => ({
      startMinutes: timeToMinutes(ww.start_time),
      endMinutes: timeToMinutes(ww.end_time),
      breaks: [],
    }));
}

// ============================================================================
// Attach breaks to windows from ScheduleBreak[]
// ============================================================================
function attachBreaksToWindows(
  windows: WorkWindowInternal[],
  breaks: ScheduleBreak[],
  windowIds: string[],
): WorkWindowInternal[] {
  return windows.map((win, idx) => {
    const windowId = windowIds[idx];
    const windowBreaks = breaks
      .filter((brk) => brk.work_window_id === windowId)
      .sort((a, b) => a.sort_order - b.sort_order || a.start_time.localeCompare(b.start_time))
      .map((brk) => ({
        startMinutes: timeToMinutes(brk.start_time),
        endMinutes: timeToMinutes(brk.end_time),
      }));
    return { ...win, breaks: windowBreaks };
  });
}

// ============================================================================
// Build work window from EffectiveWindow (new system, single day from RPC)
// ============================================================================
function buildWindowFromEffectiveWindow(
  effective: EffectiveWindow,
): WorkWindowInternal | null {
  if (effective.is_off || !effective.start_time || !effective.end_time) return null;
  return {
    startMinutes: timeToMinutes(effective.start_time),
    endMinutes: timeToMinutes(effective.end_time),
    breaks: [],
  };
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
// Detect which type of schedule data is passed
// ============================================================================
type ScheduleInput = WorkWindow[];

function isNewWorkWindowSystem(schedules: ScheduleInput): boolean {
  if (schedules.length === 0) return false;
  const first = schedules[0] as any;
  return 'sort_order' in first || 'effective_from' in first;
}

// ============================================================================
// isDateAvailable — WorkWindow model
// ============================================================================
export function isDateAvailable(
  date: Date,
  availabilityOrSchedules: ScheduleInput,
  professionalServiceExists: boolean,
  effectiveWindows?: EffectiveWindow[] | null,
): boolean {
  if (!professionalServiceExists) return false;
  const weekday = date.getDay();

  // New system: use effectiveWindows if provided
  if (effectiveWindows !== undefined) {
    if (!effectiveWindows || effectiveWindows.length === 0) return false;
    return effectiveWindows.some((ew) => !ew.is_off && ew.start_time && ew.end_time);
  }

  // New system: WorkWindow[]
  if (isNewWorkWindowSystem(availabilityOrSchedules)) {
    const windows = buildWindowsFromWorkWindows(availabilityOrSchedules as WorkWindow[], weekday);
    return windows.length > 0;
  }

  return false;
}

// ============================================================================
// getAvailableSlots — WorkWindow model + multi-break
// ============================================================================
export function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  availabilityOrSchedules: ScheduleInput,
  blockedTimes: BlockedTime[],
  appointments: Appointment[],
  now?: Date,
  effectiveWindows?: EffectiveWindow[] | null,
  breaks?: ScheduleBreak[],
  windowIds?: string[],
): TimeSlot[] {
  const dateStr = getDateStr(date);
  let windows: WorkWindowInternal[] = [];

  // New system: use effectiveWindows if provided
  if (effectiveWindows !== undefined) {
    if (effectiveWindows && effectiveWindows.length > 0) {
      windows = effectiveWindows
        .map((ew) => buildWindowFromEffectiveWindow(ew))
        .filter((w): w is WorkWindowInternal => w !== null);
    }
  } else if (isNewWorkWindowSystem(availabilityOrSchedules)) {
    // New system: WorkWindow[] + ScheduleBreak[]
    const wwList = availabilityOrSchedules as WorkWindow[];
    const weekday = date.getDay();
    windows = buildWindowsFromWorkWindows(wwList, weekday);
    if (breaks && windowIds) {
      windows = attachBreaksToWindows(windows, breaks, windowIds);
    }
  }

  if (windows.length === 0) return [];

  const busy = getBusyForDay(blockedTimes, appointments, dateStr);

  const slots: TimeSlot[] = [];

  for (const window of windows) {
    for (let startMin = window.startMinutes; startMin + durationMinutes <= window.endMinutes; startMin += SLOT_INTERVAL_MINUTES) {
      const endMin = startMin + durationMinutes;

      if (!fitsInWindow(startMin, endMin, window)) continue;
      if (overlapsAnyBreak(startMin, endMin, window)) continue;
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
