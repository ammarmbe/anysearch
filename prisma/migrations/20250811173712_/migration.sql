/*
  Warnings:

  - You are about to drop the column `userId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "userId",
ADD COLUMN     "githubAccessToken" TEXT,
ADD COLUMN     "githubUsername" TEXT,
ADD COLUMN     "gmailAccessToken" TEXT,
ADD COLUMN     "gmailAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "gmailRefreshToken" TEXT,
ADD COLUMN     "gmailRefreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "gmailUsername" TEXT,
ADD COLUMN     "googleDriveAccessToken" TEXT,
ADD COLUMN     "googleDriveAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "googleDriveRefreshToken" TEXT,
ADD COLUMN     "googleDriveRefreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "googleDriveUsername" TEXT,
ADD COLUMN     "notionAccessToken" TEXT,
ADD COLUMN     "notionUsername" TEXT;

-- DropTable
DROP TABLE "public"."User";
