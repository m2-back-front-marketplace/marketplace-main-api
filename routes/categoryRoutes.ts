import type { FastifyInstance } from "fastify";
import { PrismaClient } from "../generated/prisma/client";
import categoryController from "../controllers/categoryController";

const prisma = new PrismaClient();
const category = categoryController(prisma);

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get("/", category.getCategories);
}
