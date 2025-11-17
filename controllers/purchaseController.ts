import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";

const purchaseController = (prisma: PrismaClient) => ({
  createPurchase: async (
    request: FastifyRequest<{
      Body: {
        clientId: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { clientId } = request.body;

      const cartItems = await prisma.cart.findMany({
        where: { client_id: clientId },
        include: {
          product_item: {
            include: {
              product: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        return reply.status(400).send({ message: "Cart is empty" });
      }

      const product_list = cartItems.map((item) => ({
        productId: item.product_item.product.id,
        name: item.product_item.product.name,
        price: item.product_item.product.price,
        quantity: item.product_item.quantity,
      }));

      const purchase = await prisma.purchase.create({
        data: {
          client_id: clientId,
          status: "pending",
          product_list: product_list,
        },
      });

      const productItemIds = cartItems.map((item) => item.product_item_id);
      await prisma.cart.deleteMany({ where: { client_id: clientId } });
      await prisma.product_item.deleteMany({ where: { id: { in: productItemIds } } });

      return reply.status(201).send(purchase);
    } catch (error) {
      console.error("Error while creating purchase", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  getPurchaseHistory: async (
    request: FastifyRequest<{
      Params: { clientId: number };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const clientId = request.params.clientId;
      const purchases = await prisma.purchase.findMany({
        where: {
          client_id: clientId,
        },
      });
      return reply.status(200).send(purchases);
    } catch (error) {
      console.error("Error while getting purchase history", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
});

export default purchaseController;
