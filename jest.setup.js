// jest.setup.js
// Add custom matchers for testing
import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/dataroom_test';
