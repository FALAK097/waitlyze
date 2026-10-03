import test from "node:test";
import assert from "node:assert/strict";
import { AccessError, createWorkspaceService } from "../../src/lib/workspaces/service.mjs";

test("workspace rename is trimmed, bounded, and scoped to owner/admin membership", async () => {
  const calls = [];
  const service = createWorkspaceService({
    workspace: {
      updateMany: async (args) => {
        calls.push(args);
        return { count: 1 };
      },
    },
  });

  assert.deepEqual(await service.renameWorkspace("user-1", "workspace-1", "  Launch team  "), {
    id: "workspace-1",
    name: "Launch team",
  });
  assert.deepEqual(calls[0], {
    where: {
      id: "workspace-1",
      members: { some: { userId: "user-1", role: { in: ["OWNER", "ADMIN"] } } },
    },
    data: { name: "Launch team" },
  });
  await assert.rejects(service.renameWorkspace("user-1", "workspace-1", "  "), /1 to 80 characters/);
  await assert.rejects(service.renameWorkspace("user-1", "workspace-1", "x".repeat(81)), /1 to 80 characters/);
  assert.equal(calls.length, 1);
});

test("workspace rename fails closed when the scoped update finds no workspace", async () => {
  const service = createWorkspaceService({ workspace: { updateMany: async () => ({ count: 0 }) } });
  await assert.rejects(service.renameWorkspace("member", "workspace-1", "Attempt"), AccessError);
  await assert.rejects(service.renameWorkspace("", "workspace-1", "Attempt"), AccessError);
});

test("personal workspace initialization retries structured PostgreSQL adapter conflicts", async () => {
  let attempts = 0;
  const tx = {
    user: { findUnique: async () => ({ id: "owner" }) },
    workspace: { upsert: async () => ({ id: "personal", name: "Personal workspace" }) },
    workspaceMember: { findUnique: async () => ({ role: "OWNER" }) },
    waitList: { updateMany: async () => ({ count: 0 }) },
  };
  const service = createWorkspaceService({
    $transaction: async (callback) => {
      attempts += 1;
      if (attempts === 1) {
        const error = new Error("TransactionWriteConflict");
        error.name = "DriverAdapterError";
        error.cause = { kind: "TransactionWriteConflict", originalCode: "40001" };
        throw error;
      }
      return callback(tx);
    },
  });

  assert.deepEqual(await service.ensurePersonal("owner"), { id: "personal", name: "Personal workspace" });
  assert.equal(attempts, 2);
});
