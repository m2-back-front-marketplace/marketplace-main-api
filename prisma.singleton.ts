// prisma.singleton.ts
import { mock } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { createPrismaMock } from "bun-mock-prisma";

// Crée une instance du mock Prisma
const prismaMock = createPrismaMock<PrismaClient>();

// Remplace le client Prisma réel par le mock dans ton application
mock.module("@/utils/prisma", () => ({
  __esModule: true,
  prisma: prismaMock,
}));

export { prismaMock };
