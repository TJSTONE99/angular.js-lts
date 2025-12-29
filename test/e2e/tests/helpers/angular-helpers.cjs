/**
 * Angular.js specific helpers for Playwright tests
 * These helpers make it easier to interact with Angular.js applications
 */

/**
 * Wait for Angular to be loaded and bootstrapped
 * @param {import('@playwright/test').Page} page 
 */
async function waitForAngular(page) {
  try {
    await page.waitForFunction(() => {
      return window.angular && window.angular.element && 
             document.querySelector('[ng-app]') !== null;
    }, { timeout: 10000 });
  } catch (error) {
    // If Angular doesn't load, let's debug what's happening
    const hasAngular = await page.evaluate(() => !!window.angular);
    const hasNgApp = await page.evaluate(() => !!document.querySelector('[ng-app]'));
    const errors = await page.evaluate(() => {
      const errors = [];
      if (window.console && window.console.error) {
        // Try to capture any console errors
        return window.__errors || [];
      }
      return [];
    });
    
    console.log(`Angular loading failed: hasAngular=${hasAngular}, hasNgApp=${hasNgApp}, errors=${JSON.stringify(errors)}`);
    throw error;
  }
}

/**
 * Get Angular version from the page
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<Object>} Angular version object
 */
async function getAngularVersion(page) {
  return await page.evaluate(() => {
    if (!window.angular || !window.angular.version) {
      throw new Error("angular.version is not available on window");
    }
    return window.angular.version;
  });
}

/**
 * Get scope data from an element
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector - CSS selector for the element
 * @returns {Promise<Object>} Scope data
 */
async function getElementScope(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) throw new Error(`Element not found: ${sel}`);
    
    const scope = window.angular.element(element).scope();
    return scope ? JSON.parse(JSON.stringify(scope)) : null;
  }, selector);
}

/**
 * Trigger Angular digest cycle
 * @param {import('@playwright/test').Page} page 
 */
async function triggerDigest(page) {
  await page.evaluate(() => {
    const rootElement = document.querySelector('[ng-app]');
    if (rootElement) {
      const scope = window.angular.element(rootElement).scope();
      if (scope) {
        scope.$apply();
      }
    }
  });
}

/**
 * Load a fixture by navigating to its path
 * @param {import('@playwright/test').Page} page 
 * @param {string} fixtureName - Name of the fixture directory
 */
async function loadFixture(page, fixtureName) {
  await page.goto(`/${fixtureName}/`);
  await waitForAngular(page);
}

/**
 * Find element by Angular binding
 * @param {import('@playwright/test').Page} page 
 * @param {string} binding - The binding expression (e.g., 'text', 'user.name')
 * @returns {Promise<import('@playwright/test').Locator>}
 */
function getByBinding(page, binding) {
  // Look for elements with ng-bind, {{}} interpolation, or other binding attributes
  const escapedBinding = binding.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.locator(`[ng-bind="${binding}"], [ng-bind-html="${binding}"]`)
    .or(page.locator(`:has-text("${binding}")`))
    .or(page.locator(`text=/.*${escapedBinding}.*/`));
}

/**
 * Find element by Angular model
 * @param {import('@playwright/test').Page} page 
 * @param {string} model - The model name (e.g., 'user.name')
 * @returns {Promise<import('@playwright/test').Locator>}
 */
function getByModel(page, model) {
  return page.locator(`[ng-model="${model}"]`);
}

/**
 * Find repeater elements
 * @param {import('@playwright/test').Page} page 
 * @param {string} repeater - The repeater expression (e.g., 'item in items')
 * @returns {Promise<import('@playwright/test').Locator>}
 */
function getByRepeater(page, repeater) {
  return page.locator(`[ng-repeat="${repeater}"]`);
}

module.exports = {
  waitForAngular,
  getAngularVersion,
  getElementScope,
  triggerDigest,
  loadFixture,
  getByBinding,
  getByModel,
  getByRepeater,
};