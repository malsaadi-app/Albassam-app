# Org Structure V2 — Plan (feat/org-structure-v2-complete)

Branch: feat/org-structure-v2-complete

Checklist:
1) coverageScope UI (BRANCH / MULTI_BRANCH / ALL) + branch picker
2) ADMIN assignments UI on employee page (multi-select stages + primary flag + optional weight)
3) Backend: API endpoints support coverageScope + coverageBranchIds JSON storage
4) Migrations (if needed) & prisma generate
5) Unit tests / integration smoke tests
6) Update HANDOFF.md with changes + how to test
7) Create PR, request review, merge, deploy

Estimated: 3-6 hours

How I'll proceed now:
- Create feature branch (done)
- Scaffold UI components + API handlers
- Implement backend changes and run `npx tsc --noEmit` and `npm run build`
- Run migrations if any, restart pm2, run health check
- Open PR and add HANDOFF/memory entries

If any priority tweak or constraint, tell me now.