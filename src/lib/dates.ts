// Date and Time utility functions for SPRK
// Operational Timezone: Asia/Jakarta (WIB = UTC+7)
// Compliant with PRD v1.1 §8 (Business Rules)

export const TIMEZONE = "Asia/Jakarta";

// Returns current Date in WIB timezone
export function getNowWIB(): Date {
  const now = new Date();
  return now;
}

// Convert YYYY-MM-DD and HH:mm (WIB) into an ISO string in UTC for database timestamptz
export function wibToUTCISO(dateStr: string, timeStr: string): string {
  // WIB is UTC+7 with no daylight saving time: +07:00
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  // e.g. "2026-11-02T08:00:00+07:00"
  const isoWithOffset = `${cleanDate}T${cleanTime}:00+07:00`;
  const dateObj = new Date(isoWithOffset);
  if (isNaN(dateObj.getTime())) {
    throw new Error("Format tanggal atau waktu tidak valid");
  }
  return dateObj.toISOString();
}

// Extract YYYY-MM-DD in Asia/Jakarta timezone from Date or ISO string
export function getWIBDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Extract HH:mm in Asia/Jakarta timezone from Date or ISO string
export function getWIBTimeString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// Format date into human-readable Indonesian string: "Senin, 2 November 2026"
export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Format time interval: "08.00 - 10.00 WIB"
export function formatTimeIntervalWIB(startAt: string | Date, endAt: string | Date): string {
  const start = getWIBTimeString(startAt).replace(":", ".");
  const end = getWIBTimeString(endAt).replace(":", ".");
  return `${start} – ${end} WIB`;
}

// Format full datetime: "2 Nov 2026, 08.00 WIB"
export function formatDateTimeWIB(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateFormatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const timeFormatted = getWIBTimeString(d).replace(":", ".");
  return `${dateFormatted}, ${timeFormatted} WIB`;
}

// Generate selectable time options for form (07:00 to 21:00, 30 min intervals)
export function getOperationalTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    slots.push(`${hourStr}:00`);
    if (hour < 21) {
      slots.push(`${hourStr}:30`);
    }
  }
  return slots;
}

// Check if booking has started/passed
export function isPast(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() <= Date.now();
}

// Calculate minimum booking date (today in WIB) and maximum booking date (+30 days in WIB)
export function getBookingDateBounds(): { minDate: string; maxDate: string } {
  const todayWIBStr = getWIBDateString();
  const todayParts = todayWIBStr.split("-").map(Number);
  
  // Create Date object representing today in WIB
  const todayDate = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]));
  const maxDateObj = new Date(todayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const maxDateStr = maxDateObj.toISOString().split("T")[0];
  return {
    minDate: todayWIBStr,
    maxDate: maxDateStr,
  };
}
