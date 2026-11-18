# ChatGPT plugin submission

The public submission package lives in `openai-plugin/`. It contains the portable Agent Plugins
manifest, remote MCP configuration, review cases, and the current lime-green Waitlyze assets.

## Production setup

1. Set `OPENAI_REVIEW_EMAIL_PASSWORD_AUTH=true` in the production server environment.
2. Create a dedicated reviewer account and sample workspace with:

   ```sh
   read -r -s OPENAI_REVIEW_ACCOUNT_PASSWORD
   export OPENAI_REVIEW_ACCOUNT_PASSWORD
   OPENAI_REVIEW_SEED_CONFIRM=seed-review-account \
   OPENAI_REVIEW_ACCOUNT_EMAIL='reviewer@example.com' \
   pnpm openai:seed-review
   unset OPENAI_REVIEW_ACCOUNT_PASSWORD
   ```

   Run this where the production `DATABASE_URL` is already available. Never commit or paste the
   password into the plugin package.

3. After OpenAI provides the domain verification value, set it as
   `OPENAI_APPS_CHALLENGE_TOKEN`. Confirm that
   `https://waitlyze.com/.well-known/openai-apps-challenge` returns only that plaintext value.

## Build the upload

From the repository root:

```sh
cd openai-plugin
zip -r ../waitlyze-openai-plugin-1.0.0.zip plugin.json mcp.json assets
```

Upload that ZIP in the OpenAI plugin submission portal using **With MCP**. Use
`https://waitlyze.com/mcp` as the remote endpoint. The endpoint advertises its OAuth discovery and
Dynamic Client Registration metadata, so no client secret belongs in the package.

## Review details

Enter reviewer access through the portal's secure Review details form:

- Login URL: `https://waitlyze.com/connect/login?review=1`
- The dedicated reviewer email and password created above
- Workspace: `OpenAI Review Workspace`
- Campaign: `OpenAI Review Campaign`
- Sign-in instructions: choose **Sign in as reviewer** to open the seeded workspace. When ChatGPT
  connects the plugin, approve the requested OAuth scopes on the separate consent screen.

The ZIP imports five positive and three negative review cases. Run all eight in a new ChatGPT chat
using the reviewer account. Record a reviewer-accessible video that demonstrates connection,
consent, the five positive cases, and safe handling of the negative cases; add its URL in Review
details.

After approval, select **Publish** in the portal. Keep the reviewer account and sample data active
for future version reviews. Set `NEXT_PUBLIC_CHATGPT_PLUGIN_URL` to the public listing URL once the
directory supplies it.
