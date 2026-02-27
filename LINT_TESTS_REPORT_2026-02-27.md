# Lint + unit tests report (2026-02-27)

## Goals
- Make `npm run lint` non-interactive and runnable in automation.
- Make `npm run test:unit` runnable in automation (even if no tests exist yet).

## Changes made
### ESLint
- Added `.eslintrc.json` (Next.js core web vitals + TS preset)
- Adjusted `package.json` script:
  - `lint`: `eslint . --ext .js,.jsx,.ts,.tsx`
- Pinned `eslint-config-next` to match Next 15:
  - `eslint-config-next@15.2.0`
  - downgraded `@next/bundle-analyzer` to `15.2.0` to keep version alignment
- Added ignore patterns to skip:
  - `tests.bak/` (archived tests)
  - `scripts/`, `prisma/` and legacy JS scripts (not part of runtime)
- Left React hooks correctness checks enabled; fixed a real bug:
  - `app/components/Sidebar.tsx` had conditional hooks (`useState` after an early return). This is now fixed.

Result:
- `npm run lint` now exits **0** (warnings remain, no errors).

### Vitest
- Created `tests/setup.ts` (jest-dom)
- Updated `vitest.config.ts`:
  - Exclude `tests.bak/**`
  - `passWithNoTests: true`

Result:
- `npm run test:unit` now exits **0** even if no unit test files exist yet.

## Security note (npm audit)
- `npm audit --omit=dev --audit-level=high` reports 1 high severity vulnerability in `xlsx`.
- Advisory indicates **no fix available**. Options:
  1) Keep as-is and limit surface area (only use XLSX export in admin-only paths).
  2) Replace with a safer maintained alternative.

