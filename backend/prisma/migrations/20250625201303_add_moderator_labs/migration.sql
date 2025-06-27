-- CreateTable
CREATE TABLE "ModeratorLab" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeratorLab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModeratorLab_userId_labId_key" ON "ModeratorLab"("userId", "labId");

-- AddForeignKey
ALTER TABLE "ModeratorLab" ADD CONSTRAINT "ModeratorLab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeratorLab" ADD CONSTRAINT "ModeratorLab_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
