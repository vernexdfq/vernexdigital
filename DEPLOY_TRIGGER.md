# Deploy trigger

Last redeploy requested: 2026-09-29

Build command (Cloudflare):
```
npx opennextjs-cloudflare build
```

Deploy command:
```
npx wrangler deploy
```

Required variables (Build + Runtime):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (secret, Runtime)
