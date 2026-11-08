import assert from "node:assert/strict";
import { test } from "node:test";

import { sendCloudflareEmail } from "./cloudflare-email-sender.mjs";

test("sends a transactional email through the supplied Cloudflare account", async () => {
  let request;
  const result = await sendCloudflareEmail(
    {
      accountId: "a".repeat(32),
      apiToken: "customer-token",
      fromEmail: "confirm@example.com",
      replyTo: "support@example.com",
      to: "subscriber@example.net",
      subject: "Confirm your signup",
      html: "<p>Confirm</p>",
      text: "Confirm",
    },
    {
      fetchFn: async (url, options) => {
        request = { url, options };
        return Response.json({ success: true, result: { message_id: "cf-message-1" } });
      },
    },
  );

  assert.equal(
    request.url,
    `https://api.cloudflare.com/client/v4/accounts/${"a".repeat(32)}/email/sending/send`,
  );
  assert.equal(request.options.headers.Authorization, "Bearer customer-token");
  assert.deepEqual(JSON.parse(request.options.body), {
    from: "confirm@example.com",
    to: "subscriber@example.net",
    subject: "Confirm your signup",
    html: "<p>Confirm</p>",
    text: "Confirm",
    reply_to: "support@example.com",
  });
  assert.deepEqual(result, {
    data: { id: "cf-message-1" },
    result: { message_id: "cf-message-1" },
  });
});

test("does not return Cloudflare response details in send errors", async () => {
  await assert.rejects(
    () =>
      sendCloudflareEmail(
        {
          accountId: "a".repeat(32),
          apiToken: "customer-token",
          fromEmail: "confirm@example.com",
          to: "subscriber@example.net",
          subject: "Confirm your signup",
          text: "Confirm",
        },
        {
          fetchFn: async () =>
            Response.json(
              { success: false, errors: [{ code: "E_SENDER_NOT_VERIFIED", message: "details" }] },
              { status: 403 },
            ),
        },
      ),
    (error) => {
      assert.equal(error.message, "Cloudflare could not send this transactional email.");
      assert.equal(error.code, "E_SENDER_NOT_VERIFIED");
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});
