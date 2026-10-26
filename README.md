# KAVANDOR

KAVANDOR is an AI-assisted harvest intelligence and perishable-produce marketplace for Kenyan farmers.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth + Storage
- Zod and React Hook Form
- Vitest + Testing Library
- Playwright

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run ci
```

## GitHub and CI

A GitHub Actions workflow is included for linting, type checking, unit tests, and build validation. Open pull requests against `main`, and keep shared contracts aligned before merging feature branches.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. The project is intentionally safe to run without real Supabase credentials; the shared code validates them gracefully.

## Demo constraints

- All pricing and market details are demonstration data only.
- The first workflow focuses on a tomato harvest in Kisii.
- AI assessment is optional and gracefully falls back when provider keys are absent.

## Git workflow

- Work on feature branches such as `feat/farmer-experience` and `feat/database`.
- Open pull requests to `main` instead of pushing directly.
- Keep `.env*` files out of Git history.

## Deployment

This is prepared for Vercel deployment, but actual hosting still requires a configured Supabase project and deployment credentials.
