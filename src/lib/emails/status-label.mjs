// One founder-facing label map for automation runs and broadcasts. `DRAFT`
// and `SENT` read differently per surface ("Draft"/"Complete" on the
// broadcast rail, "Off"/"Sent" for recipes and the run log), so callers pass
// their wording; every other status shares one definition. Unknown codes
// pass through for forward compatibility.
const EMAIL_STATUS_LABELS = Object.freeze({
  ENABLED: "Enabled",
  PAUSED: "Paused",
  PENDING: "Scheduled",
  PROCESSING: "Sending",
  SCHEDULED: "Scheduled",
  SENDING: "Sending",
  SENT: "Sent",
  SKIPPED: "Skipped",
  FAILED: "Needs attention",
  CANCELED: "Canceled",
});

export function emailStatusLabel(status, { draft = "Off", sent = "Sent" } = {}) {
  if (status === "DRAFT") return draft;
  if (status === "SENT") return sent;
  return EMAIL_STATUS_LABELS[status] || status;
}
