import assert from "node:assert/strict";
import test from "node:test";
import { jsPDF } from "jspdf";
import geoip from "geoip-lite";

test("jsPDF named export generates a readable PDF", () => {
	const document = new jsPDF();
	document.text("Waitlyze export", 14, 20);
	const output = Buffer.from(document.output("arraybuffer"));

	assert.equal(output.subarray(0, 5).toString("ascii"), "%PDF-");
});

test("geoip-lite resolves a literal IPv4 address", () => {
	const result = geoip.lookup("8.8.8.8");

	assert.equal(typeof result?.country, "string");
});
