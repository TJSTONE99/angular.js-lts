#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Express server for e2e tests
 * Serves both fixtures and dist directory to avoid file duplication
 */

const app = express();
const port = process.env.PORT || 4200;

// Paths
const fixturesDir = path.join(__dirname, 'fixtures');
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

// Serve dist directory at /dist
app.use('/dist', express.static(distDir));

// Serve jQuery from node_modules at /vendor
app.use('/vendor/jquery', express.static(path.join(nodeModulesDir, 'jquery/dist')));

// Serve fixtures directory at root
app.use('/', express.static(fixturesDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    fixtures: fs.existsSync(fixturesDir),
    dist: fs.existsSync(distDir),
    jquery: fs.existsSync(path.join(nodeModulesDir, 'jquery/dist'))
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 E2E test server running at http://localhost:${port}`);
  console.log(`📁 Serving fixtures from: ${fixturesDir}`);
  console.log(`📦 Serving dist from: ${distDir} (at /dist)`);
  console.log(`📚 Serving jQuery from: ${path.join(nodeModulesDir, 'jquery/dist')} (at /vendor/jquery)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

module.exports = app;