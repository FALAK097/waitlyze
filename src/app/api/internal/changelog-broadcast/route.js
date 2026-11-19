import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { renderChangelogEmailHtml } from "@/emails/changelog-email.mjs";
import { changelogReleaseText } from "@/emails/text.mjs";
import { parseChangelog } from "@/lib/changelog";
import { isUniqueConstraintError } from "@/lib/db/sqlite-helpers.mjs";
import { env } from "@/lib/env.mjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function authorized(request) {
  const secret = env.OUTBOX_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret || !/^Bearer\s+/i.test(request.headers.get("authorization") || "")) return false;
  const suppliedBytes = Buffer.from(supplied);
  const secretBytes = Buffer.from(secret);
  return suppliedBytes.length === secretBytes.length && timingSafeEqual(suppliedBytes, secretBytes);
}

export async function POST(request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const isDryRun = Boolean(body.dryRun);
  const testRecipient = body.testRecipient ? String(body.testRecipient).trim().toLowerCase() : null;
  const requestedVersion = body.version ? String(body.version).trim() : null;

  // 1. Resolve release metadata from CHANGELOG.md if not fully passed
  let version = requestedVersion;
  let subject = body.subject;
  let html = body.html;
  let text = body.text;

  if (!version || !subject || !html || !text) {
    let changelogRaw = "";
    try {
      changelogRaw = await readFile(path.join(process.cwd(), "CHANGELOG.md"), "utf8");
    } catch (err) {
      return NextResponse.json(
        { message: `Failed to read CHANGELOG.md: ${err.message}` },
        { status: 500 },
      );
    }

    const releases = parseChangelog(changelogRaw);
    if (!releases || releases.length === 0) {
      return NextResponse.json({ message: "No releases found in CHANGELOG.md" }, { status: 404 });
    }

    const release = requestedVersion
      ? releases.find((r) => r.version === requestedVersion)
      : releases[0];

    if (!release) {
      return NextResponse.json(
        {
          message: `Release ${requestedVersion || "latest"} not found in CHANGELOG.md. Available: ${releases.map((r) => r.version).join(", ")}`,
        },
        { status: 404 },
      );
    }

    version = release.version;
    const changelogUrl = `https://waitlyze.com/docs/changelog#${release.id}`;
    subject = subject || `Waitlyze ${version}: ${release.title}`;

    const emailProps = {
      version,
      date: release.date,
      title: release.title,
      summary: release.summary,
      features: release.features,
      fixes: release.fixes,
      changelogUrl,
    };

    html = html || (await renderChangelogEmailHtml(emailProps));
    text = text || changelogReleaseText(emailProps);
  }

  // 2. Resolve recipients from platform database
  let recipients = [];
  if (testRecipient) {
    recipients = [{ id: "test", email: testRecipient, name: "Tester" }];
  } else {
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: "",
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    recipients = users.filter((u) => typeof u.email === "string" && u.email.trim().length > 0);
  }

  if (recipients.length === 0) {
    return NextResponse.json({
      success: true,
      version,
      recipientCount: 0,
      enqueuedCount: 0,
      message: "No recipients found.",
    });
  }

  if (isDryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      version,
      subject,
      recipientCount: recipients.length,
      sampleRecipients: recipients.slice(0, 5).map((r) => r.email),
    });
  }

  // 3. Enqueue FOUNDER_NOTICE_REQUESTED outbox events
  const events = recipients.map((r) => {
    const email = r.email.trim().toLowerCase();
    return {
      eventKey: `founder-notice:changelog-release:${version}:${email}`,
      type: "FOUNDER_NOTICE_REQUESTED",
      payload: {
        kind: "changelog_release",
        to: email,
        subject,
        html,
        text,
        idempotencyKey: `changelog-release:${version}:${email}`,
      },
      status: "PENDING",
    };
  });

  let enqueuedCount = 0;
  for (const event of events) {
    try {
      await prisma.outboxEvent.create({ data: event });
      enqueuedCount++;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  return NextResponse.json({
    success: true,
    version,
    subject,
    recipientCount: recipients.length,
    enqueuedCount,
    skippedDuplicates: recipients.length - enqueuedCount,
    platformSender: "noreply@waitlyze.com (Cloudflare Platform Email)",
  });
}
