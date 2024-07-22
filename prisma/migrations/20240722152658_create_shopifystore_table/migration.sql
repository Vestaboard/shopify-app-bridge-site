-- CreateTable
CREATE TABLE `ShopifyStore` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `authToken` VARCHAR(191) NOT NULL,
    `isAuthorized` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
