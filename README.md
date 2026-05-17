# Kendra Braun

Next 16 app for Kendra Braun's voice acting portfolio, reels, studio specs, and booking flow.

## Development

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tuturuuu CMS

The public site can render from Tuturuuu CMS delivery and falls back to the static content in `app/content.ts` when CMS delivery is unavailable or not configured.

Required admin/sync environment:

```bash
TUTURUUU_API_BASE_URL=https://tuturuuu.com/api/v1
TUTURUUU_KENDRA_WORKSPACE_ID=...
KENDRA_APP_ID=kendra
KENDRA_APP_SECRET=...
KENDRA_SESSION_SECRET=...
KENDRA_APP_URL=https://...
TUTURUUU_WEB_APP_URL=https://tuturuuu.com
TUTURUUU_CMS_APP_URL=https://cms.tuturuuu.com
```

Local development can use the platform defaults when `DEV_MODE=true`:

```bash
TUTURUUU_API_BASE_URL=http://localhost:7803/api/v1
TUTURUUU_WEB_APP_URL=http://localhost:7803
TUTURUUU_CMS_APP_URL=http://localhost:7811
```

Admin entrypoints:

- `/admin/login`: centralized Tuturuuu login.
- `/verify-token`: receives the app token and stores the encrypted Kendra admin session.
- `/admin`: sync dashboard for the local external-project manifest.
- `/voice-over`: audio-first public route backed by CMS delivery.

The local manifest lives in `lib/kendra-external-project-manifest.ts` and seeds the interactive reel from `public/audios/kendra-braun-interactive.mp3`.

## Verification

```bash
bun test lib/kendra-content.test.ts lib/kendra-external-project-manifest.test.ts app/api/auth/verify-app-token/route.test.ts
bun run lint
bun run build
```
