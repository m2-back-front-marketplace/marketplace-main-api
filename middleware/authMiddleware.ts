import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const authenticate = async (request, reply) => {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });

    if (!user) {
      return reply.code(401).send({ error: "Invalid token" });
    }

    request.user = { userId: user.id };
  } catch {
    return reply.code(401).send({ error: "Invalid Authentification" });
  }
};

export default authenticate;