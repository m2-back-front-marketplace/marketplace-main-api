import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createPrismaMock } from "bun-mock-prisma";
import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import usersController from "../controllers/usersController";

const prismaMock = createPrismaMock();
const controller = usersController(prismaMock);

type MockReply = {
  statusCode: number;
  cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>;
  body: unknown;
  status: (code: number) => MockReply;
  send: (obj: unknown) => MockReply;
  setCookie: (name: string, value: string, options: Record<string, unknown>) => void;
};

type UserResponse = {
  user: {
    id: number;
    username: string;
    email: string;
  };
};

describe("usersController", () => {
  let reply: MockReply;
  let hashedPassword: string;

  beforeEach(async () => {
    prismaMock._reset();

    hashedPassword = await bcrypt.hash("password123", 10);

    reply = {
      statusCode: 0,
      cookies: [],
      body: null,
      status(code: number): MockReply {
        this.statusCode = code;
        return this;
      },
      send(obj: unknown): MockReply {
        this.body = obj;
        return this;
      },
      setCookie(name: string, value: string, options: Record<string, unknown>) {
        this.cookies.push({ name, value, options });
      },
    };

    prismaMock.users.create.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });
  });

  afterEach(() => {
    prismaMock._reset();
  });

  // ---------- REGISTER CLIENT ----------
  it("registerClient: should create a client user", async () => {
    const request: FastifyRequest = {
      body: {
        username: "clientUser",
        email: "client@example.com",
        password: "password123",
        phone: 123456789,
        address_id: 1,
      },
    } as unknown as FastifyRequest;

    prismaMock.users.create.mockResolvedValue({
      id: 2,
      username: "clientUser",
      email: "client@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "client",
      client: { id: 2, phone: 123456789 },
    });

    await controller.registerClient(request, reply as unknown as FastifyReply);

    expect(reply.statusCode).toBe(201);
    expect((reply.body as Record<string, unknown>).message).toBe("Client created");
    expect(reply.cookies.length).toBe(1);
  });

  it("registerClient: should return 400 if fields missing", async () => {
    const request: FastifyRequest = {
      body: { username: "", email: "", password: "" },
    } as unknown as FastifyRequest;

    await controller.registerClient(request, reply as unknown as FastifyReply);

    expect(reply.statusCode).toBe(400);
    expect((reply.body as Record<string, string>).message).toBe("All fields required");
  });

  // ---------- REGISTER SELLER ----------
  it("registerSeller: should create a seller user", async () => {
    const request: FastifyRequest = {
      body: {
        username: "sellerUser",
        email: "seller@example.com",
        password: "password123",
        phone: "0606060606",
        description: "Vendeur de produits",
        address_id: 1,
        tax_id: 123456,
        bank_account: "FR123",
        bank_account_bic: "BIC123",
        image: "test.png",
      },
    } as unknown as FastifyRequest;

    prismaMock.users.create.mockResolvedValue({
      id: 3,
      username: "sellerUser",
      email: "seller@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "seller",
      seller: { id: 3, phone: "0606060606" },
    });

    await controller.registerSeller(request, reply as unknown as FastifyReply);

    expect(reply.statusCode).toBe(201);
    expect((reply.body as Record<string, unknown>).message).toBe("Seller created");
    expect(reply.cookies.length).toBe(1);
  });

  // ---------- LOGIN ----------
  it("login: should login user with correct credentials", async () => {
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });

    const request: FastifyRequest = {
      body: { email: "john@example.com", password: "password123" },
    } as unknown as FastifyRequest;

    await controller.login(request, reply as unknown as FastifyReply);

    const response = reply.body as UserResponse;

    expect(reply.statusCode).toBe(200);
    expect(response.user.username).toBe("john");
    expect(reply.cookies.length).toBe(1);
  });

  it("login: should return 401 for wrong password", async () => {
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });

    const request: FastifyRequest = {
      body: { email: "john@example.com", password: "wrongpass" },
    } as unknown as FastifyRequest;

    await controller.login(request, reply as unknown as FastifyReply);

    expect(reply.statusCode).toBe(401);
    expect((reply.body as Record<string, string>).message).toBe("Invalid password");
  });

  // ---------- UPDATE ----------
  it("update: should update user", async () => {
    prismaMock.users.update.mockResolvedValue({
      id: 1,
      username: "johnny",
      email: "john@example.com",
      password: "newpass",
    });

    const request: FastifyRequest = {
      body: { id: 1, username: "johnny", email: "john@example.com", password: "newpass" },
    } as unknown as FastifyRequest;

    await controller.update(request, reply as unknown as FastifyReply);

    expect(reply.body).toBeNull();
  });

  // ---------- DELETE ----------
  it("delete: should delete user", async () => {
    prismaMock.users.delete.mockResolvedValue({
      id: 1,
      username: "john",
      email: "john@example.com",
      password: hashedPassword,
    });

    const request: FastifyRequest = {
      body: { email: "john@example.com" },
    } as unknown as FastifyRequest;

    await controller.delete(request, reply as unknown as FastifyReply);

    expect(reply.body).toBeNull();
  });
});
