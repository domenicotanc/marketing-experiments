import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client instance.
 * In development, we store the client on `globalThis` to survive hot reloads
 * without exhausting database connections.
 */

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
