import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = global;

let prisma;

if (!globalForPrisma.prisma) {
  // Workers can suspend isolates between requests. Rotate connections instead
  // of reusing a socket across unrelated invocations.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    maxUses: 1,
  });
  prisma = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} else {
  prisma = globalForPrisma.prisma;
}

export default prisma;
