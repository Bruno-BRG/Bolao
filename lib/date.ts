export const APP_TIMEZONE = "America/Bahia";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: APP_TIMEZONE
  }).format(new Date(value));
}

export function formatCompactDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);

  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: APP_TIMEZONE
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE
  }).format(date);

  return `${day}, ${time}`;
}

export function formatDayHeading(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: APP_TIMEZONE
  }).format(date);
}

export function appLocalDayKey(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  const parts = dayKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function isSameAppDay(left: string | number | Date, right: string | number | Date) {
  return appLocalDayKey(left) === appLocalDayKey(right);
}
