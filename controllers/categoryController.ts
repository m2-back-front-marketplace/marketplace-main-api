import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";
import dotenv from "dotenv";

dotenv.config();

const categoryController = (prisma: PrismaClient) => ({
  getCategories: async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.category.findMany();
    reply.send({ data: categories });
  },
});

export default categoryController;
