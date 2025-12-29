const { execSync } = require('child_process');
const { setupFixtureReferences } = require('./setup-fixtures.cjs');

/**
 * Global setup for Playwright e2e tests
 * Ensures Angular is built and fixtures are prepared
 */
async function globalSetup() {
  console.log('🔧 Setting up e2e test environment...');

  try {
    // Build Angular if not already built
    console.log('📦 Building Angular.js...');
    execSync('npm run build', { stdio: 'inherit' });

    // Setup fixture references to /dist endpoint
    console.log('📁 Setting up fixtures...');
    setupFixtureReferences();

    console.log('✅ E2E setup complete!');
  } catch (error) {
    console.error('❌ E2E setup failed:', error.message);
    process.exit(1);
  }
}

module.exports = globalSetup;