import userController from "../controllers/usersController.ts";
import authenticate from "../middleware/authMiddleware.ts";

const userRoutes = (fastify) => {
  fastify.post("/register", {
    schema: {
      tags: ["user"],
      description: "Register a new user",
      body: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
    },
    handler: userController.register,
  });

  fastify.post("/login", {
    schema: {
      tags: ["user"],
      description: "Log in a user",
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
    },
    handler: userController.login,
  });

  fastify.delete("/delete", {
    schema: {
      tags: ["user"],
      description: "Delete current user",
      security: [{ cookieAuth: [] }],
    },
    onRequest: [authenticate],
    handler: userController.delete,
  });

  fastify.put("/update", {
    schema: {
      tags: ["user"],
      description: "Update current user",
      security: [{ cookieAuth: [] }],
      body: {
        type: "object",
        properties: {
          fullname: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
    },
    onRequest: [authenticate],
    handler: userController.update,
  });
};

export default userRoutes;
