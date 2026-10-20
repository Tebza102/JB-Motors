import assert from "node:assert/strict";
import test from "node:test";

import { buildTelUrl, buildWhatsAppUrl, normaliseSaPhone } from "../app/features/workshop-prototype/contact.ts";

test("South African phone numbers are normalised for device handlers", () => {
  assert.equal(normaliseSaPhone("082 555 0148"), "27825550148");
  assert.equal(normaliseSaPhone("+27 82 555 0148"), "27825550148");
  assert.equal(buildTelUrl("082 555 0148"), "tel:+27825550148");
});

test("WhatsApp opens an encoded contextual draft", () => {
  const url = buildWhatsAppUrl({
    id: "followup-1", customerId: "customer-thabo", customerName: "Thabo Mokoena",
    vehicle: "2020 Toyota Corolla", phone: "082 555 0148", reason: "Service due",
    due: "Today", last: "Last service 11 months ago", priority: "High", tone: "orange", status: "active",
  });
  assert.match(url, /^https:\/\/wa\.me\/27825550148\?text=/);
  assert.match(decodeURIComponent(url), /Thabo Mokoena/);
  assert.match(decodeURIComponent(url), /service due/);
  assert.match(decodeURIComponent(url), /2020 Toyota Corolla/);
});
