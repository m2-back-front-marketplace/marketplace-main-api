import type { FastifyInstance } from "fastify";
import { PrismaClient } from "../generated/prisma/client";
import purchaseController from "../controllers/purchaseController";
import authenticate from "../middleware/authMiddleware";
import { requireClient } from "../middleware/roleMiddleware";

const prisma = new PrismaClient();
const purchase = purchaseController(prisma);

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      preHandler: [authenticate, requireClient],
      schema: {
        summary: "Create a new purchase from the user's cart",
        tags: ["Purchase"],
        response: {
          201: { description: "Purchase created successfully. Returns the new purchase object." },
          400: { description: "Cart is empty or not found." },
          500: { description: "Server error while creating the purchase." },
        },
      },
    },
    purchase.createPurchase
  );

  fastify.get(
    "/",
    {
      preHandler: [authenticate, requireClient],
      schema: {
        summary: "Get the purchase history for the current user",
        tags: ["Purchase"],
        response: {
          200: {
            description: "A list of the user's purchases.",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                client_id: { type: "integer" },
                status: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
                total: { type: "number" },
              },
            },
          },
          500: { description: "Server error while fetching purchase history." },
        },
      },
    },
    purchase.getPurchaseHistory
  );

  fastify.get(
    "/status/:status",
    {
      preHandler: [authenticate, requireClient],
      schema: {
        summary: "Get purchase history for the current user by status",
        tags: ["Purchase"],
        params: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["pending", "completed"],
              description: "The status to filter purchases by",
            },
          },
        },
        response: {
          200: {
            description: "A list of the user's purchases filtered by status.",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                client_id: { type: "integer" },
                status: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
                total: { type: "number" },
              },
            },
          },
          400: { description: "Invalid status provided." },
          500: { description: "Server error while fetching purchase history." },
        },
      },
    },
    purchase.getPurchaseHistoryByStatus
  );

  fastify.get(
    "/:purchaseId",
    {
      preHandler: [authenticate, requireClient],
      schema: {
        summary: "Get details of a specific purchase",
        tags: ["Purchase"],
        params: {
          type: "object",
          properties: {
            purchaseId: { type: "integer" },
          },
        },
        response: {
          200: { description: "The details of the purchase." },
          404: { description: "Purchase not found." },
          500: { description: "Server error while fetching the purchase." },
        },
      },
    },
    purchase.getPurchaseById
  );
}
