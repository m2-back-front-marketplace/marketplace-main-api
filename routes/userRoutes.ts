import userController from "../controllers/usersController.ts";
import authenticate from "../middleware/authMiddleware.ts";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyInstance } from "fastify";

const prisma = new PrismaClient();
const controller = userController(prisma);

const userRoutes = (fastify: FastifyInstance) => {
  fastify.post("/registerClient", {
    schema: {
      tags: ["User"],
      description: "Register a new client",
      body: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          phone: { type: "string" },
          address_id: { type: "number" },
        },
      },
    },
    handler: controller.registerClient,
  });

  fastify.post("/registerSeller", {
    schema: {
      tags: ["User"],
      description: "Refister a new seller",
      body: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          description: {type: "string"},
          password: { type: "string", minLength: 6 },
          phone: { type: "string" },
          address_id: { type: "number" },
          tax_id: { type: "number" },
          bank_account: { type: "string" },
          bank_account_bic: { type: "string" },
          image: { type: "string" },
        },
      },
    },
    handler: controller.registerSeller,
  });

  fastify.post("/login", {
    schema: {
      tags: ["User"],
      description: "Log in a user",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
    },
    handler: controller.login,
  });

  fastify.delete("/delete", {
    schema: {
      tags: ["User"],
      description: "Delete current user",
      security: [{ cookieAuth: [] }],
    },
    onRequest: [authenticate],
    handler: controller.delete,
  });

  fastify.put("/update", {
    schema: {
      tags: ["User"],
      description: "Update current user",
      security: [{ cookieAuth: [] }],
      body: {
        type: "object",
        properties: {
          fullname: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
    },
    onRequest: [authenticate],
    handler: controller.update,
  });
};

export default userRoutes;
