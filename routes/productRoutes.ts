import productsController from "../controllers/productsController";
import authenticate from "../middleware/authMiddleware";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyInstance } from "fastify";
import { requireSeller, requireSellerOrAdmin } from "../middleware/roleMiddleware";

const prisma = new PrismaClient();
const controller = productsController(prisma);

const productRoutes = (fastify: FastifyInstance) => {
  fastify.post("/create", {
    preHandler: [authenticate, requireSeller],
    schema: {
      tags: ["Product"],
      description: "Create new product",
      body: {
        type: "object",
        required: ["name", "price", "quantity", "seller_id"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          quantity: { type: "number" },
          discount_id: { type: "number" },
          categories_id: { type: "array", items: { type: "number" } },
        },
      },
    },
    handler: controller.createProduct,
  });

  fastify.put("/update/:id", {
    preHandler: [authenticate, requireSeller],
    schema: {
      tags: ["Product"],
      description: "Update product",
      params: {
        type: "object",
        properties: {
          id: { type: "number" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          quantity: { type: "number" },
          discount_id: { type: "number" },
          categories_id: { type: "array", items: { type: "number" } },
        },
      },
    },
    handler: controller.updateProduct,
  });

  fastify.post("/:id/images", {
    preHandler: [authenticate, requireSeller],
    schema: {
      tags: ["Product"],
      description: "Add a new image to a product",
      params: {
        type: "object",
        properties: {
          id: { type: "number" },
        },
        required: ["id"],
      },
      consumes: ["multipart/form-data"],
    },
    handler: controller.uploadProductImage,
  });

  fastify.delete("/delete/:id", {
    preHandler: [authenticate, requireSellerOrAdmin],
    schema: {
      tags: ["Product"],
      description: "delete product",
      params: {
        type: "object",
        properties: {
          id: { type: "number" },
        },
        required: ["id"],
      },
    },
    handler: controller.deleteProduct,
  });
};

export default productRoutes;
