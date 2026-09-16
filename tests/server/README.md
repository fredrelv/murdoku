# Server integration tests

`tests/server/puzzleDto.test.ts` is a pure unit test (no database) and always
runs as part of `npm test`.

`tests/server/services.integration.test.ts` exercises the Prisma-backed
services (`users.service.ts`, `puzzles.service.ts`, `attempts.service.ts`)
against a real Postgres database. It is skipped automatically unless
`DATABASE_URL` is set, because this sandbox had no live Postgres to verify
it against — treat it as scaffolding to run for real in CI or before your
first production deploy, not as already-verified coverage.

To run it locally:

```bash
# any throwaway Postgres works, e.g. docker run -e POSTGRES_PASSWORD=x -p 5432:5432 postgres
export DATABASE_URL="postgresql://postgres:x@localhost:5432/murdoku_test"
npx prisma migrate deploy
npm test -- tests/server/services.integration.test.ts
```

In CI, add a `postgres:16` service container and set `DATABASE_URL` before
the test step (see `.github/workflows/ci.yml`).

Recommended follow-ups once a CI database is wired up (see the plan this
project was built from):

- Auth flow tests: login lockout after repeated failures, session revocation
  on password change / deactivation / deletion, cascade session cleanup.
- Admin authorization matrix: every `/api/admin/*` route returns 403 for a
  PLAYER-role session (currently only asserted at the service layer here).
- "Last admin" guard: cannot demote/deactivate/delete the only remaining
  admin account.
