# InstaAutopost

A TypeScript/Next.js starter for an Instagram Business automation dashboard and MCP server.

## Current status

- Health endpoint and starter dashboard
- MCP tools for status and setup checks
- Prisma schema for accounts, posts, comments, messages, and audit logs
- Instagram Business Login OAuth start and callback routes
- OAuth state validation and server-side short-lived-to-long-lived token exchange
- Long-lived token encrypted with AES-256-GCM before PostgreSQL persistence
- Automation remains paused after account connection
- Publishing, comment replies, messaging automation, and webhooks are not implemented yet

## Requirements

- Node.js LTS (20+)
- npm
- PostgreSQL (Neon or another managed PostgreSQL provider)
- Meta developer app with Instagram API setup using Instagram Login

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

## Required Vercel environment variables

Set these for **Production** (and Preview if needed), then redeploy:

- `DATABASE_URL`: PostgreSQL connection string
- `META_APP_ID`: Instagram App ID shown under Instagram API setup with Instagram Login
- `META_APP_SECRET`: matching Instagram App Secret; keep private
- `META_REDIRECT_URI`: exactly `https://insta-autopost-kappa.vercel.app/api/auth/instagram/callback`
- `TOKEN_ENCRYPTION_KEY`: 64 hexadecimal characters (32 random bytes); generate with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`

Never commit actual credentials, access tokens, encryption keys, or database passwords. Do not paste them into chat.

## Connect Instagram

1. Add the exact callback URL above to the Meta app's Instagram Business Login redirect URI allowlist.
2. Configure the environment variables in Vercel and redeploy.
3. Apply the Prisma schema to your PostgreSQL database using your normal migration workflow.
4. Open `https://insta-autopost-kappa.vercel.app/api/auth/instagram/start` and approve the requested permissions.
5. The callback returns to the homepage with `instagram_login=connected` after the token is saved. The token is encrypted at rest and automation stays paused.

The requested scopes are `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, and `instagram_business_manage_messages`. Meta may require app roles/tester access while the app is in Development mode and App Review/advanced access before use by other accounts.

## Environment variables

See `.env.example`. Never commit real credentials, access tokens, or secrets.

## Safety and limitations

Only official Meta APIs are intended. OAuth tokens are not returned to the browser or written to logs. The database stores an AES-256-GCM encrypted token. Keep automation paused until publishing/reply flows, permissions, webhook verification, and audit logging are implemented and tested. This commit does not yet publish posts or automatically reply to comments/DMs.
