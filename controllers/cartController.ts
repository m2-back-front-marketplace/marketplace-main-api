import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../middleware/roleMiddleware";

// Define types for request parts
type CartItemParams = { itemId: string };
type AddToCartBody = { productId: number; quantity: number };
type UpdateCartItemBody = { quantity: number };

const cartController = (prisma: PrismaClient) => ({
  // Get user's cart
  getCart: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const userId = request.user.id;

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

      if (!cart) {
        // Return an empty cart structure if none exists, which is a valid state
        return reply.status(200).send({ client_id: userId, items: [] });
      }

      return reply.status(200).send(cart);
    } catch (error) {
      console.error("error getCart controller", error);
      return reply.status(500).send({ message: "Failed to get cart", error });
    }
  },

  // Add item to cart or update quantity
  addToCart: async (
    request: AuthenticatedRequest & FastifyRequest<{ Body: AddToCartBody }>,
    reply: FastifyReply
  ) => {
    const userId = request.user.id;
    const { productId, quantity } = request.body;

    if (!productId || !quantity || quantity <= 0) {
      return reply
        .status(400)
        .send({ message: "Invalid request: productId and a positive quantity are required." });
    }

    try {
      let cart = await prisma.cart.findFirst({
        where: { client_id: userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { client_id: userId },
        });
      }

      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cart_id: cart.id,
          product_id: productId,
        },
      });

      if (existingCartItem) {
        // Update quantity if item exists
        const updatedItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
        });
        return reply.status(200).send(updatedItem);
      } else {
        // Add new item if it does not exist
        const newItem = await prisma.cartItem.create({
          data: {
            cart_id: cart.id,
            product_id: productId,
            quantity: quantity,
          },
        });
        return reply.status(201).send(newItem);
      }
    } catch (error) {
      console.error("error addToCart controller", error);
      return reply.status(500).send({ message: "Failed to add item to cart", error });
    }
  },

  // Update item quantity in cart
  updateCartItemQuantity: async (
    request: AuthenticatedRequest &
      FastifyRequest<{ Params: CartItemParams; Body: UpdateCartItemBody }>,
    reply: FastifyReply
  ) => {
    const userId = request.user.id;
    const { itemId } = request.params;
    const { quantity } = request.body;

    if (!quantity || quantity <= 0) {
      return reply.status(400).send({ message: "A positive quantity is required." });
    }

    try {
      const cart = await prisma.cart.findFirst({ where: { client_id: userId } });
      if (!cart) {
        return reply.status(404).send({ message: "Cart not found." });
      }

      const cartItem = await prisma.cartItem.findFirst({
        where: { id: parseInt(itemId), cart_id: cart.id },
      });

      if (!cartItem) {
        return reply.status(404).send({ message: "Item not found in cart." });
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: parseInt(itemId) },
        data: { quantity },
      });

      return reply.status(200).send(updatedItem);
    } catch (error) {
      console.error("error updateCartItemQuantity controller", error);
      return reply.status(500).send({ message: "Failed to update cart item quantity", error });
    }
  },

  // Remove item from cart
  removeFromCart: async (
    request: AuthenticatedRequest & FastifyRequest<{ Params: CartItemParams }>,
    reply: FastifyReply
  ) => {
    const userId = request.user.id;
    const { itemId } = request.params;

    try {
      const cart = await prisma.cart.findFirst({ where: { client_id: userId } });
      if (!cart) {
        return reply.status(404).send({ message: "Cart not found." });
      }

      const cartItem = await prisma.cartItem.findFirst({
        where: { id: parseInt(itemId), cart_id: cart.id },
      });

      if (!cartItem) {
        return reply.status(404).send({ message: "Item not found in cart." });
      }

      await prisma.cartItem.delete({
        where: { id: parseInt(itemId) },
      });

      return reply.status(204).send();
    } catch (error) {
      console.error("error removeFromCart controller", error);
      return reply.status(500).send({ message: "Failed to remove item from cart", error });
    }
  },

  // Clear the entire cart
  clearCart: async (request: AuthenticatedRequest, reply: FastifyReply) => {
    const userId = request.user.id;
    try {
      const cart = await prisma.cart.findFirst({
        where: { client_id: userId },
      });

      if (!cart) {
        return reply.status(404).send({ message: "Cart not found" });
      }

      await prisma.cartItem.deleteMany({
        where: { cart_id: cart.id },
      });

      return reply.status(204).send();
    } catch (error) {
      console.error("error clearCart controller", error);
      return reply.status(500).send({ message: "Failed to clear cart", error });
    }
  },
});

export default cartController;
