import { env } from "@/lib/env";

export function getHospitalTimezone(): string {
  return env.HOSPITAL_TIMEZONE || "America/New_York";
}

/**
 * Converts a local wall-clock date and time in the hospital timezone to an exact UTC Date.
 */
export function localToUtc(
  year: number,
  month: number, // 1 - 12
  day: number,
  hour: number,
  minute: number,
  timeZone = getHospitalTimezone()
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(guess);

  const m: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      m[p.type] = parseInt(p.value, 10);
    }
  }

  const localGuess = Date.UTC(
    m.year,
    m.month - 1,
    m.day,
    m.hour === 24 ? 0 : m.hour,
    m.minute,
    m.second
  );
  const diff = guess.getTime() - localGuess;
  return new Date(guess.getTime() + diff);
}

/**
 * Extracts hospital timezone components from a UTC Date.
 */
export function getLocalParts(
  utcDate: Date,
  timeZone = getHospitalTimezone()
): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hour: number;
  minute: number;
  timeString: string; // "HH:mm"
  dateString: string; // "YYYY-MM-DD"
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "narrow", // S, M, T, W, T, F, S - but weekday short is better
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = dtf.formatToParts(utcDate);
  const pMap: Record<string, string> = {};
  for (const p of parts) {
    pMap[p.type] = p.value;
  }

  const year = parseInt(pMap.year, 10);
  const month = parseInt(pMap.month, 10);
  const day = parseInt(pMap.day, 10);
  const hour = parseInt(pMap.hour, 10) % 24;
  const minute = parseInt(pMap.minute, 10);

  // Determine day of week using local noon of that day
  const localMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = localMidday.getUTCDay();

  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const yyyy = String(year);
  const mo = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return {
    year,
    month,
    day,
    dayOfWeek,
    hour,
    minute,
    timeString: `${hh}:${mm}`,
    dateString: `${yyyy}-${mo}-${dd}`,
  };
}

/**
 * Parse "HH:mm" into { hours, minutes }
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hStr, mStr] = timeStr.split(":");
  return {
    hours: parseInt(hStr, 10),
    minutes: parseInt(mStr, 10),
  };
}
