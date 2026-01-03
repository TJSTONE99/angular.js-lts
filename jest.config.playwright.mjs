/**
 * Jest configuration for Playwright-based unit tests
 * These tests run in real browsers to test functionality that requires proper browser APIs
 * (CSS animations, DOM manipulation, event handling, etc.)
 */

const jestConfig = {
  roots: [
    "<rootDir>/test",
  ],
  testMatch: [
    "**/**.spec.js"
  ],
  testEnvironment: "<rootDir>/test/setup/jest-environment-playwright.js",
  setupFilesAfterEnv: [
    // No setup files for Playwright - we'll handle setup in the environment
  ],
  // Increase timeout for browser tests
  testTimeout: 30000,
  // Run tests serially to avoid browser conflicts
  maxWorkers: 1,
  // Don't collect coverage for Playwright tests (slower)
  collectCoverage: false,
};

export default jestConfig;