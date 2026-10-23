import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/wellspring?schema=public";

const pool =
  globalThis.__prismaPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.__prismaClient ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}

export { pool };
export default prisma;
