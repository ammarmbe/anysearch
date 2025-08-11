-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "googleAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleRefreshTokenExpiresAt" TIMESTAMP(3);
