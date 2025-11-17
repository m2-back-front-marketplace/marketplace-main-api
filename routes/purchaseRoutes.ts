import purchaseController from "../controllers/purchaseController";
import authenticate from "../middleware/authMiddleware";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyInstance } from "fastify";

const prisma = new PrismaClient();
const controller = purchaseController(prisma);

const purchaseRoutes = (fastify: FastifyInstance) => {
  fastify.post("/", {
    schema: {
      tags: ["Purchase"],
      description: "Create a new purchase from the user's cart.",
      body: {
        type: "object",
        required: ["clientId"],
        properties: {
          clientId: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.createPurchase,
  });

  fastify.get("/:clientId", {
    schema: {
      tags: ["Purchase"],
      description: "Get the purchase history for a client.",
      params: {
        type: "object",
        required: ["clientId"],
        properties: {
          clientId: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.getPurchaseHistory,
  });
};

export default purchaseRoutes;
