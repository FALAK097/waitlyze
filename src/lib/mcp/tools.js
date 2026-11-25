import { registerAudienceAndEmailMcpTools } from "./tools-audience-emails.mjs";
import { registerLaunchLabMcpTools } from "./tools-launch-lab.mjs";
import { registerWaitlistMcpTools } from "./tools-waitlists.mjs";
import { registerWorkspaceMcpTools } from "./tools-workspace.mjs";

/**
 * Registers all Waitlyze platform & Launch Lab tools onto the MCP server.
 */
export function registerWaitlyzeTools(server, authContext) {
  registerWorkspaceMcpTools(server, authContext);
  registerWaitlistMcpTools(server, authContext);
  registerAudienceAndEmailMcpTools(server, authContext);
  registerLaunchLabMcpTools(server);
}
