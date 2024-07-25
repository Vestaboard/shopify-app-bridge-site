/*
  Warnings:

  - The primary key for the `ShopifyStore` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ShopifyStore` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ShopifyStore` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`shop`);
