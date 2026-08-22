const FALLBACK_TIME_ZONE = "UTC";

export function getConfiguredTimeZone(): string {
  if (typeof document !== "undefined") {
    return document.documentElement.dataset.timezone || FALLBACK_TIME_ZONE;
  }

  return FALLBACK_TIME_ZONE;
}

export function formatDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
    timeZone: getConfiguredTimeZone(),
  }).format(new Date(value));
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...options,
    timeZone: getConfiguredTimeZone(),
  }).format(new Date(value));
}

export function formatTime(value: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
    ...options,
    timeZone: getConfiguredTimeZone(),
  }).format(new Date(value));
}
