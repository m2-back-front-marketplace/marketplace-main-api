import userRoutes from "./userRoutes";

const routes = async (fastify) => {
  fastify.register(userRoutes, { prefix: "/user" });
};

export default routes;
