export const MCP_SCOPES = Object.freeze(["mcp:read", "mcp:write"]);

export function getMcpBaseUrl() {
  return (process.env.BETTER_AUTH_URL || "https://waitlyze.com").replace(/\/$/, "");
}

export function getMcpResourceUrl() {
  return new URL("/mcp", getMcpBaseUrl()).toString();
}
