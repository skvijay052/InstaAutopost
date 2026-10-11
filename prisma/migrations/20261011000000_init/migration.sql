-- Initial schema for Instagram Autopost.
CREATE TYPE "AutomationStatus" AS ENUM ('PAUSED', 'ACTIVE');
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PROCESSING', 'PUBLISHED', 'FAILED', 'CANCELLED');
CREATE TYPE "ReplyStatus" AS ENUM ('RECEIVED', 'QUEUED', 'REPLIED', 'SKIPPED', 'FAILED');

CREATE TABLE "InstagramAccount" (
  "id" TEXT NOT NULL,
  "instagramBusinessId" TEXT NOT NULL,
  "username" TEXT,
  "encryptedAccessToken" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "automationStatus" "AutomationStatus" NOT NULL DEFAULT 'PAUSED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstagramAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledPost" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "caption" TEXT NOT NULL,
  "mediaUrl" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "instagramMediaId" TEXT,
  "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramComment" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "instagramCommentId" TEXT NOT NULL,
  "instagramMediaId" TEXT NOT NULL,
  "authorId" TEXT,
  "text" TEXT NOT NULL,
  "replyText" TEXT,
  "instagramReplyId" TEXT,
  "status" "ReplyStatus" NOT NULL DEFAULT 'RECEIVED',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repliedAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "InstagramComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstagramMessage" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "instagramMessageId" TEXT NOT NULL,
  "conversationId" TEXT,
  "senderId" TEXT,
  "text" TEXT NOT NULL,
  "replyText" TEXT,
  "status" "ReplyStatus" NOT NULL DEFAULT 'RECEIVED',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repliedAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "InstagramMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "accountId" TEXT,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationLog" (
  "id" TEXT NOT NULL,
  "accountId" TEXT,
  "action" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstagramAccount_instagramBusinessId_key" ON "InstagramAccount"("instagramBusinessId");
CREATE UNIQUE INDEX "ScheduledPost_instagramMediaId_key" ON "ScheduledPost"("instagramMediaId");
CREATE INDEX "ScheduledPost_accountId_status_scheduledAt_idx" ON "ScheduledPost"("accountId", "status", "scheduledAt");
CREATE UNIQUE INDEX "InstagramComment_instagramCommentId_key" ON "InstagramComment"("instagramCommentId");
CREATE UNIQUE INDEX "InstagramComment_instagramReplyId_key" ON "InstagramComment"("instagramReplyId");
CREATE INDEX "InstagramComment_accountId_status_receivedAt_idx" ON "InstagramComment"("accountId", "status", "receivedAt");
CREATE UNIQUE INDEX "InstagramMessage_instagramMessageId_key" ON "InstagramMessage"("instagramMessageId");
CREATE INDEX "InstagramMessage_accountId_status_receivedAt_idx" ON "InstagramMessage"("accountId", "status", "receivedAt");
CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON "WebhookEvent"("providerEventId");
CREATE INDEX "WebhookEvent_processedAt_createdAt_idx" ON "WebhookEvent"("processedAt", "createdAt");
CREATE INDEX "AutomationLog_accountId_createdAt_idx" ON "AutomationLog"("accountId", "createdAt");

ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramComment" ADD CONSTRAINT "InstagramComment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstagramMessage" ADD CONSTRAINT "InstagramMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
