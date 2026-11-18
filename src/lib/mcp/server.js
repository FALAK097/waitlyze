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
      captureModel: false,
      context: false,
      enableConversationId: false,
      enableExceptionAutocapture: false,
      beforeSend: (event) => {
        if (!event) return event;
        const sensitiveProperties = [
          "$mcp_client_user_agent",
          "$mcp_conversation_id",
          "$mcp_error_message",
          "$mcp_intent",
          "$mcp_parameters",
          "$mcp_response",
        ];

        for (const property of sensitiveProperties) {
          delete event.properties?.[property];
        }

        const sanitizeValue = (val) => {
          if (typeof val === "string") {
            return val
              .replace(/wl2_[a-f0-9]{32}_[A-Za-z0-9_-]{43}/gi, "wl2_[REDACTED]")
              .replace(/whsec_[A-Za-z0-9_-]+/gi, "whsec_[REDACTED]")
              .replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, "Bearer [REDACTED]");
          }
          if (Array.isArray(val)) {
            return val.map(sanitizeValue);
          }
          if (val && typeof val === "object") {
            const sanitized = {};
            for (const key of Object.keys(val)) {
              sanitized[key] = sanitizeValue(val[key]);
            }
            return sanitized;
          }
          return val;
        };

        if (event.properties && typeof event.properties === "object") {
          for (const key of Object.keys(event.properties)) {
            event.properties[key] = sanitizeValue(event.properties[key]);
          }
        }
        delete event.error;
        return event;
      },
    });
  } catch (error) {
    console.warn("Failed to instrument MCP server with PostHog:", error?.message || error);
  }

  // Register all platform tools
  registerWaitlyzeTools(server, authContext);

  return server;
}
