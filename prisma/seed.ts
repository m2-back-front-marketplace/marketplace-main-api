import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // 1. Create 5 categories
  await prisma.category.createMany({
    data: [
      { name: "Electronics" },
      { name: "Books" },
      { name: "Clothing" },
      { name: "Home" },
      { name: "Sports" },
    ],
    skipDuplicates: true,
  });
  console.log("Created 5 categories");

  const allCategories = await prisma.category.findMany();

  // 2. Create users (client and seller)
  const clientPassword = await bcrypt.hash("password123", 10);
  const client = await prisma.users.create({
    data: {
      username: "testclient",
      email: "client@test.com",
      password: clientPassword,
      role: "client",
      client: {
        create: {},
      },
    },
  });
  console.log("Created client user");

  const sellerPassword = await bcrypt.hash("password123", 10);
  const seller = await prisma.users.create({
    data: {
      username: "testseller",
      email: "seller@test.com",
      password: sellerPassword,
      role: "seller",
      seller: {
        create: {},
      },
    },
  });
  console.log("Created seller user");

  // 3. Create 10 products
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.products.create({
      data: {
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: parseFloat((Math.random() * 100).toFixed(2)),
        quantity: Math.floor(Math.random() * 100),
        seller_id: seller.id,
      },
    });

    // Assign 1 to 3 random categories to the product
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const selectedCategories = allCategories
      .sort(() => 0.5 - Math.random())
      .slice(0, numCategories);

    await prisma.products_category.createMany({
      data: selectedCategories.map((cat) => ({
        product_id: product.id,
        category_id: cat.id,
      })),
      skipDuplicates: true,
    });
    console.log(`Created product ${i} and assigned categories`);
  }

  console.log("Creating a cart for the client...");

  const allProducts = await prisma.products.findMany();
  const productsForCart = allProducts.sort(() => 0.5 - Math.random()).slice(0, 3);

  for (const product of productsForCart) {
    const productItem = await prisma.product_item.create({
      data: {
        product_id: product.id,
        quantity: Math.floor(Math.random() * 5) + 1,
      },
    });

    await prisma.cart.create({
      data: {
        client_id: client.id,
        product_item_id: productItem.id,
      },
    });
  }

  console.log("Client's cart created with 3 products.");

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
