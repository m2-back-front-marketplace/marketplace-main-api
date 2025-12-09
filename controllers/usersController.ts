import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const usersController = (prisma: PrismaClient) => ({
  login: async (
    request: FastifyRequest<{ Body: { email: string; password: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({ message: "All fields are required" });
      }

      const user = await prisma.users.findFirst({
        where: { email },
        select: { id: true, email: true, username: true, role: true, password: true },
      });

      if (!user) {
        return reply.status(401).send({ message: "Email not registered" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reply.status(401).send({ message: "Invalid password" });
      }

      if (!process.env.JWT_SECRET) {
        return reply.status(500).send({ message: "JWT secret not defined" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

      reply.setCookie("auth_token", token, {
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return reply.status(200).send({ data: user, message: `Welcome ${user.username}`, token });
    } catch (error) {
      console.error("error login controller", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  registerClient: async (
    request: FastifyRequest<{
      Body: {
        username: string;
        email: string;
        password: string;
        phone?: string;
        address_id?: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { username, email, password, phone, address_id } = request.body;

      if (!username || !email || !password) {
        return reply.status(400).send({ message: "All fields required" });
      }

      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) {
        return reply.status(400).send({ message: "Email already used" });
      }

      if (!process.env.JWT_SECRET) {
        return reply.status(500).send({ message: "JWT secret not defined" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.users.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: "client",
          client: {
            create: {
              phone: phone,
              address_id: address_id ?? null,
            },
          },
        },
        include: { client: true },
      });

      return reply.status(201).send({ message: "Client created", data: user });
    } catch (error) {
      console.error("error registerClient", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  registerSeller: async (
    request: FastifyRequest<{
      Body: {
        username: string;
        email: string;
        password: string;
        phone?: string;
        description?: string;
        address_id?: number;
        tax_id?: number;
        bank_account?: string;
        bank_account_bic?: string;
        image?: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        username,
        email,
        password,
        phone,
        description,
        address_id,
        tax_id,
        bank_account,
        bank_account_bic,
        image,
      } = request.body;

      if (!username || !email || !password) {
        return reply.status(400).send({ message: "All fields required" });
      }

      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) {
        return reply.status(400).send({ message: "Email already used" });
      }

      if (!process.env.JWT_SECRET) {
        return reply.status(500).send({ message: "JWT secret not defined" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.users.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: "seller",
          seller: {
            create: {
              phone: phone ?? null,
              description: description ?? null,
              address_id: address_id ?? null,
              tax_id: tax_id ?? null,
              bank_account: bank_account ?? null,
              bank_account_bic: bank_account_bic ?? null,
              image: image ?? null,
            },
          },
        },
        include: { seller: true },
      });

      return reply.status(201).send({ message: "Seller created", data: user });
    } catch (error) {
      console.error("error registerSeller", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  update: async (
    request: FastifyRequest<{
      Body: { id?: number; username?: string; email?: string; password?: string };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { id, username, email, password } = request.body;
      if (!id) {
        return reply.status(400).send({ message: "User ID required" });
      }

      const existing = await prisma.users.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ message: "User not found" });
      }

      await prisma.users.update({
        where: { id },
        data: { username, email, password },
      });

      return reply.status(200).send({ message: "User updated" });
    } catch (error) {
      console.error("error update controller", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },

  delete: async (request: FastifyRequest<{ Body: { email?: string } }>, reply: FastifyReply) => {
    try {
      const { email } = request.body;
      if (!email) {
        return reply.status(400).send({ message: "Email required" });
      }

      const existing = await prisma.users.findUnique({ where: { email } });
      if (!existing) {
        return reply.status(404).send({ message: "User not found" });
      }

      await prisma.users.delete({ where: { email } });
      return reply.status(200).send({ message: "User deleted" });
    } catch (error) {
      console.error("error delete controller", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
});

export default usersController;
