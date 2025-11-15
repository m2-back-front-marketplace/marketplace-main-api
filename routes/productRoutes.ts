import productsController from "../controllers/productsController";
import authenticate from "../middleware/authMiddleware";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyInstance } from "fastify";

const prisma = new PrismaClient();
const controller = productsController(prisma);

const productRoutes = (fastify: FastifyInstance) => {
  fastify.post("/create", {
    schema: {
      tags: ["Product"],
      description: "Create new product",
      body: {
        type: "object",
        required: ["name", "price", "quantity"],
        properties: {
          name: { type: "string"},
          description: {type: "string"},
          price: {type: "number"},
          quantity: {type: "number"},
          image: {type: "string"},
          seller_id: {type: "number" },
          discount_id: {type: "number"}
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
          name: {type: "string"},
          description: {type: "string"},
          price: {type: "number"},
          quantity: {type: "number"},
          image: {type: "string"},
          discount_id: {type: "number"}
        }
      }
    },
    onRequest: [authenticate],
    handler: controller.updateProduct,
  });

  fastify.delete("/delete/:id",{
    schema: {
      tags: ["Product"],
      description: "delete product",
      params: {
        type: "object",
        properties: {
          id: {type: "number"},
        },
        required: ["id"],
      }
    },
    onRequest: [authenticate],
    handler: controller.deleteProduct,
  });
};

export default productRoutes;