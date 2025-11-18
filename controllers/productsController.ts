import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";

const productsController = (prisma: PrismaClient) => ({
  createProduct: async (
    request: FastifyRequest<{
      Body: {
        name: string;
        description: string;
        price: number;
        quantity: number;
        image: string;
        approuved: string;
        seller_id: number;
        discount_id: number;
        categories_id: number[];
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        name,
        description,
        price,
        quantity,
        image,
        approuved,
        seller_id,
        discount_id,
        categories_id,
      } = request.body;
      if (!name || !price || !quantity) {
        return reply.status(400).send({ message: "all field required" });
      }
      if (!seller_id) {
        return reply.status(403).send({ message: "Forbidden, must be connected" });
      }
      const product = await prisma.products.create({
        data: {
          name,
          description,
          price,
          quantity,
          image,
          approuved,
          seller: {
            connect: { id: seller_id },
          },
          discount: discount_id ? { connect: { id: discount_id } } : undefined,
        },
      });
      if (categories_id && categories_id.length >= 1) {
        const productcategory = await prisma.products_category.createMany({
          data: categories_id.map((id) => ({
            product_id: product.id,
            category_id: id,
          })),
        });
        return reply
          .status(201)
          .send({ message: "Product create with category", product, productcategory });
      }
      return reply
        .status(201)
        .send({ message: "Product create without category", product, categories_id });
    } catch (error) {
      console.error("error will creating product", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  updateProduct: async (
    request: FastifyRequest<{
      Params: { id: number };
      Body: {
        name: string;
        description: string;
        price: number;
        quantity: number;
        image: string;
        approuved: string;
        discount_id: number;
        categories_id: number[];
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const productId = request.params.id;
      const { name, description, price, quantity, image, approuved, discount_id, categories_id } =
        request.body;
      const existingProduct = await prisma.products.findUnique({
        where: {
          id: productId,
        },
      });
      if (!existingProduct) {
        return reply.status(404).send({ message: "Product not found" });
      }

      const updateProduct = await prisma.products.update({
        where: {
          id: productId,
        },
        data: {
          name,
          description,
          price,
          quantity,
          image,
          approuved,
          discount: discount_id
            ? {
              connect: { id: discount_id },
            }
            : { disconnect: true },
        },
      });
      if (categories_id && categories_id.length > 0) {
        await prisma.products_category.deleteMany({
          where: { product_id: productId },
        });
        await prisma.products_category.createMany({
          data: categories_id.map((id) => ({
            product_id: productId,
            category_id: id,
          })),
        });
      }
      return reply.status(201).send({ message: "Product succefully updated", updateProduct });
    } catch (error) {
      console.error("Error while updating the product", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  deleteProduct: async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const productId = request.params.id;
      if (!productId) {
        return reply.status(404).send({ message: "product not found or doesnt existe" });
      }
      await prisma.products.delete({
        where: {
          id: productId,
        },
      });
    } catch (error) {
      console.error("eroor while deleting product", error);
      return reply.status(500).send({ message: "Internal server errro" });
    }
  },
});

export default productsController;
