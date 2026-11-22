---
name: waitlyze
description: Connect an AI coding agent to Waitlyze to manage waitlists, referrals, subscribers, and launch analytics through its MCP server.
---

# Waitlyze MCP

Use the Waitlyze MCP server when the user asks to inspect or manage a Waitlyze workspace or waitlist.

## Connect

Add this remote MCP server to the coding agent's configuration:

```json
{
  "mcpServers": {
    "waitlyze": {
      "type": "streamable-http",
      "url": "https://waitlyze.com/mcp"
    }
  }
}
```

The server supports OAuth sign-in and Waitlyze API keys. Follow the MCP client's sign-in flow; never ask the user to paste a token into chat. Unauthenticated clients can inspect server capabilities, but tool execution requires authentication and the appropriate account permissions.

## Use safely

- List available tools and read their input schemas before calling them.
- Confirm the target workspace and waitlist when more than one is available.
- Treat subscriber data as private. Return only the fields needed for the user's request.
- Confirm before sending broadcasts, changing a published waitlist, or performing bulk subscriber changes.
- Use analytics and referral tools for reporting; do not invent results or claim that a reward was delivered unless the server confirms it.

See [MCP connection and tool documentation](https://waitlyze.com/docs/mcp) for the current capabilities and setup details.
