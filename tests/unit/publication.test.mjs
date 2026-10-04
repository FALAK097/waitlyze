import test from "node:test";
import assert from "node:assert/strict";
import { PublicationConflict, rollbackCampaign } from "../../src/lib/campaigns/publication.mjs";

test("rollback detects a concurrent pause instead of reopening signups", async () => {
  const snapshot = { sections: [] };
  const database = {
    $transaction: (run) => run({
      waitList: {
        findFirst: async () => ({ id: "waitlist", status: "PUBLISHED", publishedRevision: 2, templateRevision: 1, templateSnapshot: snapshot }),
        updateMany: async ({ where }) => {
          assert.equal(where.status, "PUBLISHED");
          return { count: 0 };
        },
      },
      waitListPublicationRevision: {
        findFirst: async () => ({ revision: 1, templateRevision: 1, snapshot }),
      },
    }),
  };
  await assert.rejects(rollbackCampaign(database, "actor", undefined, "waitlist"), PublicationConflict);
});
