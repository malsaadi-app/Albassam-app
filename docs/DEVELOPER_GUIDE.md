# 👨‍💻 Developer Guide - Albassam Schools Management System

**Version:** 1.0  
**Date:** February 2026  
**Audience:** Developers, Contributors

---

## 📑 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Components](#components)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Contributing](#contributing)

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js: >= 22.22.0
npm: >= 10.0.0
PostgreSQL: 15+
```

### Local Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd albassam-tasks

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 5. Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Redis (optional for local dev)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Session
SESSION_SECRET="your-32-char-secret"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│           Client (Browser)                  │
│  ┌──────────────────────────────────────┐  │
│  │     React 19 + Next.js 15 App        │  │
│  └──────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │ HTTPS/REST
               ↓
┌──────────────────────────────────────────────┐
│        Next.js API Routes (Backend)          │
│  ┌─────────────────────────────────────┐    │
│  │  Authentication & Authorization      │    │
│  │  Business Logic                      │    │
│  │  Rate Limiting & Validation          │    │
│  └─────────────────────────────────────┘    │
└────────┬───────────────────────┬─────────────┘
         │                       │
         ↓                       ↓
┌────────────────┐      ┌────────────────┐
│   PostgreSQL   │      │  Upstash Redis │
│   (Supabase)   │      │    (Cache)     │
└────────────────┘      └────────────────┘
```

### Request Flow

```
User Action
    ↓
UI Component
    ↓
API Route (/app/api/*)
    ↓
Middleware (auth, rate-limit, logging)
    ↓
Validation (Zod schemas)
    ↓
Business Logic
    ↓
Database (Prisma ORM)
    ↓
Response
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **State:** React Server Components + Client Components
- **Forms:** React Hook Form (where needed)
- **Icons:** Lucide React, React Icons

### Backend
- **Runtime:** Node.js 22
- **Framework:** Next.js API Routes
- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Prisma 6
- **Cache:** Upstash Redis
- **Session:** iron-session
- **Validation:** Zod
- **Logging:** Winston

### DevOps
- **Hosting:** Hostinger VPS
- **Tunnel:** Cloudflare
- **Process Manager:** PM2
- **Container:** Docker
- **Monitoring:** Winston + UptimeRobot

---

## 📁 Project Structure

```
albassam-tasks/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── employees/       # Employee CRUD
│   │   ├── tasks/           # Task management
│   │   ├── attendance/      # Attendance tracking
│   │   ├── hr/              # HR module
│   │   ├── procurement/     # Procurement module
│   │   ├── health/          # Health check
│   │   ├── status/          # Public status
│   │   └── monitoring/      # Metrics endpoint
│   ├── (auth)/              # Auth pages group
│   │   └── login/
│   ├── (dashboard)/         # Protected pages group
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── tasks/
│   │   ├── attendance/
│   │   ├── hr/
│   │   ├── procurement/
│   │   ├── reports/
│   │   └── settings/
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
│
├── components/               # React Components
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── loading/             # Loading states
│   │   ├── Skeleton.tsx
│   │   ├── Spinner.tsx
│   │   └── PageLoading.tsx
│   ├── states/              # Empty/Error states
│   │   ├── ErrorState.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorBoundary.tsx
│   ├── notifications/       # Notifications system
│   │   ├── Toast.tsx
│   │   └── NotificationCenter.tsx
│   └── help/                # Help & Onboarding
│       ├── Tooltip.tsx
│       └── Onboarding.tsx
│
├── lib/                      # Shared utilities
│   ├── prisma.ts            # Prisma client
│   ├── cache.ts             # Cache utilities
│   ├── session.ts           # Session management
│   ├── logger.ts            # Winston logger
│   ├── error-handler.ts     # Error handling
│   ├── audit-logger.ts      # Audit logging
│   ├── monitoring.ts        # Performance monitoring
│   ├── ratelimit.ts         # Rate limiting
│   ├── image-utils.ts       # Image optimization
│   ├── validations/         # Zod schemas
│   │   ├── auth.ts
│   │   ├── employee.ts
│   │   ├── attendance.ts
│   │   ├── task.ts
│   │   └── index.ts
│   └── utils.ts             # Helper functions
│
├── prisma/                   # Database
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Migration history
│   └── seed.ts              # Seed data
│
├── public/                   # Static assets
│   ├── images/
│   └── fonts/
│
├── tests/                    # Test suites
│   ├── api/                 # API tests
│   ├── components/          # Component tests
│   └── e2e/                 # End-to-end tests
│
├── docs/                     # Documentation
│   ├── USER_GUIDE.md
│   ├── ADMIN_GUIDE.md
│   └── DEVELOPER_GUIDE.md (this file)
│
├── logs/                     # Application logs
│   ├── error-*.log
│   ├── combined-*.log
│   └── http-*.log
│
├── uploads/                  # Uploaded files
│
├── .env                      # Environment variables
├── .env.example              # Environment template
├── next.config.ts            # Next.js config
├── tailwind.config.ts        # Tailwind config
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies
├── ecosystem.config.js       # PM2 config
├── vitest.config.ts          # Vitest config
├── playwright.config.ts      # Playwright config
└── README.md                 # Project README
```

---

## 💻 Development Workflow

### Branching Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/feature-name
bugfix/bug-name
hotfix/critical-fix
```

