/**
 * Time helpers. All business time is evaluated in the STORE time zone (default America/Sao_Paulo),
 * never in the browser's zone (legacy used `new Date()` in the browser).
 */
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekDay: number; // 0 = Sunday (legacy weekDay.number)
  hour: number;
  minute: number;
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = new Map<string, Intl.DateTimeFormat>();

export function zonedParts(date: Date, timeZone: string = DEFAULT_TIME_ZONE): ZonedParts {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    formatters.set(timeZone, fmt);
  }
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekDay: WEEKDAY_INDEX[parts.weekday as string] ?? 0,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "HH:mm" in the given zone. */
export function formatTime(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "dd/MM HH:mm" in the given zone (admin lists). */
export function formatDayMonthTime(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.day)}/${pad(p.month)} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "dd/MM/yyyy HH:mm" (kitchen ticket). */
export function formatDateTime(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.day)}/${pad(p.month)}/${p.year} ${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Legacy `prettyTime`: "HH:mm", plus " do dia dd/MM" when not today.
 * Deviation: legacy compared only the day-of-month (15/03 vs 15/04 looked like "today"); now the full date.
 */
export function prettyTime(value: Date | string | null | undefined, now: Date = new Date(), timeZone: string = DEFAULT_TIME_ZONE): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  const d = zonedParts(date, timeZone);
  const t = zonedParts(now, timeZone);
  let result = `${pad(d.hour)}:${pad(d.minute)}`;
  if (d.year !== t.year || d.month !== t.month || d.day !== t.day) result += ` do dia ${pad(d.day)}/${pad(d.month)}`;
  return result;
}

/** "HH:mm" -> minutes since midnight. */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
