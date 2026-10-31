// Explicit locale and timezone keep server-rendered dates stable during hydration.
export function formatProductDate(value, { includeTime = true } = {}) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "-";
  const options = { dateStyle: "medium", timeZone: "UTC" };
  if (includeTime) options.timeStyle = "short";
  const text = new Intl.DateTimeFormat("en-GB", options).format(date);
  return includeTime ? `${text} UTC` : text;
}
