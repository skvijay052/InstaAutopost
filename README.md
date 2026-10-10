# InstaAutopost

A TypeScript/Next.js starter for an Instagram Business automation dashboard and MCP server.

## Current status

This repository starts in **safe setup mode**:
- Health endpoint for deployment checks
- MCP tools for status and pausing automation
- Prisma schema for accounts, posts, comments, messages, and audit logs
- No Instagram API calls are enabled yet
- No posts, comments, or DMs are sent automatically by this starter

## Requirements

- Node.js LTS
- npm
- PostgreSQL (Neon or another managed PostgreSQL provider)
- Meta developer app and an Instagram Business account for later integration

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/api/health.

Configure `DATABASE_URL` before running Prisma migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Environment variables

See `.env.example`. Never commit real credentials, access tokens, or secrets.

## Planned milestones

1. Project scaffold and health endpoint
2. PostgreSQL persistence
3. Meta OAuth and token storage
4. Instagram publishing and webhook verification
5. Comment and messaging automation with rate limits and audit logs
6. Vercel deployment, cron processing, and MCP client connection

## Safety

Use Meta's official APIs and follow their permissions, review, messaging-window, publishing, and rate-limit requirements. The initial scaffold does not automate comments on unrelated accounts or bypass platform restrictions.
