/// <reference types="vite/client" />

// Baked in at build time via vite.config.ts's `define` — see there for
// where the value comes from (Vercel's VERCEL_GIT_COMMIT_SHA).
declare const __GIT_COMMIT_SHA__: string
