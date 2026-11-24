import { McpServer } from "@modelcontextprotocol/server";
import { instrument } from "@posthog/mcp";

import { getServerPostHog } from "@/lib/posthog/server.mjs";

import { registerWaitlyzePrompts } from "./prompts.js";
import { registerWaitlyzeResources } from "./resources.js";
import { registerWaitlyzeTools } from "./tools.js";

/**
 * Creates and instruments an McpServer instance for a request.
 */
export function createWaitlyzeMcpServer(authContext) {
  const server = new McpServer(
    {
      name: "waitlyze-mcp",
      version: "0.13.0",
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
        logging: {},
      },
    },
  );

  const ph = getServerPostHog();
  if (ph) {
    instrument(server, {
      posthog: ph,
      distinctId: () => authContext?.userId || "anonymous",
      groups: () => (authContext?.workspaceId ? { workspace: authContext.workspaceId } : {}),
      beforeSend: (event) => {
        if (event?.properties && "$mcp_args" in event.properties) {
          const { apiKey, webhookUrl, webhookSecret, apiToken, rows, ...safeArgs } =
            event.properties.$mcp_args || {};
          event.properties.$mcp_args = {
            ...safeArgs,
            ...(apiKey !== undefined ? { apiKey: "[REDACTED]" } : {}),
            ...(apiToken !== undefined ? { apiToken: "[REDACTED]" } : {}),
            ...(webhookUrl !== undefined ? { webhookUrl: "[REDACTED]" } : {}),
            ...(webhookSecret !== undefined ? { webhookSecret: "[REDACTED]" } : {}),
            ...(rows !== undefined
              ? { rows: `[${Array.isArray(rows) ? rows.length : 0} rows]` }
              : {}),
          };
        }
        return event;
      },
    });
  }

  registerWaitlyzeTools(server, authContext);
  registerWaitlyzeResources(server, authContext);
  registerWaitlyzePrompts(server);
  return server;
}
