export const docsPages = [
  { slug: "", title: "Get started", description: "Publish a waitlist and connect your launch." },
  { slug: "api", title: "Signup API", description: "Accept signups from your server with a scoped API key." },
  { slug: "embed", title: "Hosted pages & embeds", description: "Publish on Waitlyze or embed a waitlist on your website." },
  { slug: "webhooks", title: "Webhooks", description: "Receive signed events when someone joins or verifies." },
  { slug: "resend", title: "Resend", description: "Send waitlist email from your own verified domain." },
];
export const docsTree = { name: "Developer docs", children: docsPages.map((page) => ({ type: "page", name: page.title, url: page.slug ? `/docs/${page.slug}` : "/docs" })) };

export const signupExample = `const response = await fetch("https://waitlyze.falakgala.dev/api/waitlist", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    apiKey: process.env.WAITLYZE_API_KEY,
    waitlistId: "YOUR_WAITLIST_ID",
    email: "person@example.com",
    // referralCode: "OPTIONAL_REFERRAL_CODE"
  })
});
const result = await response.json();
if (!response.ok) throw new Error(result.error || "Signup failed");`;

export const embedExample = `<div class="waitlyze-widget"
  data-key-id="YOUR_WAITLIST_ID" data-height="720px"></div>
<script src="https://waitlyze.falakgala.dev/js/embed.js" defer></script>`;

export const webhookExample = `import { createHmac, timingSafeEqual } from "node:crypto";

function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ":" + canonicalJson(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}

export function verifyEvent(header, payload, secret, now = Date.now()) {
  if (typeof header !== "string") return false;
  const parts = header.split(",");
  const timestamp = parts.find(part => part.startsWith("t="))?.slice(2);
  if (!/^\\d+$/.test(timestamp || "")) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + canonicalJson(payload)).digest();
  return parts.filter(part => part.startsWith("v1="))
    .some(part => {
      const signature = part.slice(3);
      if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
      return timingSafeEqual(expected, Buffer.from(signature, "hex"));
    });
}`;
