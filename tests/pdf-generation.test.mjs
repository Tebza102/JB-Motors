import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { PDFDocument } from "pdf-lib";

test("generates every visible JB Motors PDF as a valid document", async () => {
    const { generatePdfBytes } = await import(`${pathToFileURL(resolve("app/features/documents/pdf.ts")).href}?test=${Date.now()}`);
    const logo = new Uint8Array(await readFile(resolve("public/brand/jb-motors-logo.png")));
    const expectations = [
      ["estimate", 8_000],
      ["invoice", 8_000],
      ["service-history", 7_000],
      ["monthly-report", 8_000],
    ];

    for (const [kind, minimumBytes] of expectations) {
      const bytes = await generatePdfBytes(kind, logo);
      assert.equal(Buffer.from(bytes.subarray(0, 4)).toString("ascii"), "%PDF", `${kind} must start with a PDF signature`);
      assert.ok(bytes.length > minimumBytes, `${kind} PDF should contain branded document content`);
      const reopened = await PDFDocument.load(bytes);
      assert.ok(reopened.getPageCount() >= 1, `${kind} PDF should reopen with at least one page`);
    }
});
