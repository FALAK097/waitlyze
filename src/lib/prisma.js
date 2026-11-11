import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "@/generated/prisma/client";

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return "";
  // Ensure Neon connections route through PgBouncer (-pooler) for serverless multiplexing
  if (url.includes(".neon.tech") && !url.includes("-pooler")) {
    return url.replace(/@([^/:]+)/, (match, host) => {
      return `@${host.includes("-pooler") ? host : host.replace(/^([^.]+)/, "$1-pooler")}`;
    });
  }
  return url;
}

function createPrismaClient() {
  const connectionString = getDatabaseUrl();
  const adapter = new PrismaNeon({
    connectionString,
    max: 1, // Edge isolates are short-lived; avoid connection hoarding and socket leaks
    connectionTimeoutMillis: 10000,
  });
  return new PrismaClient({ adapter });
}

export function getPrisma() {
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
