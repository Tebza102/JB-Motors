/** Comma-grouped whole numbers, matching the "143,240 km" / "R6,106.50" style used across the prototype. */
export function formatNumber(value:number):string {
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export const formatKilometres = (kilometres:number) => `${formatNumber(kilometres)} km`;

/** Money is held as integer cents. */
export function formatRand(cents:number):string {
  const sign = cents < 0 ? "−" : "";
  const absolute = Math.abs(Math.round(cents));
  return `${sign}R${formatNumber(Math.floor(absolute / 100))}.${String(absolute % 100).padStart(2, "0")}`;
}

export const formatDate = (iso:string) => new Date(iso).toLocaleDateString("en-ZA", { dateStyle:"medium" });
export const formatDateTime = (iso:string) => new Date(iso).toLocaleString("en-ZA", { dateStyle:"medium", timeStyle:"short" });
/** Calendar days (YYYY-MM-DD) are formatted at local noon so time zones cannot shift the day. */
export const formatCalendarDay = (day:string) => new Date(`${day}T12:00:00`).toLocaleDateString("en-ZA", { dateStyle:"medium" });
export function toCalendarDay(date:Date):string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
