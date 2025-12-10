import type { FastifyInstance } from "fastify";
import prisma from "../utils/prisma";
import categoryController from "../controllers/categoryController";

const category = categoryController();

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get("/", category.getCategories);
}
