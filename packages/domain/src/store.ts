import { DEFAULT_TIME_ZONE, minutesOf, zonedParts } from "./time";

export type StoreStatus = "OPEN" | "CLOSED";

export interface Schedule {
  /** 0 = Sunday ... 6 = Saturday */
  weekDay: number;
  /** "HH:mm" in the store time zone */
  opensAt: string;
  /** "HH:mm"; may be earlier than opensAt for schedules crossing midnight (e.g. 18:00-02:00). */
  closesAt: string;
}

export const WEEKDAY_NAMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"] as const;
const WEEKDAY_ABBREVIATIONS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/** Legacy `establishmentStatus` filter. */
export function storeStatusLabel(status: StoreStatus | null | undefined): string {
  return status === "OPEN" ? "Aberto" : "Fechado";
}

/**
 * Legacy `establishmentSchedule` filter.
 * OPEN  -> "18:00 até 23:30"
 * CLOSED-> "Abrirá hoje, às 18:00" | "Abrirá amanhã, às 18:00" | "Abrirá sexta-feira, às 18:00"
 * The open/closed STATUS itself is computed by the backend; this only builds the label.
 */
export function scheduleLabel(
  status: StoreStatus,
  currentSchedule: Schedule | null | undefined,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  if (!currentSchedule) return "";
  if (status === "OPEN") return `${currentSchedule.opensAt} até ${currentSchedule.closesAt}`;

  const today = zonedParts(now, timeZone);
  let dayName: string = WEEKDAY_NAMES[currentSchedule.weekDay] ?? "";
  if (currentSchedule.weekDay === today.weekDay) {
    if (today.hour * 60 + today.minute < minutesOf(currentSchedule.opensAt)) dayName = "hoje";
  } else {
    const daysUntil = (currentSchedule.weekDay - today.weekDay + 7) % 7;
    if (daysUntil === 1) dayName = "amanhã";
  }
  return `Abrirá ${dayName}, às ${currentSchedule.opensAt}`;
}

/** schema.org openingHours entry, legacy formatScheduleInInternationalFormat: "Fr 18:00-23:30". */
export function openingHoursSpec(schedules: Schedule[]): string {
  return [...schedules]
    .sort((a, b) => a.weekDay - b.weekDay)
    .map((s) => `${WEEKDAY_ABBREVIATIONS[s.weekDay]} ${s.opensAt}-${s.closesAt}`)
    .join(", ");
}

/** Legacy `establishmentDeliveryTime` filter. */
export function deliveryTimeLabel(min: number | null | undefined, max: number | null | undefined): string {
  if (min && !max) return `${min}min.`;
  if (!min && max) return `${max}min.`;
  if (!min && !max) return "0min.";
  if (min === max) return `${min}min.`;
  return `${min} à ${max}min.`;
}

/**
 * Computes OPEN/CLOSED and the schedule to display (the legacy Java backend did this; inferred top-down
 * from how the UI consumes `status` + `currentSchedule`):
 * - OPEN   -> the schedule currently running (including one that started yesterday and crosses midnight)
 * - CLOSED -> the next schedule to open (later today, or the following days)
 */
export function computeOpenState(
  schedules: Schedule[],
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): { status: StoreStatus; currentSchedule: Schedule | null } {
  if (schedules.length === 0) return { status: "CLOSED", currentSchedule: null };
  const t = zonedParts(now, timeZone);
  const nowMinutes = t.hour * 60 + t.minute;
  const crossesMidnight = (s: Schedule) => minutesOf(s.closesAt) <= minutesOf(s.opensAt);

  for (const s of schedules) {
    const opens = minutesOf(s.opensAt);
    const closes = minutesOf(s.closesAt);
    const yesterday = (t.weekDay + 6) % 7;
    if (s.weekDay === t.weekDay) {
      if (crossesMidnight(s) ? nowMinutes >= opens : nowMinutes >= opens && nowMinutes < closes) {
        return { status: "OPEN", currentSchedule: s };
      }
    } else if (s.weekDay === yesterday && crossesMidnight(s) && nowMinutes < closes) {
      return { status: "OPEN", currentSchedule: s };
    }
  }

  let next: { schedule: Schedule; distance: number } | null = null;
  for (const s of schedules) {
    let days = (s.weekDay - t.weekDay + 7) % 7;
    if (days === 0 && minutesOf(s.opensAt) <= nowMinutes) days = 7;
    const distance = days * 24 * 60 + minutesOf(s.opensAt) - nowMinutes;
    if (!next || distance < next.distance) next = { schedule: s, distance };
  }
  return { status: "CLOSED", currentSchedule: next?.schedule ?? null };
}
