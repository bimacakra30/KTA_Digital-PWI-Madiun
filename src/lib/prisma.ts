import { PrismaClient } from "@prisma/client";

// Auto-compose DATABASE_URL dari env terpisah jika tersedia
if (process.env.DB_HOST && !process.env.DATABASE_URL_OVERRIDE) {
  const user = encodeURIComponent(process.env.DB_USERNAME || "root");
  const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "3306";
  const db = process.env.DB_DATABASE || "kta";
  process.env.DATABASE_URL = `mysql://${user}:${pass}@${host}:${port}/${db}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
