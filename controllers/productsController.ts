import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";
import { uploadStream } from "../services/cloudinaryService";

const productsController = (prisma: PrismaClient) => ({
  createProduct: async (
    request: FastifyRequest<{
      Body: {
        name: string;
        description: string;
        price: number;
        quantity: number;
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
        approuved: string;
        discount_id: number;
        categories_id: number[];
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const productId = request.params.id;
      const { name, description, price, quantity, approuved, discount_id, categories_id } =
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
      return reply.status(201).send({ message: "Product succefully updated", data: updateProduct });
    } catch (error) {
      console.error("Error while updating the product", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  uploadProductImage: async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const productId = parseInt(request.params.id, 10);
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ message: "No file uploaded." });
      }

      // Check if product exists
      const product = await prisma.products.findUnique({ where: { id: productId } });
      if (!product) {
        return reply.status(404).send({ message: "Product not found." });
      }

      const buffer = await data.toBuffer();
      const uploadResult = await uploadStream(buffer);

      const image = await prisma.productImage.create({
        data: {
          url: uploadResult.secure_url,
          product_id: productId,
        },
      });

      return reply.status(201).send({ message: "Image uploaded successfully", image });
    } catch (error) {
      console.error("Error uploading image:", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  deleteProduct: async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const productId = request.params.id;

      const existingProduct = await prisma.products.findUnique({ where: { id: productId } });
      if (!existingProduct) {
        return reply.status(404).send({ message: "product not found or doesnt existe" });
      }

      await prisma.products.delete({
        where: {
          id: productId,
        },
      });
      return reply.status(200).send({ message: "Product succefully deleted" });
    } catch (error) {
      console.error("eroor while deleting product", error);
      return reply.status(500).send({ message: "Internal server errro" });
    }
  },

  getProduct: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const product = await prisma.products.findMany({
        include: {
          seller: {
            select: {
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      });
      return reply.status(200).send({ data: product, message: "Product fetched successfully" });
    } catch (error) {
      console.error("Error while getting product:", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
});

export default productsController;
