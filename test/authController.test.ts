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
    prismaMock._reset();
    hashedPassword = await bcrypt.hash("password123", 10);

    reply = {
      statusCode: 0,
      cookies: [],
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(obj: any) {
        this.body = obj;
        return this;
      },
      setCookie(name: string, value: string, options: any) {
        this.cookies.push({ name, value, options });
      },
    };
  });

  afterEach(() => prismaMock._reset());

  // ---------- REGISTER CLIENT ----------
  it("registerClient: should create a client user", async () => {
    const request = {
      body: {
        username: "clientUser",
        email: "client@example.com",
        password: "password123",
        phone: 123456789,
        address_id: 1,
      },
    };

    prismaMock.users.findUnique.mockResolvedValue(null);
    prismaMock.users.create.mockResolvedValue({
      id: 1,
      username: "clientUser",
      email: "client@example.com",
      password: hashedPassword,
      role: "client",
      client: {
        id: 1,
        phone: 123456789,
        address_id: 1,
      },
    });

    await controller.registerClient(request as any, reply as any);

    expect(reply.statusCode).toBe(201);
    expect(reply.body.message).toBe("Client created");
    expect(reply.body.user.role).toBe("client");
    expect(reply.cookies.length).toBe(1);
  });

  // ---------- REGISTER SELLER ----------
  it("registerSeller: should create a seller user", async () => {
    const request = {
      body: {
        username: "sellerUser",
        email: "seller@example.com",
        password: "password123",
        phone: "0600000000",
        description: "Top seller",
        address_id: 2,
        tax_id: 12345,
        bank_account: "FR123",
        bank_account_bic: "BIC123",
        image: "seller.png",
      },
    };

    prismaMock.users.findUnique.mockResolvedValue(null);
    prismaMock.users.create.mockResolvedValue({
      id: 2,
      username: "sellerUser",
      email: "seller@example.com",
      password: hashedPassword,
      role: "seller",
      seller: {
        id: 2,
        phone: "0600000000",
        description: "Top seller",
        address_id: 2,
      },
    });

    await controller.registerSeller(request as any, reply as any);

    expect(reply.statusCode).toBe(201);
    expect(reply.body.message).toBe("Seller created");
    expect(reply.body.user.role).toBe("seller");
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

    const request = {
      body: { id: 1, username: "johnny", email: "john@example.com", password: "newpass" },
    };
    await controller.update(request as any, reply as any);

    expect(reply.statusCode).not.toBe(500);
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

    expect(reply.statusCode).not.toBe(500);
  });
});