### Commit Convention

```
feat: Add employee attendance tracking
fix: Resolve login session timeout
docs: Update API documentation
style: Format code with Prettier
refactor: Optimize database queries
test: Add unit tests for auth module
chore: Update dependencies
```

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes
3. Write/update tests
4. Run linter and tests
5. Create PR to `develop`
6. Code review (2 approvals)
7. Merge to `develop`
8. Deploy to staging
9. Test on staging
10. Merge to `main` (production)

---

## 🌐 API Documentation

### Authentication

**POST /api/auth/login**
```typescript
Request:
{
  username: string;
  password: string;
}

Response: 200 OK
{
  user: {
    id: string;
    username: string;
    displayName: string;
    role: 'USER' | 'HR' | 'ADMIN';
  }
}

Errors:
- 400: Invalid credentials
- 429: Too many attempts
- 500: Server error
```

**POST /api/auth/logout**
```typescript
Response: 200 OK
{ message: "Logged out successfully" }
```

### Employees

**GET /api/employees**
```typescript
Query Params:
- search?: string
- status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'
- branchId?: string
- page?: number
- limit?: number

Response: 200 OK
{
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
}
```

**POST /api/employees**
```typescript
Request:
{
  firstNameAr: string;
  fatherNameAr: string;
  grandFatherNameAr: string;
  lastNameAr: string;
  employeeNumber: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
  jobTitleId: string;
  branchId: string;
  hireDate: string; // YYYY-MM-DD
  // ... more fields
}

Response: 201 Created
{
  employee: Employee;
}
```

**GET /api/employees/:id**
```typescript
Response: 200 OK
{
  employee: Employee;
}
```

**PUT /api/employees/:id**
```typescript
Request: Partial<Employee>

Response: 200 OK
{
  employee: Employee;
}
```

**DELETE /api/employees/:id**
```typescript
Response: 200 OK
{
  message: "Employee deleted successfully"
}
```

### Attendance

**POST /api/attendance/check-in**
```typescript
Request:
{
  employeeId: string;
  method: 'QR' | 'RFID' | 'MANUAL' | 'FACIAL';
  location?: string;
}

Response: 201 Created
{
  attendance: {
    id: string;
    employeeId: string;
    checkInTime: string;
    status: 'PRESENT' | 'LATE';
  }
}
```

**POST /api/attendance/check-out**
```typescript
Request:
{
  attendanceId: string;
}

Response: 200 OK
{
  attendance: {
    id: string;
    checkOutTime: string;
    workingHours: number;
  }
}
```

### Health & Monitoring

**GET /api/health**
```typescript
Response: 200 OK
{
  status: "ok";
  database: boolean;
  timestamp: string;
  uptime: number;
}
```

**GET /api/status** (Public)
```typescript
Response: 200 OK
{
  status: "operational" | "degraded" | "down";
  services: {
    application: { status: string };
    database: { status: string };
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  version: string;
}
```

**GET /api/monitoring** (Admin only)
```typescript
Response: 200 OK
{
  counters: { ... };
  gauges: { ... };
  histograms: { ... };
}
```

---

## 🗄️ Database Schema

### Core Models

**User**
```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  password      String   // bcrypt hashed
  displayName   String
  email         String?
  role          Role     @default(USER)
  employeeId    String?  @unique
  employee      Employee? @relation(fields: [employeeId], references: [id])
  isActive      Boolean  @default(true)
  lastLogin     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  USER
  HR
  ADMIN
}
```

**Employee**
```prisma
model Employee {
  id                  String   @id @default(cuid())
  employeeNumber      String   @unique
  firstNameAr         String
  fatherNameAr        String
  grandFatherNameAr   String
  lastNameAr          String
  firstNameEn         String?
  // ... more fields
  status              EmployeeStatus @default(ACTIVE)
  jobTitleId          String
  jobTitle            JobTitle @relation(fields: [jobTitleId], references: [id])
  branchId            String
  branch              Branch @relation(fields: [branchId], references: [id])
  hireDate            DateTime
  salary              Float?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  user                User?
  attendance          Attendance[]
  tasks               Task[]
  leaveRequests       LeaveRequest[]
}

enum EmployeeStatus {
  ACTIVE
  ON_LEAVE
  TERMINATED
  SUSPENDED
}
```

