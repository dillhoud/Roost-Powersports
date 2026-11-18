-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('new', 'ok', 'changed', 'error');

-- CreateTable
CREATE TABLE "OfferSource" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "SourceStatus" NOT NULL DEFAULT 'new',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "text" TEXT,
    "previousText" TEXT,
    "hash" TEXT,
    "httpStatus" INTEGER,
    "error" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastChangedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferSource_make_idx" ON "OfferSource"("make");

