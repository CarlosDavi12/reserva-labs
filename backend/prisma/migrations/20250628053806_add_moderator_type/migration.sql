-- CreateEnum
CREATE TYPE "ModeratorType" AS ENUM ('COORDINATOR', 'MONITOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "moderatorType" "ModeratorType";
