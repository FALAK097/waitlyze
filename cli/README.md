# waitlyze

Command-line interface for [Waitlyze](https://waitlyze.com) — create waitlist
signups, look up subscriber status, award custom event points, and call the
Waitlyze REST API v1 from scripts and AI agents. Zero dependencies; requires
Node 18+.

## Install

```sh
npm install -g waitlyze
```

Or run it directly:

```sh
npx waitlyze@latest --help
```

## Authentication

Create a scoped API key in your workspace at
[waitlyze.com/api-keys](https://waitlyze.com/api-keys) (free workspace, no
credit card needed). Keys look like `wl2_<keyId>_<secret>` and are scoped —
`waitlist:read`, `waitlist:write`, `workspace:read`, and more.

Pass the key per command with `--api-key`, or export it once:

```sh
export WAITLYZE_API_KEY=wl2_...
```

## Commands

```sh
# Create a signup (idempotent replay on retry)
waitlyze signup dev@example.com --waitlist <waitlistId> --ref FRIEND_CODE

# Live position, points, referrals, and verification for an email
waitlyze status dev@example.com --waitlist <waitlistId>

# Award custom event points to a verified subscriber
waitlyze points dev@example.com --event webinar-attendee --waitlist <waitlistId>

# List accessible workspaces
waitlyze workspaces

# Call any REST API v1 endpoint
waitlyze request GET /api/v1/waitlists
waitlyze request POST /api/v1/waitlists --data '{"name":"Beta launch"}'
```

## Testing against a different instance

Point the CLI at a self-hosted Waitlyze instance (the project is open source —
run it with the provided `compose.yaml`):

```sh
waitlyze --base-url http://localhost:3000 status dev@example.com --waitlist <id>
```

## Links

- [API reference](https://waitlyze.com/docs/api/reference)
- [OpenAPI specification](https://waitlyze.com/openapi.json)
- [Agent instructions](https://waitlyze.com/agent-instructions.md)
- [MCP server](https://waitlyze.com/docs/mcp)

## License

MIT
