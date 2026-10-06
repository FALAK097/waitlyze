export function workspaceTestTarget(value) {
  if (!value) throw new Error("Set WORKSPACE_TEST_DATABASE_URL to the disposable local fixture database.");
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !["127.0.0.1", "localhost"].includes(url.hostname) || url.pathname !== "/waitlyze_workspace_test" || url.search || url.hash) {
    throw new Error("Workspace tests require the named loopback database without connection overrides.");
  }
  return value;
}
