export const MCP_SCOPES = Object.freeze(["mcp:read", "mcp:write"]);

export function getMcpResourceUrl() {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  return new URL("/mcp", baseUrl).toString();
}
