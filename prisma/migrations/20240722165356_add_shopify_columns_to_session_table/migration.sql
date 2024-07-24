-- AlterTable
ALTER TABLE `Session` ADD COLUMN `accountOwner` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `collaborator` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `emailVerified` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `firstName` VARCHAR(191) NULL,
    ADD COLUMN `lastName` VARCHAR(191) NULL,
    ADD COLUMN `locale` VARCHAR(191) NULL;
