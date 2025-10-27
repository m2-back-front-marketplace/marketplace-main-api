import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createPrismaMock } from "bun-mock-prisma";
import bcrypt from "bcrypt";
import usersController from "../controllers/usersController";

const prismaMock = createPrismaMock();
const controller = usersController(prismaMock as any);

describe("usersController", () => {
  let reply: any;
  let hashedPassword: string;

  beforeEach(async () => {
    // Reset le mock avant chaque test
    prismaMock._reset();

    // Crée un mot de passe hashé
    hashedPassword = await bcrypt.hash("password123", 10);

    // Initialisation du reply
    reply = {
      statusCode: 0,
      cookies: [],
      status(code: number) { this.statusCode = code; return this; },
      send(obj: any) { this.body = obj; return this; },
      setCookie(name: string, value: string, options: any) { this.cookies.push({ name, value, options }); },
      body: null,
    };

    // RECREER un utilisateur pour login, update, delete
    prismaMock.users.create.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });
  });

  afterEach(() => {
    // Reset après chaque test
    prismaMock._reset();
  });

  // ---------- REGISTER ----------
  it("register: should create a user", async () => {
    const request = { body: { username: "newuser", email: "newuser@example.com", password: "password123" } };

    prismaMock.users.create.mockResolvedValue({
      id: 2,
      username: "newuser",
      email: "newuser@example.com",
      password: await bcrypt.hash("password123", 10),
    });

    await controller.register(request as any, reply as any);

    expect(reply.statusCode).toBe(201);
    expect(reply.body.user.username).toBe("newuser");
    expect(reply.body.user.email).toBe("newuser@example.com");
    expect(reply.cookies.length).toBe(1);
  });

  it("register: should return 400 if fields missing", async () => {
    const request = { body: { username: "", email: "", password: "" } };
    await controller.register(request as any, reply as any);

    expect(reply.statusCode).toBe(400);
    expect(reply.body.message).toBe("All field required");
  });

  // ---------- LOGIN ----------
  it("login: should login user with correct credentials", async () => {
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });

    const request = { body: { email: "john@example.com", password: "password123" } };
    await controller.login(request as any, reply as any);

    expect(reply.statusCode).toBe(200);
    expect(reply.body.user.username).toBe("john");
    expect(reply.cookies.length).toBe(1);
  });

  it("login: should return 401 for wrong password", async () => {
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });

    const request = { body: { email: "john@example.com", password: "wrongpass" } };
    await controller.login(request as any, reply as any);

    expect(reply.statusCode).toBe(401);
    expect(reply.body.message).toBe("Invalid password");
  });

  // ---------- UPDATE ----------
  it("update: should update user", async () => {
    prismaMock.users.update.mockResolvedValue({
      id: 1,
      username: "johnny",
      email: "john@example.com",
      password: "newpass",
    });

    const request = { body: { id: 1, username: "johnny", email: "john@example.com", password: "newpass" } };
    await controller.update(request as any, reply as any);

    expect(reply.body).toBeNull(); // ton controller actuel ne renvoie rien
  });

  // ---------- DELETE ----------
  it("delete: should delete user", async () => {
    prismaMock.users.delete.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });

    const request = { body: { email: "john@example.com" } };
    await controller.delete(request as any, reply as any);

    expect(reply.body).toBeNull(); // ton controller actuel ne renvoie rien
  });

});
