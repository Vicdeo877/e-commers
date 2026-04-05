# BlissFruitz (Next.js)

Storefront and admin panel. Requires **Node.js 18+** (20 LTS recommended).

## Local development

```bash
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to match how you open the app (localhost vs 127.0.0.1).

npm install
npm run db:setup
npm run dev
```

Open the URL shown in the terminal (default [http://localhost:3000](http://localhost:3000)).

## Production deploy

1. **Environment** — Set variables from `.env.example` on your host (panel or `.env.production`). Use your real public `NEXT_PUBLIC_API_URL` (https, no trailing slash). Configure OAuth redirect URIs in Google Cloud for that exact origin.

2. **Database** — Point `DATABASE_URL` at a persistent database. For SQLite on a VPS, use an absolute path or a mounted volume so `prisma/dev.db` is not wiped on redeploy.

3. **Build and run**

   ```bash
   npm ci
   npx prisma generate
   npx prisma db push
   npm run build
   NODE_ENV=production npm run start
   ```

   Or use your host’s “build command” / “start command” with the same steps. Ensure the process can write to the SQLite file (or use Postgres/MySQL).

4. **Reverse proxy** — Forward all traffic to the Node process, including `/_next/static/*`. If you use a subdirectory, set `NEXT_PUBLIC_API_URL` and Next `basePath`/`assetPrefix` accordingly.

5. **Secrets** — Never commit `.env`, `.env.local`, or real keys. Rotate any keys that were ever committed to a public repo.

## Useful scripts

| Script        | Purpose                          |
|---------------|----------------------------------|
| `npm run dev` | Development server               |
| `npm run dev:clean` | Delete `.next` / `.next-dev` and start dev (fixes stale cache issues) |
| `npm run build` | Production build                 |
| `npm run start` | Run production build (port `PORT` or 3000) |
| `npm run db:setup` | `prisma db push` + seed      |

## License

Private project.
