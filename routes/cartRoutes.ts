import type { FastifyInstance } from "fastify";
import cartController from "../controllers/cartController";

const cart = cartController();

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        summary: "Get the user's cart",
        tags: ["Cart"],
        response: {
          200: { description: "The user's cart" },
          404: { description: "Cart not found" },
          500: { description: "Server error" },
        },
      },
    },
    cart.getCart
  );

  fastify.post(
    "/items",
    {
      schema: {
        summary: "Add an item to the cart or update its quantity",
        tags: ["Cart"],
        body: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "integer" },
            quantity: { type: "integer" },
          },
        },
        response: {
          200: { description: "Item quantity updated" },
          201: { description: "Item added to cart" },
          400: { description: "Invalid request" },
          500: { description: "Server error" },
        },
      },
    },
    cart.addToCart
  );

  fastify.put(
    "/items/:itemId",
    {
      schema: {
        summary: "Update the quantity of a specific item in the cart",
        tags: ["Cart"],
        params: {
          type: "object",
          properties: {
            itemId: { type: "integer" },
          },
        },
        body: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: { type: "integer", description: "The new quantity for the item" },
          },
        },
        response: {
          200: { description: "Item quantity updated successfully" },
          400: { description: "Invalid request (e.g., non-positive quantity)" },
          404: { description: "Cart or item not found" },
          500: { description: "Server error" },
        },
      },
    },
    cart.updateCartItemQuantity
  );

  fastify.delete(
    "/items/:itemId",
    {
      schema: {
        summary: "Remove an item from the cart",
        tags: ["Cart"],
        params: {
          type: "object",
          properties: {
            itemId: { type: "integer" },
          },
        },
        response: {
          204: { description: "Item removed successfully" },
          404: { description: "Cart or item not found" },
          500: { description: "Server error" },
        },
      },
    },
    cart.removeFromCart
  );

  fastify.delete(
    "/",
    {
      schema: {
        summary: "Clear all items from the cart",
        tags: ["Cart"],
        response: {
          204: { description: "Cart cleared successfully" },
          404: { description: "Cart not found" },
          500: { description: "Server error" },
        },
      },
    },
    cart.clearCart
  );
}
