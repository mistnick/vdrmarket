# Testing

## Unit Tests (Jest)

Run unit tests:
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:ci          # CI mode
```

Coverage thresholds are set to 70% for branches, functions, lines, and statements.

## E2E Tests (Playwright)

Run end-to-end tests:
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Open Playwright UI
npm run test:e2e:headed   # Run with browser visible
npm run test:e2e:debug    # Debug mode
```

Tests are configured to run against:
- Desktop: Chrome, Firefox, Safari
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)

## Writing Tests

### Unit Tests

Place unit tests in `__tests__` directory:
```typescript
import { render, screen } from "@testing-library/react";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### E2E Tests

Place E2E tests in `e2e` directory:
```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/auth/login");
  await page.fill('input[type="email"]', "user@example.com");
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL("/dashboard");
});
```

## CI/CD Integration

Tests can be run in CI with:
```bash
npm run test:ci          # Unit tests
npm run test:e2e         # E2E tests
```

Make sure to set appropriate environment variables for CI.
