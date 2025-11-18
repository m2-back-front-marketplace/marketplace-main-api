import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";

// Define types for request parts
type PurchaseParams = { purchaseId: string };

const purchaseController = (prisma: PrismaClient) => ({
  // Create a new purchase from the cart
  createPurchase: async (request: FastifyRequest, reply: FastifyReply) => {
    // const userId = request.user.id;
    const userId = 1; // FIXME: replace with request.user.id

    try {
      const cart = await prisma.cart.findFirst({
        where: { client_id: userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return reply.status(400).send({ message: "Cart is empty or not found." });
      }

      const total = cart.items.reduce((acc, item) => acc + item.quantity * item.product.price, 0);

      // Create the purchase and its items in a transaction
      const purchase = await prisma.$transaction(async (tx) => {
        const newPurchase = await tx.purchase.create({
          data: {
            client_id: userId,
            status: "PENDING",
            total,
            items: {
              create: cart.items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.product.price, // Store price at time of purchase
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Clear the cart
        await tx.cartItem.deleteMany({
          where: { cart_id: cart.id },
        });

        return newPurchase;
      });

      return reply.status(201).send(purchase);
    } catch (error) {
      console.error("error createPurchase controller", error);
      return reply.status(500).send({ message: "Failed to create purchase", error });
    }
  },

  // Get user's purchase history
  getPurchaseHistory: async (request: FastifyRequest, reply: FastifyReply) => {
    // const userId = request.user.id;
    const userId = 1; // FIXME: replace with request.user.id

    try {
      const purchases = await prisma.purchase.findMany({
        where: { client_id: userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.status(200).send(purchases);
    } catch (error) {
      console.error("error getPurchaseHistory controller", error);
      return reply.status(500).send({ message: "Failed to get purchase history", error });
    }
  },

  // Get user's purchase history by status
  getPurchaseHistoryByStatus: async (
    request: FastifyRequest<{ Params: { status: string } }>,
    reply: FastifyReply
  ) => {
    // const userId = request.user.id;
    const userId = 1; // FIXME: replace with request.user.id
    const { status } = request.params;

    const upperCaseStatus = status.toUpperCase();

    if (upperCaseStatus !== "PENDING" && upperCaseStatus !== "COMPLETED") {
      return reply
        .status(400)
        .send({ message: "Invalid status. Must be \"pending\" or \"completed\"." });
    }

    try {
      const purchases = await prisma.purchase.findMany({
        where: {
          client_id: userId,
          status: upperCaseStatus,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.status(200).send(purchases);
    } catch (error) {
      console.error("error getPurchaseHistoryByStatus controller", error);
      return reply.status(500).send({ message: "Failed to get purchase history by status", error });
    }
  },

  // Get a specific purchase by ID
  getPurchaseById: async (
    request: FastifyRequest<{ Params: PurchaseParams }>,
    reply: FastifyReply
  ) => {
    // const userId = request.user.id;
    const userId = 1; // FIXME: replace with request.user.id
    const { purchaseId } = request.params;

    try {
      const purchase = await prisma.purchase.findFirst({
        where: {
          id: parseInt(purchaseId),
          client_id: userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!purchase) {
        return reply.status(404).send({ message: "Purchase not found." });
      }

      return reply.status(200).send(purchase);
    } catch (error) {
      console.error("error getPurchaseById controller", error);
      return reply.status(500).send({ message: "Failed to get purchase details", error });
    }
  },
});

export default purchaseController;
