import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";


const fastify = Fastify({
  logger: true
});

fastify.register(swagger, {
  swagger: {
    info: {
      title: "Documento API",
      description: "API pour l'application Documento",
      version: "1.0.0",
    },
    externalDocs: {
      url: "https://swagger.io",
      description: "Find more info here",
    },
    host: `${process.env.API_URL || "localhost"}:8000`,
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [
      { name: "user", description: "User related endpoints" },
    ],
    securityDefinitions: {
      cookieAuth: {
        type: "apiKey",
        name: "token",
        in: "cookie",
      },
    },
  },
});

// Registrer Swagger UI
fastify.register(swaggerUI, {
  routePrefix: "/documentation",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
});


fastify.get("/health", async (request, reply) => {
  reply.send({health: "api is up and healthy"});
});

const start = async () => {
  try {
    await fastify.listen({port: 8000});
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

await start();