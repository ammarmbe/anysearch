/*
  Warnings:

  - You are about to drop the column `google` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleAccessTokenExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshTokenExpiresAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "google",
DROP COLUMN "googleAccessToken",
DROP COLUMN "googleAccessTokenExpiresAt",
DROP COLUMN "googleId",
DROP COLUMN "googleName",
DROP COLUMN "googleRefreshToken",
DROP COLUMN "googleRefreshTokenExpiresAt",
ADD COLUMN     "gmailAccessToken" TEXT,
ADD COLUMN     "gmailAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "gmailId" TEXT,
ADD COLUMN     "gmailName" TEXT,
ADD COLUMN     "gmailRefreshToken" TEXT,
ADD COLUMN     "gmailRefreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "googleDrive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleDriveAccessToken" TEXT,
ADD COLUMN     "googleDriveAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "googleDriveId" TEXT,
ADD COLUMN     "googleDriveName" TEXT,
ADD COLUMN     "googleDriveRefreshToken" TEXT,
ADD COLUMN     "googleDriveRefreshTokenExpiresAt" TIMESTAMP(3);