**Attendance**
```prisma
model Attendance {
  id           String   @id @default(cuid())
  employeeId   String
  employee     Employee @relation(fields: [employeeId], references: [id])
  date         DateTime
  checkInTime  DateTime?
  checkOutTime DateTime?
  workingHours Float?
  status       AttendanceStatus
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum AttendanceStatus {
  PRESENT
  LATE
  ABSENT
  HALF_DAY
  SICK_LEAVE
  VACATION
}
```

**Task**
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  assignedTo  String
  assignedBy  String
  employee    Employee @relation(fields: [assignedTo], references: [id])
  priority    Priority @default(MEDIUM)
  status      TaskStatus @default(PENDING)
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

---

## 🎨 Components

### Component Guidelines

**File Naming:**
- PascalCase for components: `Button.tsx`
- camelCase for utilities: `formatDate.ts`

**Component Structure:**
```typescript
// 1. Imports
import React from 'react';
import { cn } from '@/lib/utils';

// 2. Types/Interfaces
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

// 3. Component
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2',
        size === 'lg' && 'px-6 py-3 text-lg'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Component Library

**Available Components:**
- `Button` - 7 colors, 3 sizes, loading state
- `Card` - 3 variants, hover effects
- `Input/Textarea/Select` - Labels, errors, icons
- `Modal` - 5 sizes, animations
- `Table` - Sortable, hoverable, striped
- `Tabs` - Line/pills styles
- `Badge` - 6 variants, pulse animation
- `Skeleton` - 8 types of loading placeholders
- `Spinner` - 3 variations
- `ErrorState` - 6 error presets
- `EmptyState` - 10 empty state presets
- `Toast` - 4 notification types
- `NotificationCenter` - Bell with badge, panel
- `Tooltip` - 4 positions
- `Onboarding` - Step-by-step tour

**Usage:**
```typescript
import { Button, Card, Input, Modal } from '@/components/ui';
import { ErrorState, EmptyState } from '@/components/states';
import { Spinner, Skeleton } from '@/components/loading';
import { Toast } from '@/components/notifications';
```

---

## 🧪 Testing

### Test Structure

```
tests/
├── api/                     # API integration tests
│   └── health.test.ts
├── components/              # Component unit tests
│   ├── loading/
│   │   └── Spinner.test.tsx
│   └── states/
│       ├── ErrorState.test.tsx
│       └── EmptyState.test.tsx
├── lib/                     # Utility tests
│   └── validations.test.ts
└── e2e/                     # End-to-end tests
    └── auth.spec.ts
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

**Component Test Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

**API Test Example:**
```typescript
describe('Health API', () => {
  it('returns healthy status', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.database).toBe(true);
  });
});
```

---

## 🚀 Deployment

### Build

```bash
# Production build
npm run build

# Check build output
ls -lh .next/static
```

### Environment-Specific Builds

```bash
# Staging
NODE_ENV=staging npm run build

# Production
NODE_ENV=production npm run build
```

### Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Run database migrations (`npx prisma migrate deploy`)
- [ ] Build application (`npm run build`)
- [ ] Run tests (`npm test`)
- [ ] Check security audit (`npm audit`)
- [ ] Backup database
- [ ] Deploy with PM2 (`pm2 restart albassam`)
- [ ] Verify health check
- [ ] Monitor logs for 10 minutes
- [ ] Test critical flows (login, attendance, tasks)

---

## 🤝 Contributing

### Code Style

**TypeScript:**
```typescript
// Good
export async function getEmployee(id: string): Promise<Employee | null> {
  return prisma.employee.findUnique({ where: { id } });
}

// Avoid
export const getEmployee = async (id) => {
  return prisma.employee.findUnique({ where: { id } });
};
```

**React:**
```typescript
// Good: Named export + typed props
export function EmployeeCard({ employee }: { employee: Employee }) {
  return <div>{employee.name}</div>;
}

// Avoid: Default export + any
export default function EmployeeCard({ employee }: any) {
  return <div>{employee.name}</div>;
}
```

### Best Practices

1. **Always validate input** with Zod schemas
2. **Use TypeScript strictly** - avoid `any`
3. **Handle errors gracefully** - user-friendly messages
4. **Log important operations** - use Winston logger
5. **Cache expensive queries** - use Redis cache
6. **Write tests** - aim for 70%+ coverage
7. **Document complex logic** - inline comments
8. **Keep functions small** - single responsibility
9. **Use meaningful names** - self-documenting code
10. **Follow security practices** - OWASP guidelines

---

## 📚 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **React Docs:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Maintainer:** Development Team  

---

© 2026 Albassam Schools - All Rights Reserved
