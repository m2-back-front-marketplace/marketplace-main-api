import userRoutes from "./userRoutes";
import productRoutes from "./productRoutes";

const routes = async (fastify) => {
  fastify.register(userRoutes, { prefix: "/user" });
  fastify.register(productRoutes, { prefix: "/product" });
};

export default routes;
