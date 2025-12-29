/**
 * Playwright configuration for e2e tests
 * Requires Node.js 20.6.0+ for automatic .env file loading
 */

const port = process.env.PORT || 4200;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
    testDir: "./test/e2e/tests",
    timeout: 15_000,
    retries: 0,
    outputDir: './test/e2e/.test-results',

    // Global setup to ensure Angular is built and fixtures are ready
    globalSetup: require.resolve('./test/e2e/global-setup.cjs'),

    use: {
        baseURL: `http://localhost:${port}`,
        headless: true,
        trace: "on-first-retry",
        // Wait for network to be idle before considering navigation complete
        waitForLoadState: 'networkidle',
    },

    // Configure web server to serve fixtures during testing
    webServer: {
        command: 'npm run test:e2e:serve',
        port: parseInt(port),
        reuseExistingServer: !process.env.CI,
        timeout: 10_000,
    },

    projects: [
        {
            name: "chromium",
            use: { browserName: "chromium" },
        },
        // Uncomment to test in other browsers
        // {
        //     name: "firefox",
        //     use: { browserName: "firefox" },
        // },
        // {
        //     name: "webkit",
        //     use: { browserName: "webkit" },
        // },
    ],
};