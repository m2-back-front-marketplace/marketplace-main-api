import { PrismaClient } from "../generated/prisma/client";

/**
 * Prisma singleton + connection logging
 *
 * This module ensures only one PrismaClient instance is used (important for local dev
 * with hot-reloading and to avoid exhausting database connections).
 *
 * It also attempts an immediate connection and logs the result so you can verify DB connectivity
 * in the service logs.
 */

/* global cache to keep a single PrismaClient across module reloads in development */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __prisma: PrismaClient | undefined;
}

/* Create or reuse the Prisma client */
const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: ["info", "warn", "error"],
  });

/* Try to connect once and report status to logs */
(async function verifyConnection() {
  try {
    await prisma.$connect();
    // Useful log for Render / production to confirm DB connectivity
    console.log("Prisma: connected to database successfully");
  } catch (err) {
    // Log full error to help debugging connection issues (credentials, network, SSL, limits...)
    console.error("Prisma: failed to connect to database", err);
  }
})();

/* In non-production keep the client cached to avoid creating many connections during HMR/reloads */
if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

/* Graceful shutdown handlers to close DB connections */
const gracefulShutdown = async (signal: string) => {
  try {
    console.log(`Prisma: received ${signal}, disconnecting...`);
    await prisma.$disconnect();
    console.log("Prisma: disconnected gracefully");
    // allow process to exit naturally after disconnect
  } catch (err) {
    console.error("Prisma: error during disconnect", err);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("beforeExit", () => {
  // Attempt a disconnect before Node exits
  prisma.$disconnect().catch((err) => {
    console.error("Prisma: error during beforeExit disconnect", err);
  });
});

export default prisma;
