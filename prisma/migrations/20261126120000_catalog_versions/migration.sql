-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "CatalogVersion" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'snowmobile',
    "version" TEXT NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'draft',
    "data" JSONB NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "CatalogVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogVersion_kind_status_idx" ON "CatalogVersion"("kind", "status");

