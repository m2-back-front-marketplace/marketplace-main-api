import cartController from "../controllers/cartController";
import authenticate from "../middleware/authMiddleware";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyInstance } from "fastify";

const prisma = new PrismaClient();
const controller = cartController(prisma);

const cartRoutes = (fastify: FastifyInstance) => {
  fastify.get("/:clientId", {
    schema: {
      tags: ["Cart"],
      description: "Get the cart for a client.",
      params: {
        type: "object",
        required: ["clientId"],
        properties: {
          clientId: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.getCartByClientId,
  });

  fastify.post("/add", {
    schema: {
      tags: ["Cart"],
      description:
        "Add a product to the cart. If the product is already in the cart, the quantity will be updated.",
      body: {
        type: "object",
        required: ["clientId", "productId", "quantity"],
        properties: {
          clientId: { type: "number" },
          productId: { type: "number" },
          quantity: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.addProductToCart,
  });

  fastify.delete("/:clientId/products/:productId", {
    schema: {
      tags: ["Cart"],
      description: "Remove a product from the cart.",
      params: {
        type: "object",
        required: ["clientId", "productId"],
        properties: {
          clientId: { type: "number" },
          productId: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.removeProductFromCart,
  });

  fastify.put("/:clientId/products/:productId", {
    schema: {
      tags: ["Cart"],
      description:
        "Update the quantity of a product in the cart. If quantity is 0, the product is removed.",
      params: {
        type: "object",
        required: ["clientId", "productId"],
        properties: {
          clientId: { type: "number" },
          productId: { type: "number" },
        },
      },
      body: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.updateProductQuantityInCart,
  });

  fastify.delete("/:clientId/clear", {
    schema: {
      tags: ["Cart"],
      description: "Clear all items from a client's cart.",
      params: {
        type: "object",
        required: ["clientId"],
        properties: {
          clientId: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.clearCart,
  });
};

export default cartRoutes;
