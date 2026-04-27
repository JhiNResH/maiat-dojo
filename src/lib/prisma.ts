import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function databaseUrlWithPrismaPool(url = process.env.DATABASE_URL) {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const isPostgres =
      parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";

    if (!isPostgres) return url;

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "10");
    }
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "10");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrlWithPrismaPool(),
      },
    },
  });

globalForPrisma.prisma = prisma;
