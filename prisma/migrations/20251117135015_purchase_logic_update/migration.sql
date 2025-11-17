/*
  Warnings:

  - You are about to drop the column `cart_id` on the `Purchase` table. All the data in the column will be lost.
  - The `tax_id` column on the `Sellers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `product_list` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Purchase" DROP CONSTRAINT "Purchase_cart_id_fkey";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "cart_id",
ADD COLUMN     "product_list" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Sellers" DROP COLUMN "tax_id",
ADD COLUMN     "tax_id" INTEGER;
