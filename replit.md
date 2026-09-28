# AgroAdvisor AI

AgroAdvisor AI helps farmers and agronomists create crop plans, diagnose pest and disease symptoms, and revisit structured agricultural guidance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/agro-advisor run dev` — run the Vite web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` and `GEMINI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the advisory API contract
- `lib/db/src/schema/advisories.ts` — PostgreSQL tables for demo user, advisory requests, and AI responses
- `artifacts/api-server/src/routes/advisor.ts` — crop and pest advisory creation
- `artifacts/api-server/src/routes/history.ts` — dashboard, history, and report detail
- `artifacts/api-server/src/lib/ai.ts` — Gemini structured generation plus safe fallback guidance
- `artifacts/agro-advisor/src/` — responsive React UI and advisory report views

## Architecture decisions

- The first build uses a single demo user ID to keep the product flow usable without adding an auth surface.
- Gemini calls stay server-side and request JSON through `responseSchema`; the browser only receives validated report objects.
- Advisory history is split into request and response tables to match the prompt and keep each generated report queryable.
- When Gemini is unavailable, the server returns deterministic agronomy guidance rather than failing the field workflow completely.

## Product

- Dashboard with new crop planning and pest diagnosis entry points
- Zod-validated crop and pest advisory forms
- Structured crop viability cards, soil preparation tips, diagnoses, IPM actions, and prevention guidance
- Searchable, filterable saved history and full report detail pages
- Mobile-first layout with responsive navigation and API health indicator

## User preferences

No project-specific preferences recorded.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Rebuild shared libraries after schema changes before typechecking the API server.
- The API and web services are managed workflows; use their existing workflow names rather than creating duplicate workflows.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
