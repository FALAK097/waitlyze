import { PrismaD1 } from "@prisma/adapter-d1";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  const d1 = cfContext?.env?.DB;

  if (d1) {
    const adapter = new PrismaD1(d1);
    return new PrismaClient({ adapter });
  }

  // Local development / Node.js test environment fallback
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      // Dynamic import/require to prevent bundling native addons into Cloudflare Workers
      const nodeModule = process.getBuiltinModule?.("node:module");
      const req =
        typeof require !== "undefined" ? require : nodeModule?.createRequire?.(import.meta.url);
      if (req) {
        const { PrismaBetterSqlite3 } = req("@prisma/adapter-better-sqlite3");
        let url = process.env.DATABASE_URL || "file:./prisma/dev.db";
        if (!url.startsWith("file:")) {
          url = "file:./prisma/dev.db";
        }
        const filePath = url.replace(/^file:/, "");
        if (filePath && filePath !== ":memory:") {
          const fs =
            process.getBuiltinModule?.("node:fs") ||
            (typeof require !== "undefined" ? require("fs") : null);
          const path =
            process.getBuiltinModule?.("node:path") ||
            (typeof require !== "undefined" ? require("path") : null);
          if (fs && path) {
            const dir = path.dirname(
              path.resolve(/*turbopackIgnore: true*/ process.cwd(), filePath),
            );
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          }
        }
        const adapter = new PrismaBetterSqlite3({ url });
        return new PrismaClient({ adapter });
      }
    } catch (err) {
      console.error("Failed to initialize Prisma SQLite adapter:", err);
      throw err;
    }
  }

  throw new Error("Missing Cloudflare D1 database binding (env.DB).");
}

export function getPrisma() {
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  if (cfContext) {
    if (!cfContext.__prisma) {
      cfContext.__prisma = createPrismaClient();
    }
    return cfContext.__prisma;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy(
  {},
  {
    get(target, prop, _receiver) {
      const client = getPrisma();
      const value = Reflect.get(client, prop, client);
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  },
);

export default prisma;
