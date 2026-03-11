import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrisma> | undefined;
};

function createPrisma() {
  const options = {
    log: process.env.NODE_ENV !== "production" ? ["query", "error", "warn"] : ["error"],
    ...(process.env.DATABASE_URL?.startsWith("prisma+")
      ? { accelerateUrl: process.env.DATABASE_URL }
      : {}),
  };
  return new PrismaClient(options as unknown as ConstructorParameters<typeof PrismaClient>[0]).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
