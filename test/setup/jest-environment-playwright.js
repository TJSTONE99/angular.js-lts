/**
 * Simplified Jest environment using Playwright for real browser testing
 * This version serves the dist folder and loads AngularJS from the local build
 */

const { TestEnvironment } = require('jest-environment-node');
const { chromium } = require('playwright');
const express = require('express');
const path = require('path');

class SimplePlaywrightEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.browser = null;
    this.browserContext = null;
    this.page = null;
    this.server = null;
    this.serverPort = null;
  }

  async setup() {
    await super.setup();

    // Start a local server to serve dist files (like e2e tests)
    this.serverPort = await this.startDistServer();

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.browserContext = await this.browser.newContext();
    this.page = await this.browserContext.newPage();

    // Set up error handling
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    this.page.on('pageerror', error => {
      console.error('Browser page error:', error);
    });

    // Expose page to test globals
    this.global.page = this.page;
    this.global.browser = this.browser;
    this.global.browserContext = this.browserContext;
    this.global.serverPort = this.serverPort;

    // Expose expect from Node (for assertions in Node context)
    this.global.expect = require('expect');
  }

  async startDistServer() {
    return new Promise((resolve, reject) => {
      const app = express();

      // Paths (same as e2e server)
      const distDir = path.join(__dirname, '../../dist');
      const nodeModulesDir = path.join(__dirname, '../../node_modules');

      // Enable CORS for all routes
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        next();
      });

      // Serve dist directory at /dist (same as e2e)
      app.use('/dist', express.static(distDir));

      // Serve jQuery from node_modules at /vendor (same as e2e)
      app.use('/vendor/jquery', express.static(path.join(nodeModulesDir, 'jquery/dist')));

      // Serve a simple test page at root
      app.get('/', (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Playwright Animation Tests</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              #test-container { border: 1px solid #ccc; padding: 20px; margin: 20px 0; min-height: 200px; }
            </style>
          </head>
          <body>
            <h1>AngularJS Animation Test Environment</h1>
            <div id="test-container"></div>
            <script>
              console.log('Test page loaded');
              window.testPageReady = true;
            </script>
          </body>
          </html>
        `);
      });

      const server = app.listen(0, () => {
        const port = server.address().port;
        this.server = server;
        console.log(`🚀 Playwright test server running at http://localhost:${port}`);
        console.log(`📦 Serving dist from: ${distDir} (at /dist)`);
        resolve(port);
      });

      server.on('error', reject);
    });
  }

  async teardown() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browserContext) {
      await this.browserContext.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    if (this.server) {
      this.server.close();
    }
    await super.teardown();
  }
}

module.exports = SimplePlaywrightEnvironment;