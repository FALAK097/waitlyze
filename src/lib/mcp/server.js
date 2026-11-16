import { McpServer } from "@modelcontextprotocol/server";
import { instrument } from "@posthog/mcp";

import { getServerPostHog } from "@/lib/posthog/server.mjs";

import { registerWaitlyzeTools } from "./tools.js";

/**
 * Creates and instruments an McpServer instance for a request.
 */
export function createWaitlyzeMcpServer(authContext) {
  const server = new McpServer(
    {
      name: "waitlyze-mcp",
      version: "0.10.0",
    },
    {
      capabilities: {
        tools: { listChanged: true },
        logging: {},
      },
    },
  );

  // Instrument server with PostHog MCP Analytics
  try {
    const posthogClient = getServerPostHog();
    instrument(server, posthogClient, {
      serverBuild: "waitlyze-mcp@0.10.0",
    });
  } catch (error) {
    console.warn("Failed to instrument MCP server with PostHog:", error?.message || error);
  }

  // Register all platform tools
  registerWaitlyzeTools(server, authContext);

  return server;
}
