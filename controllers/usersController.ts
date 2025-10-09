import { PrismaClient } from "@prisma/client";
import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";


dotenv.config();
const prisma= new PrismaClient();

const usersController = {
  login: async (request: FastifyRequest<{ Body: { email: string; password: string }}>, reply: FastifyReply) => {
    try {
      const { email , password } = request.body;
 
      if (!email || !password){
        return reply.status(400).send({message: "All fields are required"});
      }

      const user = await prisma.users.findFirst({
        where: {
          email,
        },
        orderBy: {
          id: "asc",
        }
      });

      if (!user) {
        return reply.status(401).send({message: "Email not registered"});
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid){
        return reply.status(401).send({message: "Invalid password"});
      }

      if(!process.env.JWT_SECRET){
        return reply.status(400).send({message: "JWT secret not defined in .env"});
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });
            
      reply.setCookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/"
      });
      return reply.status(200).send({user});
    }catch (error){
      console.error("error login controller", error);
      return reply.status(500).send({message: "Internal server error"});
    }
  },
  register: async (request: FastifyRequest<{ Body: { username: string; email: string; password: string } }>, reply: FastifyReply) => {
    try{
      const {username , email , password } = request.body;

      if(!username || !email || !password){
        return reply.status(400).send({message: "All field required"});
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const user = prisma.users.create({
        data:{
          username,
          email,
          password: hashPassword,
        },
      });

      if(!process.env.JWT_SECRET){
        return reply.status(400).send({message: "JWT secret not defined in .env"});
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });
      reply.setCookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/"
      });
      return reply.status(201).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    }catch (error){
      return reply.status(500).send({message: "User not found"});
    }
  },
  deleteUser: async (request: { body: { id: any } }, reply: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: { message: string }): any; new(): any } } }) => {
    try {
      const userId = request.body.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      await prisma.user.delete({
        where: { id: userId },
      });
      return reply.status(200).send({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
  updateUser: async (request: { body: { id?: any; username?: any; email?: any } }, reply: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: { message: string; updatedUser?: any }): any; new(): any } } }) => {
    try {
      const userId = request.body.id;
      const { username, email } = request.body;
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          username: username || user.username,
          email: email || user.email,
        },
      });
      return reply
        .status(200)
        .send({ message: "User updated successfully", updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  },
};

export default usersController;