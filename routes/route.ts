import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";
import cartRoutes from "./cartRoutes";
import purchaseRoutes from "./purchaseRoutes";

const routes = async (fastify) => {
  fastify.register(userRoutes, { prefix: "/user" });
  fastify.register(productRoutes, { prefix: "/product" });
  fastify.register(cartRoutes, { prefix: "/cart" });
  fastify.register(purchaseRoutes, { prefix: "/purchase" });
};

export default routes;
