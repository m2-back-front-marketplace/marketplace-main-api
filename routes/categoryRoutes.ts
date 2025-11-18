import type { FastifyInstance } from "fastify";
import { PrismaClient } from "../generated/prisma/client";
import categoryController from "../controllers/categoryController";

const prisma = new PrismaClient();
const category = categoryController(prisma);

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        summary: "Get all categories",
        tags: ["Category"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    category.getCategories
  );
}
