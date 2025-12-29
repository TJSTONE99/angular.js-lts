#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup script to update fixture HTML files to reference Angular files from /dist endpoint
 * Requires Node.js 20.6.0+ for automatic .env file loading
 */

const fixturesDir = path.join(__dirname, 'fixtures');

// Get the port from the same logic as server.cjs
const getServerPort = () => {
  return process.env.PORT || 4200;
};

// Generate script mappings with dynamic port
const getScriptMappings = () => {
  const port = getServerPort();
  const baseUrl = `http://localhost:${port}`;

  return {
    'angular.js': `${baseUrl}/dist/angular/angular.js`,
    'angular-mocks.js': `${baseUrl}/dist/angular-mocks/angular-mocks.js`,
    'angular-route.js': `${baseUrl}/dist/angular-route/angular-route.js`,
    'angular-animate.js': `${baseUrl}/dist/angular-animate/angular-animate.js`,
    'angular-aria.js': `${baseUrl}/dist/angular-aria/angular-aria.js`,
    'angular-cookies.js': `${baseUrl}/dist/angular-cookies/angular-cookies.js`,
    'angular-message-format.js': `${baseUrl}/dist/angular-message-format/angular-message-format.js`,
    'angular-messages.js': `${baseUrl}/dist/angular-messages/angular-messages.js`,
    'angular-parse-ext.js': `${baseUrl}/dist/angular-parse-ext/angular-parse-ext.js`,
    'angular-resource.js': `${baseUrl}/dist/angular-resource/angular-resource.js`,
    'angular-sanitize.js': `${baseUrl}/dist/angular-sanitize/angular-sanitize.js`,
    'angular-touch.js': `${baseUrl}/dist/angular-touch/angular-touch.js`,
    'angular-loader.js': `${baseUrl}/dist/angular-loader/angular-loader.js`,
    'jquery.js': `${baseUrl}/vendor/jquery/jquery.js`,
    'script.js': `${baseUrl}/{{fixture}}/script.js` // Special case for fixture-specific scripts
  };
};

function setupFixtureReferences() {
  const port = getServerPort();
  const scriptMappings = getScriptMappings();

  console.log(`Using server port: ${port}`);

  // Get all fixture directories
  const fixtures = fs.readdirSync(fixturesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${fixtures.length} fixture directories`);

  fixtures.forEach(fixture => {
    const fixtureDir = path.join(fixturesDir, fixture);
    const indexPath = path.join(fixtureDir, 'index.html');

    // Update HTML files to reference /dist paths
    if (fs.existsSync(indexPath)) {
      try {
        let content = fs.readFileSync(indexPath, 'utf8');
        let updated = false;

        // Update script src attributes to point to absolute served endpoints
        Object.entries(scriptMappings).forEach(([originalSrc, absolutePath]) => {
          // Handle special case for fixture-specific scripts
          const finalAbsolutePath = absolutePath.replace('{{fixture}}', fixture);

          // Escape special regex characters in the original source
          const escapedSrc = originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          // Match various possible existing patterns (including any port number)
          const patterns = [
            // Simple filename
            new RegExp(`src=["']${escapedSrc}["']`, 'g'),
            // Existing /dist path
            new RegExp(`src=["']/dist/[^/]+/${escapedSrc}["']`, 'g'),
            // Existing /vendor path
            new RegExp(`src=["']/vendor/[^/]+/${escapedSrc}["']`, 'g'),
            // Existing absolute localhost paths (any port) - for any path
            new RegExp(`src=["']http://localhost:\\d+/${fixture}/${escapedSrc}["']`, 'g'),
            // Existing absolute localhost paths (any port) - for dist paths
            new RegExp(`src=["']http://localhost:\\d+/dist/[^/]+/${escapedSrc}["']`, 'g'),
            // Existing absolute localhost paths (any port) - for vendor paths
            new RegExp(`src=["']http://localhost:\\d+/vendor/[^/]+/${escapedSrc}["']`, 'g'),
            // Relative dist paths
            new RegExp(`src=["']..\/..\/..\/..\/dist\/[^/]+\/${escapedSrc}["']`, 'g'),
            new RegExp(`src=["']..\/..\/..\/dist\/[^/]+\/${escapedSrc}["']`, 'g')
          ];

          let foundMatch = false;
          patterns.forEach(regex => {
            if (content.match(regex) && !foundMatch) {
              content = content.replace(regex, `src="${finalAbsolutePath}"`);
              updated = true;
              foundMatch = true;
              console.log(`✓ Updated ${fixture}/index.html: ${originalSrc} -> ${finalAbsolutePath}`);
            }
          });
        });

        if (updated) {
          fs.writeFileSync(indexPath, content, 'utf8');
        }
      } catch (err) {
        console.error(`✗ Failed to update ${fixture}/index.html:`, err.message);
      }
    } else {
      console.warn(`⚠ No index.html found in ${fixture}`);
    }
  });

  // Clean up any existing copied files
  cleanupOldFiles(fixtures);
}

function cleanupOldFiles(fixtures) {
  // Only clean up files that were actually copied, not fixture-specific files
  const filesToCleanup = [
    'angular.js',
    'angular-mocks.js',
    'angular-route.js',
    'angular-animate.js',
    'angular-aria.js',
    'angular-cookies.js',
    'angular-message-format.js',
    'angular-messages.js',
    'angular-parse-ext.js',
    'angular-resource.js',
    'angular-sanitize.js',
    'angular-touch.js',
    'angular-loader.js',
    'jquery.js'
    // Note: script.js is NOT included as it's a legitimate fixture file
  ];

  fixtures.forEach(fixture => {
    const fixtureDir = path.join(fixturesDir, fixture);

    filesToCleanup.forEach(file => {
      const filePath = path.join(fixtureDir, file);
      if (fs.existsSync(filePath)) {
        try {
          // Check if it's a symlink or regular file
          const stats = fs.lstatSync(filePath);
          if (stats.isSymbolicLink() || stats.isFile()) {
            fs.unlinkSync(filePath);
            console.log(`✓ Cleaned up ${fixture}/${file}`);
          }
        } catch (err) {
          console.error(`✗ Failed to cleanup ${fixture}/${file}:`, err.message);
        }
      }
    });
  });
}

if (require.main === module) {
  setupFixtureReferences();
}

module.exports = { setupFixtureReferences };