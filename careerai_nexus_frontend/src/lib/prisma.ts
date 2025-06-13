import { PrismaClient } from "@prisma/client";

/**
 * PUBLIC_INTERFACE
 * Prisma singleton for Next.js with hot-reload safe import
 * Use this everywhere to avoid multiple instances of PrismaClient in dev
 */
declare global {
  // allow global `var` declarations (for Next.js)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
