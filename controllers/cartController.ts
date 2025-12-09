import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";

type CartItemParams = { itemId: string };
type AddToCartBody = { productId: number; quantity: number };
type UpdateCartItemBody = { quantity: number };

const CART_COOKIE_NAME = "cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cartController = (prisma: PrismaClient) => {
  // Helper: find or create a cart for the request (authenticated user or anonymous via cookie)
  const getOrCreateCartForRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    // If user is authenticated, use (or create) a cart tied to the user
    if (request.user && request.user.id) {
      const userId = request.user.id;
      let cart = await prisma.cart.findFirst({ where: { client_id: userId } });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { client_id: userId },
        });
      }
      return { cart, isAnonymous: false };
    }

    // Otherwise, try cookie-based anonymous cart id
    const cookieCartId = request.cookies?.[CART_COOKIE_NAME];
    if (cookieCartId) {
      // Try to fetch the cart by id; ensure it exists
      const id = parseInt(cookieCartId, 10);
      if (!Number.isNaN(id)) {
        const cart = await prisma.cart.findUnique({
          where: { id },
        });
        if (cart) {
          return { cart, isAnonymous: true };
        }
      }
      // If cookie contained an invalid/nonexistent id, we'll create a new one below
    }

    // Create a new anonymous cart and set cookie
    const newCart = await prisma.cart.create({
      data: { client_id: null },
    });

    // set cookie so client can reference this anonymous cart later
    // httpOnly false so client-side code may read it if needed; adjust as desired
    reply.setCookie(CART_COOKIE_NAME, String(newCart.id), {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CART_COOKIE_MAX_AGE,
    });

    return { cart: newCart, isAnonymous: true };
  };

  return {
    // Get cart (authenticated or anonymous)
    getCart: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // If authenticated, return user's cart; otherwise use cookie-based cart
        // getOrCreateCartForRequest will create an anonymous cart if none exists
        const { cart } = await getOrCreateCartForRequest(request, reply);

        // Fetch cart with items and product relations
        const fullCart = await prisma.cart.findUnique({
          where: { id: cart.id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // If no cart found (should not happen since we create one), return empty structure
        if (!fullCart) {
          return reply
            .status(200)
            .send({
              data: { id: cart.id, client_id: cart.client_id, items: [] },
              message: "Cart retrieved successfully",
            });
        }

        return reply.status(200).send({ data: fullCart, message: "Cart retrieved successfully" });
      } catch (error) {
        console.error("error getCart controller", error);
        return reply.status(500).send({ message: "Failed to get cart", error });
      }
    },

    // Add item to cart (create cart if necessary for anonymous)
    addToCart: async (request: FastifyRequest<{ Body: AddToCartBody }>, reply: FastifyReply) => {
      const { productId, quantity } = request.body;

      if (!productId || !quantity || quantity <= 0) {
        return reply
          .status(400)
          .send({ message: "Invalid request: productId and a positive quantity are required." });
      }

      try {
        const { cart } = await getOrCreateCartForRequest(request, reply);

        // Try to find existing item
        const existingCartItem = await prisma.cartItem.findFirst({
          where: {
            cart_id: cart.id,
            product_id: productId,
          },
        });

        if (existingCartItem) {
          const updatedItem = await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: existingCartItem.quantity + quantity },
          });
          return reply
            .status(200)
            .send({ data: updatedItem, message: "Cart item quantity updated" });
        }

        const newItem = await prisma.cartItem.create({
          data: {
            cart_id: cart.id,
            product_id: productId,
            quantity,
          },
        });

        return reply
          .status(201)
          .send({ data: newItem, message: "Item added to cart successfully" });
      } catch (error) {
        console.error("error addToCart controller", error);
        return reply.status(500).send({ message: "Failed to add item to cart", error });
      }
    },

    // Update item quantity (works for authenticated and anonymous carts)
    updateCartItemQuantity: async (
      request: FastifyRequest<{ Params: CartItemParams; Body: UpdateCartItemBody }>,
      reply: FastifyReply
    ) => {
      const { itemId } = request.params;
      const { quantity } = request.body;

      if (!quantity || quantity <= 0) {
        return reply.status(400).send({ message: "A positive quantity is required." });
      }

      try {
        const { cart } = await getOrCreateCartForRequest(request, reply);

        const cartItem = await prisma.cartItem.findFirst({
          where: { id: parseInt(itemId, 10), cart_id: cart.id },
        });

        if (!cartItem) {
          return reply.status(404).send({ message: "Item not found in cart." });
        }

        const updatedItem = await prisma.cartItem.update({
          where: { id: parseInt(itemId, 10) },
          data: { quantity },
        });

        return reply
          .status(200)
          .send({ data: updatedItem, message: "Cart item quantity updated successfully" });
      } catch (error) {
        console.error("error updateCartItemQuantity controller", error);
        return reply.status(500).send({ message: "Failed to update cart item quantity", error });
      }
    },

    // Remove item from cart
    removeFromCart: async (
      request: FastifyRequest<{ Params: CartItemParams }>,
      reply: FastifyReply
    ) => {
      const { itemId } = request.params;

      try {
        const { cart } = await getOrCreateCartForRequest(request, reply);

        const cartItem = await prisma.cartItem.findFirst({
          where: { id: parseInt(itemId, 10), cart_id: cart.id },
        });

        if (!cartItem) {
          return reply.status(404).send({ message: "Item not found in cart." });
        }

        await prisma.cartItem.delete({
          where: { id: parseInt(itemId, 10) },
        });

        return reply.status(204).send({ data: {}, message: "Item removed from cart successfully" });
      } catch (error) {
        console.error("error removeFromCart controller", error);
        return reply.status(500).send({ message: "Failed to remove item from cart", error });
      }
    },

    // Clear the entire cart
    clearCart: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { cart } = await getOrCreateCartForRequest(request, reply);

        // Delete all cart items for this cart
        await prisma.cartItem.deleteMany({
          where: { cart_id: cart.id },
        });

        // If anonymous, keep the cart record (so cookie remains valid). If authenticated, keep as well.
        // Optionally you could delete the cart entirely for anonymous users and clear cookie.
        // For now we keep the cart and return empty items.
        return reply
          .status(200)
          .send({ data: { id: cart.id, items: [] }, message: "Cart cleared successfully" });
      } catch (error) {
        console.error("error clearCart controller", error);
        return reply.status(500).send({ message: "Failed to clear cart", error });
      }
    },
  };
};

export default cartController;
