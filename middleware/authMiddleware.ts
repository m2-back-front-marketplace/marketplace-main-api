import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

const prisma = new PrismaClient();

const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.code(401).send({ error: "Authentication required: No token provided." });
    }

    if (!process.env.JWT_SECRET) {
      // This is a server error, should not be exposed to client directly in production
      console.error("JWT_SECRET is not defined in environment variables");
      return reply.code(500).send({ error: "Internal server configuration error." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return reply.code(401).send({ error: "Invalid token payload." });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });

    if (!user) {
      return reply.code(401).send({ error: "Invalid token: User not found." });
    }

    // Attach user to the request object instead of overwriting the body
    request.user = { id: user.id };
  } catch (err) {
    // Catch JWT errors like 'TokenExpiredError' or 'JsonWebTokenError'
    return reply.code(401).send({ error: "Invalid or expired token.", err });
  }
};

export default authenticate;
