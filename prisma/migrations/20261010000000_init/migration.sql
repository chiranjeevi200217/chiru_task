-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('FOUNDER', 'C_LEVEL', 'VP_DIRECTOR', 'GENERIC_INBOX', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('VALID', 'INVALID', 'RISKY', 'UNCHECKED');

-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('ONLINE', 'REDIRECT', 'UNREACHABLE', 'TIMEOUT', 'UNCHECKED');

-- CreateEnum
CREATE TYPE "MergeStatus" AS ENUM ('ORIGINAL', 'MERGED', 'DUPLICATE_DISMISSED');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "normalizedDomain" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "estimatedTeamSize" INTEGER NOT NULL,
    "foundedYear" INTEGER NOT NULL,
    "companyAge" INTEGER NOT NULL,
    "estimatedArrMin" DOUBLE PRECISION,
    "estimatedArrMax" DOUBLE PRECISION,
    "arrHintString" TEXT,
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactName" TEXT,
    "contactTitle" TEXT,
    "contactEmail" TEXT,
    "contactType" "ContactType" NOT NULL DEFAULT 'UNKNOWN',
    "emailStatus" "ValidationStatus" NOT NULL DEFAULT 'UNCHECKED',
    "mxValid" BOOLEAN DEFAULT false,
    "websiteStatus" "WebsiteStatus" NOT NULL DEFAULT 'UNCHECKED',
    "httpStatusCode" INTEGER,
    "sslValid" BOOLEAN DEFAULT true,
    "responseTimeMs" INTEGER,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreBreakdown" JSONB,
    "aiExplanation" TEXT,
    "duplicateOfId" TEXT,
    "mergeStatus" "MergeStatus" NOT NULL DEFAULT 'ORIGINAL',
    "mergeConfidence" DOUBLE PRECISION,
    "mergeRationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringWeightConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "categoryWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "teamSizeWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "companyAgeWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "revenueWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "contactWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "healthTechWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringWeightConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filtersJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_domain_key" ON "Lead"("domain");

-- CreateIndex
CREATE INDEX "Lead_overallScore_idx" ON "Lead"("overallScore");

-- CreateIndex
CREATE INDEX "Lead_category_idx" ON "Lead"("category");

-- CreateIndex
CREATE INDEX "Lead_normalizedDomain_idx" ON "Lead"("normalizedDomain");

-- CreateIndex
CREATE INDEX "Lead_normalizedName_idx" ON "Lead"("normalizedName");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
