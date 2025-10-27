import { PrismaClient } from "../generated/prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

const usersController = {
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
        where: {
          email,
        },
        orderBy: {
          id: "asc",
        },
      });

      if (!user) {
        return reply.status(401).send({ message: "Email not registered" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return reply.status(401).send({ message: "Invalid password" });
      }

      if (!process.env.JWT_SECRET) {
        return reply.status(400).send({ message: "JWT secret not defined in .env" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });

      reply.setCookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      return reply.status(200).send({ user });
    } catch (error) {
      console.error("error login controller", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
  register: async (
    request: FastifyRequest<{ Body: { username: string; email: string; password: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { username, email, password } = request.body;

      if (!username || !email || !password) {
        return reply.status(400).send({ message: "All field required" });
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const user = await prisma.users.create({
        data: {
          username,
          email,
          password: hashPassword,
          role: "client"
        },
      });

      if (!process.env.JWT_SECRET) {
        return reply.status(400).send({ message: "JWT secret not defined in .env" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });
      reply.setCookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      return reply.status(201).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("error register controller", error);
      return reply.status(500).send({ message: "User not create "});
    }
  },

  update: async(
    request: FastifyRequest<{Body : {id: number, username: string, email: string, password: string}}>,
    reply: FastifyReply
  ) => {
    try {
      const {id, username , email , password} = request.body;
      if (!id){
        return reply.status(401).send({message: "User not connected or no id found"});
      }
      const user = await prisma.users.update({
        where: {
          id: id
        },
        data: {
          username: username,
          email: email,
          password: password,
        }
      });
      if(!user){
        return reply.status(401).send({message: "User not found"});
      }
    } catch (error) {
      console.error("error update controller", error);
      return reply.status(500).send({message: "User not found"});
    }
  },

  delete: async(
    request: FastifyRequest<{Body: {email: string}}>,
    reply: FastifyReply
  ) => {
    try {
      const {email} = request.body;
      if (!email){
        return reply.status(401).send({message: "Email required"});
      }
      await prisma.users.delete({
        where: {
          email: email
        }
      });
    }catch (error){
      console.error("error delete controller", error);
      return reply.status(500).send({message: "User not found"});
    }
  }
};


export default usersController;
