import type { FollowUpRecord } from "./types";

export function normaliseSaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.startsWith("27")) return digits;
  return `27${digits}`;
}

/** South African mobile numbers: 0 or +27, then a 6/7/8 prefix and eight more digits. Spaces and dashes are ignored. */
export function isValidSaMobile(value: string) {
  return /^(?:\+27|0)[6-8]\d{8}$/.test(value.trim().replace(/[\s-]/g, ""));
}

export function buildTelUrl(phone: string) {
  return `tel:+${normaliseSaPhone(phone)}`;
}

export function buildWhatsAppUrl(item: FollowUpRecord) {
  const message = `Hello ${item.customerName}, this is JB Motors following up regarding ${item.reason.toLowerCase()} for ${item.vehicle}. Please let us know when it is convenient to assist you.`;
  return `https://wa.me/${normaliseSaPhone(item.phone)}?text=${encodeURIComponent(message)}`;
}
