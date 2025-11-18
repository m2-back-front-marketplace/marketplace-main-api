import type { FastifyInstance } from "fastify";

import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";
import cartRoutes from "./cartRoutes";
import purchaseRoutes from "./purchaseRoutes";
import categoryRoutes from "./categoryRoutes";
import type { FastifyInstance } from "fastify";

const routes = async (fastify: FastifyInstance) => {
  fastify.register(userRoutes, { prefix: "/user" });
  fastify.register(productRoutes, { prefix: "/product" });
  fastify.register(cartRoutes, { prefix: "/cart" });
  fastify.register(purchaseRoutes, { prefix: "/purchase" });
  fastify.register(categoryRoutes, { prefix: "/category" });
};

export default routes;
