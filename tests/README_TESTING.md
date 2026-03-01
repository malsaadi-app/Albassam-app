# Testing quick start

## Unit/API tests (Vitest)
```bash
BASE_URL=http://localhost:3000 npm run test:unit
```

## E2E (Playwright)
Requires env vars:
- `E2E_USERNAME`
- `E2E_PASSWORD`

```bash
E2E_USERNAME=mohammed E2E_PASSWORD=admin123 npm run test:e2e
```

> Tip: set `BASE_URL` to staging/prod for smoke checks.
