import productsController from "../controllers/productsController";
import authenticate from "../middleware/authMiddleware";
import prisma from "../utils/prisma";
import type { FastifyInstance } from "fastify";
import { requireSeller } from "../middleware/roleMiddleware";

const controller = productsController();

const productRoutes = (fastify: FastifyInstance) => {
  fastify.post("/create", {
    preHandler: [authenticate, requireSeller],
    schema: {
      tags: ["Product"],
      description: "Create new product",
      body: {
        type: "object",
        required: ["name", "price", "quantity"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          quantity: { type: "number" },
          discount_id: { type: "number" },
          category_id: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.createProduct,
  });

  fastify.put("/update/:id", {
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
          category_id: { type: "number" },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.updateProduct,
  });

  fastify.post("/:id/images", {
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
    onRequest: [authenticate],
    handler: controller.uploadProductImage,
  });

  fastify.get("/getAllProducts", {
    schema: {
      tags: ["Product"],
      description: "Get all products",
    },
    handler: controller.getProduct,
  });

  fastify.get("/getProductById/:id", {
    schema: {
      tags: ["Product"],
      description: "Get product by ID",
      params: {
        type: "object",
        properties: {
          id: { type: "number" },
        },
        required: ["id"],
      },
    },
    handler: controller.getProductById,
  });

  fastify.delete("/delete/:id", {
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
    onRequest: [authenticate],
    handler: controller.deleteProduct,
  });
};

export default productRoutes;
