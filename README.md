# Vernex Digital

White-label customer panel (Next.js + Supabase).

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript
- Supabase

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **`vernexdfq/vernexdigital`**
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (default)
5. Build command: `npm run build` (default)
6. Output: Next.js default
7. Add **Environment Variables** (Production + Preview):

| Key | Notes |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (no `/rest/v1`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never `NEXT_PUBLIC_` |

8. Deploy

Node **≥ 20** is required (`engines` in `package.json`).

### After first deploy

- Settings → Domains → add your domain if needed
- Redeploy after any env change

## Docs

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) for product scope.

---

*Powered by Verxor*
