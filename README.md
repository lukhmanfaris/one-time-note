# Revelio — One Time Note

A self-destructing secret-sharing app built with **Next.js Static Export** and **Cloudflare Pages Functions**.

End-to-end encrypted notes vanish after one read. No account required for basic use; optional accounts unlock extended TTLs and note management.

## Architecture

- **Frontend**: Next.js 14 with `output: 'export'`. Pre-rendered static HTML/JS/CSS is served from Cloudflare Pages.
- **Backend**: Cloudflare Pages Functions (`functions/`) powered by Hono.
- **Storage**:
  - Cloudflare KV for encrypted note payloads (one-time read, TTL expiration).
  - Cloudflare D1 for user accounts and note metadata.
- **Security**:
  - Notes are encrypted in the browser before being sent to the server.
  - Auth uses HTTP-only, SameSite=Strict cookies.
  - In production, cookies use the `__Host-` prefix and `Secure` flag; in development/test they use plain names over HTTP for local compatibility.

## Local Development

### Prerequisites

- Node.js 20+
- A Cloudflare account and [Wrangler](https://developers.cloudflare.com/workers/wrangler/) logged in (`wrangler login`)

### Environment Setup

1. Copy the example files and fill in real values:
   ```bash
   cp .env.local.example .env.local
   cp .dev.vars.example .dev.vars
   ```

2. Edit `.dev.vars` with local secrets:
   ```
   JWT_SECRET="your-local-jwt-secret-minimum-32-characters"
   RESEND_API_KEY="your-local-resend-key"
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Next.js dev server on port 3000:

```bash
npm run dev
```

To test the full stack (frontend + Pages Functions + KV + D1), run the Pages dev server after building:

```bash
npm run build
npm run pages:dev
```

### Database Migrations (Local)

```bash
npm run db:migrate
```

## Testing

```bash
# Unit + integration tests (Node environment)
npm test

# Worker-pool integration tests (Miniflare)
npm run test:workers

# Full suite
npm run test:all
```

## Security Audit

This project uses [`audit-ci`](https://github.com/IBM/audit-ci) instead of raw `npm audit` so non-applicable advisories can be explicitly whitelisted with justification. Dev dependencies are skipped because they do not run in the Cloudflare production runtime.

```bash
npm run audit
```

### Whitelisted Next.js Advisories

The high-severity Next.js advisories below are explicitly allowlisted in `audit-ci.json`:

- `GHSA-36qx-fr4f-26g5|next`
- `GHSA-8h8q-6873-q5fj|next`
- `GHSA-c4j6-fc7j-m34r|next`
- `GHSA-h25m-26qc-wcjf|next`
- `GHSA-q4gf-8mx6-v5v3|next`

**Rationale**: These advisories relate to Next.js server-side attack vectors such as the Image Optimizer, React Server Components, middleware/proxy rewrites, SSR deserialization, and `next/image` disk cache. Because this project is built with `output: 'export'` and deployed as static assets on Cloudflare Pages, the Next.js runtime server is **not present in production**. The only server-side code is Cloudflare Pages Functions (Hono), which do not invoke the vulnerable Next.js server features. Upgrading to a non-vulnerable Next.js release would require a major version bump with breaking changes, while the actual runtime risk is zero.

## Deployment Runbook

> **Security note**: `wrangler.toml` contains Cloudflare resource IDs (KV namespace IDs and D1 database ID). These are not secrets and are safe — and required — to commit for CI/CD. Plaintext secrets such as `JWT_SECRET` and `RESEND_API_KEY` must **never** be committed; they are set via `wrangler pages secret` as shown below.

Run all commands from the project root after `wrangler login`.

### One-time Infrastructure Setup

1. **Create the D1 database**
   ```bash
   wrangler d1 create revelio-db
   ```
   Copy the returned `database_id`.

2. **Create the KV namespaces**
   ```bash
   wrangler kv namespace create NOTES_KV
   wrangler kv namespace create REFRESH_KV
   wrangler kv namespace create RESET_KV
   ```
   Copy each returned `id`.

3. **Update `wrangler.toml`** with the real IDs:
   ```toml
   [[kv_namespaces]]
   binding = "NOTES_KV"
   id = "<NOTES_KV_ID>"

   [[kv_namespaces]]
   binding = "REFRESH_KV"
   id = "<REFRESH_KV_ID>"

   [[kv_namespaces]]
   binding = "RESET_KV"
   id = "<RESET_KV_ID>"

   [[d1_databases]]
   binding = "DB"
   database_name = "revelio-db"
   database_id = "<D1_DATABASE_ID>"
   migrations_dir = "migrations"
   ```

4. **Apply the initial migration to production**
   ```bash
   wrangler d1 migrations apply revelio-db --remote
   ```

5. **Create the Cloudflare Pages project**
   ```bash
   wrangler pages project create revelio
   ```

6. **Set production secrets**
   ```bash
   wrangler pages secret put JWT_SECRET --project revelio
   wrangler pages secret put RESEND_API_KEY --project revelio
   ```
   You will be prompted securely for each value.

### Every Deploy

7. **Build the static export**
   ```bash
   npm run build
   ```

8. **Deploy to Pages**
   ```bash
   wrangler pages deploy dist --project-name revelio
   ```

### Verification

9. **Smoke test the deployment**
   ```bash
   curl https://revelio.pages.dev/api/health
   ```

### Subsequent Deploys

After the one-time setup, deploys are simply:

```bash
npm run build
wrangler pages deploy dist --project-name revelio
```
