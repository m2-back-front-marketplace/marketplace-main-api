import { PrismaClient } from "../generated/prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Create Users: 1 Client, 1 Seller
  const clientUser = await prisma.users.create({
    data: {
      username: "client_user",
      email: "client@example.com",
      password: "password123", // In a real app, hash this!
      role: "CLIENT",
      client: {
        create: {
          phone: "123456456",
        },
      },
    },
  });

  const sellerUser = await prisma.users.create({
    data: {
      username: "seller_user",
      email: "seller@example.com",
      password: "password123",
      role: "SELLER",
      seller: {
        create: {
          phone: "123456789",
          description: faker.company.catchPhrase(),
        },
      },
    },
  });
  console.log("Created client and seller users.");

  // Create Categories
  const categories = [];
  for (let i = 0; i < 5; i++) {
    const category = await prisma.category.create({
      data: {
        name: faker.commerce.department(),
      },
    });
    categories.push(category);
  }
  console.log("Created 5 categories.");

  // Create Products
  const products = [];
  for (let i = 0; i < 10; i++) {
    const product = await prisma.products.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        quantity: faker.number.int({ min: 10, max: 100 }),
        seller_id: sellerUser.id,
        categories: {
          create: {
            category_id: categories[i % categories.length].id,
          },
        },
      },
    });
    products.push(product);
  }
  console.log("Created 10 products.");

  // Create a Cart for the client with 3 products
  await prisma.cart.create({
    data: {
      client_id: clientUser.id,
      items: {
        create: [
          { product_id: products[0].id, quantity: 2 },
          { product_id: products[1].id, quantity: 1 },
          { product_id: products[2].id, quantity: 5 },
        ],
      },
    },
  });
  console.log("Created a cart for the client with 3 items.");

  // Create Purchases
  // 1. A "COMPLETED" purchase
  await prisma.purchase.create({
    data: {
      client_id: clientUser.id,
      status: "COMPLETED",
      total: products[3].price * 1 + products[4].price * 3,
      items: {
        create: [
          {
            product_id: products[3].id,
            quantity: 1,
            price: products[3].price,
          },
          {
            product_id: products[4].id,
            quantity: 3,
            price: products[4].price,
          },
        ],
      },
    },
  });

  // 2. A "PENDING" purchase
  await prisma.purchase.create({
    data: {
      client_id: clientUser.id,
      status: "PENDING",
      total: products[5].price * 2,
      items: {
        create: [
          {
            product_id: products[5].id,
            quantity: 2,
            price: products[5].price,
          },
        ],
      },
    },
  });
  console.log("Created 2 purchases (1 COMPLETED, 1 PENDING).");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
