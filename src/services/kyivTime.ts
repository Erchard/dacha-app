// Helper for time handling in Europe/Kyiv zone

export const KYIV_TIMEZONE = 'Europe/Kyiv';

export function getKyivNow(): Date {
  return new Date();
}

/**
 * Returns formatted date in Europe/Kyiv timezone (YYYY-MM-DD)
 */
export function toKyivDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KYIV_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns hours and minutes in Kyiv timezone ("HH:mm")
 */
export function toKyivTimeString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('uk-UA', {
    timeZone: KYIV_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Returns readable Ukrainian full date & time
 */
export function formatKyivDateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat('uk-UA', {
    timeZone: KYIV_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Returns Ukrainian month and year ("Жовтень 2026")
 */
export function formatKyivMonthYear(date: Date): string {
  const formatter = new Intl.DateTimeFormat('uk-UA', {
    timeZone: KYIV_TIMEZONE,
    month: 'long',
    year: 'numeric',
  });
  const res = formatter.format(date);
  return res.charAt(0).toUpperCase() + res.slice(1);
}

/**
 * Returns Ukrainian weekday short ("Пн", "Вт", ...)
 */
export function formatKyivWeekday(date: Date): string {
  const formatter = new Intl.DateTimeFormat('uk-UA', {
    timeZone: KYIV_TIMEZONE,
    weekday: 'short',
  });
  const res = formatter.format(date);
  return res.charAt(0).toUpperCase() + res.slice(1);
}

/**
 * Create a UTC Date from Kyiv date (YYYY-MM-DD) and time (HH:mm)
 */
export function createKyivDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create ISO string with Kyiv offset representation
  // For standard calculations, we can create date and check offset
  const temp = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: KYIV_TIMEZONE,
    timeZoneName: 'shortOffset',
  });
  const parts = tzFormatter.formatToParts(temp);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+3';
  
  // Parse GMT offset, e.g. "GMT+3" or "GMT+2"
  const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  let offsetMinutes = 180; // default UTC+3
  if (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const h = parseInt(match[2], 10);
    const m = match[3] ? parseInt(match[3], 10) : 0;
    offsetMinutes = sign * (h * 60 + m);
  }

  // Adjust UTC timestamp to represent the exact moment in Europe/Kyiv
  const utcMillis = Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60 * 1000;
  return new Date(utcMillis);
}

export const SLOT_MINUTES = 30;
export const SLOT_MS = SLOT_MINUTES * 60 * 1000;
export const BLOCK_HOURS = 6;
export const BLOCK_MS = BLOCK_HOURS * 3600 * 1000;

export interface SlotsByBlock {
  [blockId: string]: string[]; // array of slot keys like ['s00', 's01']
}

/**
 * Calculates 6-hour UTC block IDs and slot keys for a given interval.
 * Exactly matches Flutter and Firestore rules specification.
 */
export function getSlotsByBlock(start: Date, end: Date): SlotsByBlock {
  const result: Record<string, string[]> = {};
  const startMs = start.getTime();
  const endMs = end.getTime();

  for (let t = startMs; t < endMs; t += SLOT_MS) {
    const base = Math.floor(t / BLOCK_MS) * BLOCK_MS;
    const blockId = (base / 1000).toString();
    const index = Math.floor((t - base) / SLOT_MS);
    const slotKey = `s${index.toString().padStart(2, '0')}`;

    if (!result[blockId]) {
      result[blockId] = [];
    }
    if (!result[blockId].includes(slotKey)) {
      result[blockId].push(slotKey);
    }
  }

  return result;
}

/**
 * Generate 30-minute intervals for select options ("08:00", "08:30", ..., "22:00")
 */
export function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 22 && m > 0) break;
      const hourStr = h.toString().padStart(2, '0');
      const minStr = m.toString().padStart(2, '0');
      times.push(`${hourStr}:${minStr}`);
    }
  }
  return times;
}
