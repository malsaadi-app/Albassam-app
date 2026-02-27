# Albassam Tasks (MVP)

Minimal internal tasks PWA (Next.js + Prisma + SQLite + iron-session).

## Features
- Username/password auth (bcrypt hashing)
- Roles: ADMIN (mohammed) + EMPLOYEE (user1..user6)
- Employee: sees only own tasks, can create tasks for self
- Admin: sees all non-private tasks + own private tasks
- Categories: معاملات (TRANSACTIONS), شؤون الموظفين (HR)
- Statuses: جديد (NEW), قيد التنفيذ (IN_PROGRESS), بانتظار (ON_HOLD), مكتمل (DONE)

## Local run
```bash
cp .env.example .env
# set SESSION_PASSWORD to a long random secret (32+ chars)

npm i
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Visit: http://localhost:3000/auth/login

## Notes
- For MVP, only admins can create private tasks (checkbox is ignored for employees).
- Middleware only checks cookie presence; API routes enforce real access rules.
- Add real PWA offline support later (service worker). Manifest is included.
