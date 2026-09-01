import type { Availability, BlockedTime, Appointment } from '../supabase/types';

const SLOT_INTERVAL_MINUTES = 30;

export interface TimeSlot {
  startMinutes: number;
  endMinutes: number;
  startAt: string;
  endAt: string;
  available: boolean;
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

function fitsInAnyWindow(
  startMinutes: number,
  endMinutes: number,
  windows: Array<{ startMinutes: number; endMinutes: number }>,
): boolean {
  return windows.some((w) => startMinutes >= w.startMinutes && endMinutes <= w.endMinutes);
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

function getWindowsForWeekday(
  availability: Availability[],
  weekday: number,
): Array<{ startMinutes: number; endMinutes: number }> {
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
    if (ap.status !== 'confirmed') continue;
    const s = parseTimestampToMinutes(ap.start_at, dateStr);
    const e = parseTimestampToMinutes(ap.end_at, dateStr);
    if (s >= 0 && e >= 0) {
      busy.push({ startMinutes: s, endMinutes: e });
    }
  }

  return busy;
}

export function isDateAvailable(
  date: Date,
  availability: Availability[],
  professionalServiceExists: boolean,
): boolean {
  if (!professionalServiceExists) return false;
  const weekday = date.getDay();
  const windows = getWindowsForWeekday(availability, weekday);
  return windows.length > 0;
}

export function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  availability: Availability[],
  blockedTimes: BlockedTime[],
  appointments: Appointment[],
  now?: Date,
): TimeSlot[] {
  const weekday = date.getDay();
  const windows = getWindowsForWeekday(availability, weekday);

  if (windows.length === 0) return [];

  const dateStr = getDateStr(date);
  const busy = getBusyForDay(blockedTimes, appointments, dateStr);

  const slots: TimeSlot[] = [];
  const earliestStart = Math.min(...windows.map((w) => w.startMinutes));
  const latestEnd = Math.max(...windows.map((w) => w.endMinutes));

  for (let startMin = earliestStart; startMin + durationMinutes <= latestEnd; startMin += SLOT_INTERVAL_MINUTES) {
    const endMin = startMin + durationMinutes;

    if (!fitsInAnyWindow(startMin, endMin, windows)) continue;
    if (hasOverlap(startMin, endMin, busy)) continue;

    if (now) {
      const nowDate = getDateStr(now);
      if (dateStr === nowDate) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (startMin <= nowMinutes) continue;
      }
    }

    slots.push({
      startMinutes: startMin,
      endMinutes: endMin,
      startAt: `${dateStr}T${minutesToTime(startMin)}`,
      endAt: `${dateStr}T${minutesToTime(endMin)}`,
      available: true,
    });
  }

  return slots;
}

export function formatSlotTime(minutes: number): string {
  return minutesToTime(minutes);
}

export { SLOT_INTERVAL_MINUTES, timeToMinutes, minutesToTime };
