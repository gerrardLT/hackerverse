-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hackathon_schema";

-- CreateTable
CREATE TABLE "hackathon_schema"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "walletAddress" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "ipfsProfileHash" TEXT,
    "socialLinks" JSONB,
    "privacySettings" JSONB NOT NULL DEFAULT '{}',
    "notificationSettings" JSONB NOT NULL DEFAULT '{}',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastBlockNumber" BIGINT,
    "lastGasUsed" BIGINT,
    "lastTxHash" TEXT,
    "profileSyncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "encryptedProfile" JSONB,
    "publicKey" TEXT,
    "dataConsent" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_schema"."hackathons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationDeadline" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "prizePool" DECIMAL(15,2),
    "categories" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "requirements" TEXT,
    "rules" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organizerId" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "metadata" JSONB,
    "prizes" JSONB,
    "tracks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blockNumber" BIGINT,
    "contractId" INTEGER,
    "gasUsed" BIGINT,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,

    CONSTRAINT "hackathons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_schema"."projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hackathonId" TEXT NOT NULL,
    "teamId" TEXT,
    "creatorId" TEXT NOT NULL,
    "technologies" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "githubUrl" TEXT,
    "demoUrl" TEXT,
    "videoUrl" TEXT,
    "presentationUrl" TEXT,
    "ipfsHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blockNumber" BIGINT,
    "contractId" INTEGER,
    "gasUsed" BIGINT,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_schema"."teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hackathonId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 5,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Continue with all other tables...
-- CreateTable for team_members, participations, judges, scores, feedback, etc.

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "hackathon_schema"."users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "hackathon_schema"."users"("username");
CREATE UNIQUE INDEX "users_walletAddress_key" ON "hackathon_schema"."users"("walletAddress");

-- Add all foreign key constraints
ALTER TABLE "hackathon_schema"."hackathons" ADD CONSTRAINT "hackathons_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "hackathon_schema"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hackathon_schema"."projects" ADD CONSTRAINT "projects_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "hackathon_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hackathon_schema"."projects" ADD CONSTRAINT "projects_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "hackathon_schema"."hackathons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hackathon_schema"."projects" ADD CONSTRAINT "projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "hackathon_schema"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add remaining foreign keys...