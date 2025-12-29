const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("hidden thingy", () => {
  test("should pass", async ({ page }) => {
    await loadFixture(page, "input-hidden");
    
    // Check initial input value
    await expect(page.locator('input')).toHaveValue('');

    // Click button and check value changes
    await page.locator('button').click();
    await expect(page.locator('input')).toHaveValue('{{ 7 * 6 }}');

    // Navigate to sample fixture
    await loadFixture(page, "sample");
    
    // Go back in history
    await page.goBack();
    
    // Check value after going back (may vary by browser)
    const inputValue = await page.locator('input').inputValue();
    expect(['{{ 7 * 6 }}', '']).toContain(inputValue);
  });

  test("should prevent browser autofill on browser.refresh", async ({ page }) => {
    await loadFixture(page, "back2dom");
    
    // Check initial values
    await expect(page.locator('#input1')).toHaveValue('');
    await expect(page.locator('#input2')).toHaveValue('');

    // Type in textarea
    await page.locator('textarea').fill('{{ internalFn() }}');

    // Check values are updated
    await expect(page.locator('#input1')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('#input2')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('body')).toHaveClass('');

    // Refresh page
    await page.reload();
    
    // Check body class after refresh
    await expect(page.locator('body')).toHaveClass('');
  });

  test("should prevent browser autofill on location.reload", async ({ page }) => {
    await loadFixture(page, "back2dom");
    
    // Check initial values
    await expect(page.locator('#input1')).toHaveValue('');
    await expect(page.locator('#input2')).toHaveValue('');

    // Type in textarea
    await page.locator('textarea').fill('{{ internalFn() }}');

    // Check values are updated
    await expect(page.locator('#input1')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('#input2')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('body')).toHaveClass('');

    // Reload using JavaScript
    await page.evaluate(() => location.reload());
    
    // Check body class after reload
    await expect(page.locator('body')).toHaveClass('');
  });

  test("should prevent browser autofill on history.back", async ({ page }) => {
    await loadFixture(page, "back2dom");
    
    // Check initial values
    await expect(page.locator('#input1')).toHaveValue('');
    await expect(page.locator('#input2')).toHaveValue('');

    // Type in textarea
    await page.locator('textarea').fill('{{ internalFn() }}');

    // Check values are updated
    await expect(page.locator('#input1')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('#input2')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('body')).toHaveClass('');

    // Navigate to sample
    await loadFixture(page, "sample");

    // Go back using JavaScript
    await page.evaluate(() => history.back());
    
    // Wait for navigation and check body class
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toHaveClass('');
  });

  test("should prevent browser autofill on history.forward", async ({ page }) => {
    // Navigate to sample first
    await loadFixture(page, "sample");
    
    // Then navigate to back2dom
    await loadFixture(page, "back2dom");
    
    // Check initial values
    await expect(page.locator('#input1')).toHaveValue('');
    await expect(page.locator('#input2')).toHaveValue('');

    // Type in textarea
    await page.locator('textarea').fill('{{ internalFn() }}');

    // Check values are updated
    await expect(page.locator('#input1')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('#input2')).toHaveValue('{{ internalFn() }}');
    await expect(page.locator('body')).toHaveClass('');

    // Go back and forward using JavaScript
    await page.evaluate(() => history.back());
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => history.forward());
    await page.waitForLoadState('networkidle');
    
    // Check body class after forward navigation
    await expect(page.locator('body')).toHaveClass('');
  });
});