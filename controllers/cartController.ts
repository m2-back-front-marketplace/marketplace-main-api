import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";

const cartController = (prisma: PrismaClient) => ({
  getCartByClientId: async (
    request: FastifyRequest<{
      Params: { clientId: number };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const clientId = request.params.clientId;
      const cartItems = await prisma.cart.findMany({
        where: {
          client_id: clientId,
        },
        include: {
          product_item: {
            include: {
              product: true,
            },
          },
        },
      });
      return reply.status(200).send(cartItems);
    } catch (error) {
      console.error("Error while getting cart", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  addProductToCart: async (
    request: FastifyRequest<{
      Body: {
        clientId: number;
        productId: number;
        quantity: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { clientId, productId, quantity } = request.body;

      const client = await prisma.clients.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return reply.status(404).send({ message: "Client not found" });
      }

      const existingCartItem = await prisma.cart.findFirst({
        where: {
          client_id: clientId,
          product_item: {
            product_id: productId,
          },
        },
      });

      if (existingCartItem) {
        const updatedProductItem = await prisma.product_item.update({
          where: {
            id: existingCartItem.product_item_id,
          },
          data: {
            quantity: {
              increment: quantity,
            },
          },
        });
        return reply.status(200).send(updatedProductItem);
      } else {
        const productItem = await prisma.product_item.create({
          data: {
            product_id: productId,
            quantity: quantity,
          },
        });

        const cartItem = await prisma.cart.create({
          data: {
            client_id: clientId,
            product_item_id: productItem.id,
          },
        });

        return reply.status(201).send(cartItem);
      }
    } catch (error) {
      console.error("Error while adding product to cart", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  removeProductFromCart: async (
    request: FastifyRequest<{
      Params: { clientId: number; productId: number };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { clientId, productId } = request.params;

      const cartItem = await prisma.cart.findFirst({
        where: {
          client_id: clientId,
          product_item: {
            product_id: productId,
          },
        },
      });

      if (!cartItem) {
        return reply.status(404).send({ message: "Product not found in cart" });
      }

      await prisma.cart.delete({
        where: {
          id: cartItem.id,
        },
      });

      await prisma.product_item.delete({
        where: {
          id: cartItem.product_item_id,
        },
      });

      return reply.status(204).send();
    } catch (error) {
      console.error("Error while removing product from cart", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  updateProductQuantityInCart: async (
    request: FastifyRequest<{
      Params: { clientId: number; productId: number };
      Body: {
        quantity: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { clientId, productId } = request.params;
      const { quantity } = request.body;

      const cartItem = await prisma.cart.findFirst({
        where: {
          client_id: clientId,
          product_item: {
            product_id: productId,
          },
        },
      });

      if (!cartItem) {
        return reply.status(404).send({ message: "Product not found in cart" });
      }

      if (quantity === 0) {
        await prisma.cart.delete({ where: { id: cartItem.id } });
        await prisma.product_item.delete({ where: { id: cartItem.product_item_id } });
        return reply.status(204).send();
      } else {
        const updatedProductItem = await prisma.product_item.update({
          where: {
            id: cartItem.product_item_id,
          },
          data: {
            quantity: quantity,
          },
        });
        return reply.status(200).send(updatedProductItem);
      }
    } catch (error) {
      console.error("Error while updating product quantity in cart", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  clearCart: async (
    request: FastifyRequest<{
      Params: { clientId: number };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { clientId } = request.params;

      const cartItems = await prisma.cart.findMany({
        where: { client_id: clientId },
        select: { product_item_id: true },
      });

      if (cartItems.length > 0) {
        const productItemIds = cartItems.map((item) => item.product_item_id);

        await prisma.cart.deleteMany({
          where: { client_id: clientId },
        });

        await prisma.product_item.deleteMany({
          where: { id: { in: productItemIds } },
        });
      }

      return reply.status(204).send();
    } catch (error) {
      console.error("Error while clearing cart", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
});

export default cartController;
