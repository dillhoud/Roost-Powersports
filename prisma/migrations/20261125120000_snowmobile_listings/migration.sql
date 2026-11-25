-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('active', 'pending', 'sold', 'expired');

-- CreateEnum
CREATE TYPE "Verification" AS ENUM ('verified', 'partially_verified', 'unverified');

-- CreateTable
CREATE TABLE "SnowmobileListing" (
    "id" TEXT NOT NULL,
    "catalogVersion" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "family" TEXT,
    "trim" TEXT,
    "package" TEXT,
    "title" TEXT NOT NULL,
    "verification" "Verification" NOT NULL DEFAULT 'unverified',
    "identity" JSONB NOT NULL,
    "equipment" JSONB NOT NULL,
    "aftermarket" JSONB NOT NULL,
    "vin" TEXT,
    "price" INTEGER NOT NULL,
    "priceType" TEXT NOT NULL DEFAULT 'negotiable',
    "km" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "titleStatus" TEXT NOT NULL DEFAULT 'Clean',
    "owners" INTEGER NOT NULL DEFAULT 1,
    "serviceRecords" TEXT NOT NULL DEFAULT 'none',
    "colour" TEXT NOT NULL DEFAULT '',
    "financing" BOOLEAN NOT NULL DEFAULT false,
    "delivery" BOOLEAN NOT NULL DEFAULT false,
    "dealer" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SnowmobileListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SnowmobileListing_status_idx" ON "SnowmobileListing"("status");

