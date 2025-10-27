import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

const prisma = new PrismaClient();

const authenticate = async (request: FastifyRequest<{ Body: { userId: number}}>,
  reply: FastifyReply) => {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return reply.code(401).send({ error: "Invalid token payload" });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });

    if (!user) {
      return reply.code(401).send({ error: "Invalid token" });
    }

    request.body = { userId: user.id };
  } catch {
    return reply.code(401).send({ error: "Invalid Authentification" });
  }
};

export default authenticate;
