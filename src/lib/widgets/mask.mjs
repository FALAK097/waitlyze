/**
 * Privacy masking for public surfaces (leaderboard, share views).
 * Never exposes raw emails: every address is masked server-side
 * (e.g. `b***@g***`) and only counts/positions leave the endpoint.
 */
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
