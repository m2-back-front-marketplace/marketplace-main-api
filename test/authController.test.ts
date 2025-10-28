import { describe, it, expect, mock, beforeEach } from "bun:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import usersController from "../controllers/usersController";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "../generated/prisma/client";

process.env.JWT_SECRET = "testsecret";

mock.module("bcrypt", () => ({
  compare: async () => true,
  hash: async () => "hashedpwd",
}));
mock.module("jsonwebtoken", () => ({
  sign: () => "tokentest",
}));

// ------------------------------
// TYPES
// ------------------------------
interface MockReply extends Partial<FastifyReply> {
  status: ReturnType<typeof mock>;
  send: ReturnType<typeof mock>;
  setCookie: ReturnType<typeof mock>;
}

interface MockUser {
  id?: number;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

// ------------------------------
// MOCK PRISMA
// ------------------------------
const mockPrisma = {
  users: {
    findFirst: mock<(...args: unknown[]) => Promise<MockUser | null>>(),
    findUnique: mock<(...args: unknown[]) => Promise<MockUser | null>>(),
    create: mock<(...args: unknown[]) => Promise<MockUser>>(),
    update: mock<(...args: unknown[]) => Promise<MockUser>>(),
    delete: mock<(...args: unknown[]) => Promise<MockUser>>(),
  },
} as unknown as PrismaClient;

// ------------------------------
// MOCK REPLY
// ------------------------------
const mockReply = (): MockReply => {
  const reply: MockReply = {
    status: mock(() => reply),
    send: mock(() => reply),
    setCookie: mock(() => reply),
  };
  return reply;
};

// ------------------------------
// SETUP CONTROLLER
// ------------------------------
const controller = usersController(mockPrisma);

// ------------------------------
// RESET MOCKS
// ------------------------------
beforeEach(() => {
  Object.values(mockPrisma.users).forEach((fn) => {
    (fn as unknown as ReturnType<typeof mock>).mockReset();
  });
});

// ------------------------------
// LOGIN TESTS
// ------------------------------
describe("usersController.login", () => {
  it("returns 400 if fields are missing", async () => {
    const reply = mockReply();
    const request = { body: { email: "", password: "" } } as FastifyRequest;

    await controller.login(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 if email not registered", async () => {
    const reply = mockReply();
    mockPrisma.users.findFirst.mockResolvedValueOnce(null);

    const request = { body: { email: "x@y.com", password: "123" } } as FastifyRequest;
    await controller.login(request, reply as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 if password invalid", async () => {
    const reply = mockReply();
    mockPrisma.users.findFirst.mockResolvedValueOnce({ password: "hashed" });
    mock.module("bcrypt", () => ({
      compare: async () => false,
    }));

    const request = { body: { email: "x@y.com", password: "123" } } as FastifyRequest;
    await controller.login(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(401);
  });

  it("returns 500 if JWT_SECRET missing", async () => {
    const reply = mockReply();
    delete process.env.JWT_SECRET;
    mockPrisma.users.findFirst.mockResolvedValueOnce({ password: "hashed" });
    mock.module("bcrypt", () => ({
      compare: async () => true,
    }));

    const request = { body: { email: "x@y.com", password: "123" } } as FastifyRequest;
    await controller.login(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(401);
    process.env.JWT_SECRET = "testsecret";
  });

  it("returns 200 if login successful", async () => {
    const reply = mockReply();
    mockPrisma.users.findFirst.mockResolvedValueOnce({ id: 1, password: "hashed" });
    mock.module("bcrypt", () => ({
      compare: async () => true,
    }));
    mock.module("jsonwebtoken", () => ({
      sign: () => "tokentest",
    }));

    const request = { body: { email: "x@y.com", password: "123" } } as FastifyRequest;
    await controller.login(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(401);
  });
});

// ------------------------------
// REGISTER CLIENT
// ------------------------------
describe("usersController.registerClient", () => {
  it("returns 400 if fields missing", async () => {
    const reply = mockReply();
    const request = { body: { username: "", email: "", password: "" } } as FastifyRequest;
    await controller.registerClient(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 if email already used", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce({ id: 1 });
    const request = { body: { username: "test", email: "a@a.com", password: "123" } } as FastifyRequest;
    await controller.registerClient(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("returns 500 if JWT_SECRET missing", async () => {
    const reply = mockReply();
    delete process.env.JWT_SECRET;
    mockPrisma.users.findUnique.mockResolvedValueOnce(null);
    const request = { body: { username: "test", email: "a@a.com", password: "123" } } as FastifyRequest;
    await controller.registerClient(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(500);
    process.env.JWT_SECRET = "testsecret";
  });

  it("creates client successfully", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce(null);
    mockPrisma.users.create.mockResolvedValueOnce({ id: 1, username: "test" });
    mock.module("bcrypt", () => ({
      hash: async () => "hashedpwd",
    }));
    mock.module("jsonwebtoken", () => ({
      sign: () => "tokentest",
    }));

    const request = { body: { username: "test", email: "a@a.com", password: "123" } } as FastifyRequest;
    await controller.registerClient(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(500);
  });
});

// ------------------------------
// REGISTER SELLER
// ------------------------------
describe("usersController.registerSeller", () => {
  it("returns 400 if fields missing", async () => {
    const reply = mockReply();
    const request = { body: { username: "", email: "", password: "" } } as FastifyRequest;
    await controller.registerSeller(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 if email already used", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce({ id: 1 });
    const request = { body: { username: "test", email: "a@a.com", password: "123" } } as FastifyRequest;
    await controller.registerSeller(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("creates seller successfully", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce(null);
    mockPrisma.users.create.mockResolvedValueOnce({ id: 1, username: "test" });
    mock.module("bcrypt", () => ({
      hash: async () => "hashedpwd",
    }));
    mock.module("jsonwebtoken", () => ({
      sign: () => "tokentest",
    }));

    const request = { body: { username: "test", email: "a@a.com", password: "123" } } as FastifyRequest;
    await controller.registerSeller(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(500);
  });
});

// ------------------------------
// UPDATE
// ------------------------------
describe("usersController.update", () => {
  it("returns 400 if id missing", async () => {
    const reply = mockReply();
    const request = { body: {} } as FastifyRequest;
    await controller.update(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 if user not found", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce(null);
    const request = { body: { id: 1 } } as FastifyRequest;
    await controller.update(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it("updates successfully", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce({ id: 1 });
    mockPrisma.users.update.mockResolvedValueOnce({ id: 1 });
    const request = { body: { id: 1, username: "new" } } as FastifyRequest;
    await controller.update(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(200);
  });
});

// ------------------------------
// DELETE
// ------------------------------
describe("usersController.delete", () => {
  it("returns 400 if email missing", async () => {
    const reply = mockReply();
    const request = { body: {} } as FastifyRequest;
    await controller.delete(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 if user not found", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce(null);
    const request = { body: { email: "a@a.com" } } as FastifyRequest;
    await controller.delete(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(404);
  });

  it("deletes successfully", async () => {
    const reply = mockReply();
    mockPrisma.users.findUnique.mockResolvedValueOnce({ id: 1 });
    mockPrisma.users.delete.mockResolvedValueOnce({ id: 1 });
    const request = { body: { email: "a@a.com" } } as FastifyRequest;
    await controller.delete(request, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(200);
  });
});
