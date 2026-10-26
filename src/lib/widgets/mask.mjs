// Shared email masking for every public widget/leaderboard surface.
// Single source of truth: masked emails only (`b***@g***`) may leave the
// server on unauthenticated endpoints. Raw addresses never do.

export function maskEmail(email) {
  if (typeof email !== "string" || !email) return "***@***";
  const at = email.indexOf("@");
  const local = at > 0 ? email.slice(0, at) : email;
  const domain = at > 0 ? email.slice(at + 1) : "";
  const head = (value) => (value.length > 0 ? value[0] : "*");
  if (!domain) return `${head(local)}***@***`;
  const domainHead = domain.split(".")[0] || "*";
  return `${head(local)}***@${head(domainHead)}***`;
}

// Minimal HTML escaper for widget HTML responses (masked values are safe
// already, but defense in depth costs one function).
export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}
