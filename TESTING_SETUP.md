# Testing Setup Guide - Albassam Schools App

**تاريخ:** 24 فبراير 2026  
**الحالة:** جاهز للتطبيق

---

## 📚 نظرة عامة

دليل كامل لإعداد نظام testing للتطبيق.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Testing frameworks
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitejs/plugin-react

# E2E testing
npm install -D @playwright/test
npx playwright install
```

### 2. Add Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### 3. Run Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# UI mode (browser-based)
npm run test:ui

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

---

## 📁 Project Structure

```
albassam-tasks/
├── tests/
│   ├── setup.ts                 # Test configuration
│   ├── components/              # Component tests
│   │   ├── loading/
│   │   │   └── Spinner.test.tsx
│   │   ├── states/
│   │   └── notifications/
│   ├── api/                     # API tests
│   │   ├── health.test.ts
│   │   └── employees.test.ts
│   ├── e2e/                     # E2E tests
│   │   ├── auth.spec.ts
│   │   ├── employees.spec.ts
│   │   └── tasks.spec.ts
│   └── utils/                   # Test utilities
│       ├── helpers.ts
│       └── mocks.ts
├── vitest.config.ts             # Vitest configuration
├── playwright.config.ts         # Playwright configuration
└── TESTING_STRATEGY.md          # Testing strategy document
```

---

## 🧪 Unit Testing (Vitest)

### Configuration

**vitest.config.ts** ✅ Created

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Setup File

**tests/setup.ts** ✅ Created

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));
```

### Example Test

**tests/components/loading/Spinner.test.tsx** ✅ Created

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '@/components/loading/Spinner';

describe('Spinner', () => {
  it('should render spinner', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode (re-run on change)
npm run test:watch

# UI mode (browser interface)
npm run test:ui

# Coverage report
npm run test:coverage
```

---

## 🌐 E2E Testing (Playwright)

### Configuration

**playwright.config.ts** ✅ Created

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### Example Test

**tests/e2e/auth.spec.ts** ✅ Created

```typescript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/');
  await page.fill('[name="username"]', 'mohammed');
  await page.fill('[name="password"]', 'albassam2024');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

### Running Tests

```bash
# Run E2E tests
npm run test:e2e

# UI mode (visual debugging)
npm run test:e2e:ui

# Debug mode (step-by-step)
npm run test:e2e:debug

# Specific browser
npx playwright test --project=chromium

# Update snapshots
npx playwright test --update-snapshots
```

---

## 📊 Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Coverage

```bash
# HTML report (interactive)
open coverage/index.html

# Terminal output
npm run test:coverage -- --reporter=text
```

### Coverage Thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  },
}
```

---

## 🎯 Test Examples

### Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingButton } from '@/components/loading';

it('should show spinner when loading', () => {
  render(<LoadingButton loading={true}>Save</LoadingButton>);
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

### API Test

```typescript
it('should return health status', async () => {
  const response = await fetch('/api/health');
  const data = await response.json();
  expect(data.status).toBe('ok');
});
```

### E2E Test

```typescript
test('should create employee', async ({ page }) => {
  await page.goto('/hr/employees/new');
  await page.fill('[name="name"]', 'Ahmed');
  await page.click('button[type="submit"]');
  await expect(page.getByText('تم إضافة الموظف بنجاح')).toBeVisible();
});
```

---

## 🔧 Testing Utilities

### Custom Render

```typescript
// tests/utils/helpers.ts
import { render } from '@testing-library/react';
import { ToastProvider } from '@/components/notifications';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
}
```

### Mock Data

```typescript
// tests/utils/mocks.ts
export const mockEmployee = {
  id: '1',
  name: 'Ahmed',
  role: 'Teacher',
  department: 'Math',
};

export const mockUser = {
  id: '1',
  username: 'mohammed',
  role: 'ADMIN',
};
```

---

## 🐛 Debugging

### Debug Unit Tests

```typescript
import { screen, debug } from '@testing-library/react';

it('should render', () => {
  render(<MyComponent />);
  
  // Print DOM
  debug();
  
  // Print specific element
  debug(screen.getByRole('button'));
});
```

### Debug E2E Tests

```bash
# Step-by-step debugging
npm run test:e2e:debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### VSCode Debugging

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Vitest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 📝 Best Practices

### 1. Test File Naming
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`
- Location: next to source file or in `tests/` directory

### 2. Test Organization
```typescript
describe('ComponentName', () => {
  describe('when prop is true', () => {
    it('should do something', () => {
      // test
    });
  });
  
  describe('when prop is false', () => {
    it('should do something else', () => {
      // test
    });
  });
});
```

### 3. AAA Pattern
```typescript
it('should ...', () => {
  // Arrange
  const input = 'test';
  
  // Act
  const result = myFunction(input);
  
  // Assert
  expect(result).toBe('expected');
});
```

### 4. Clean Up
```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

---

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  stage: test
  script:
    - npm ci
    - npm run test:coverage
    - npm run test:e2e
  coverage: '/Statements\s*:\s*(\d+\.\d+)%/'
```

---

## 📊 Testing Metrics

### Goals
- **Code Coverage:** 70%+
- **Test Count:** 100+ tests
- **Test Speed:** < 30s for unit tests
- **E2E Speed:** < 5min for full suite

### Current Status
- [ ] Unit tests setup ✅
- [ ] E2E tests setup ✅
- [ ] Example tests created ✅
- [ ] CI/CD integration ⏳
- [ ] Coverage threshold met ⏳
- [ ] All critical paths tested ⏳

---

## 📚 Resources

- **Vitest:** https://vitest.dev
- **Testing Library:** https://testing-library.com
- **Playwright:** https://playwright.dev
- **Testing Best Practices:** https://testingjavascript.com

---

## ✅ Next Steps

1. **Install dependencies** (5 min)
2. **Run example tests** to verify setup (2 min)
3. **Write tests for critical paths** (2-4 hours)
4. **Achieve 70% coverage** (4-8 hours)
5. **Setup CI/CD** (1 hour)
6. **Document test results** (30 min)

**Total Estimated Time:** 1-2 days

---

**Status:** ✅ Setup complete, ready for implementation  
**Last Updated:** 24 فبراير 2026
