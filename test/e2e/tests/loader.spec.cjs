const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("angular-loader", () => {
  test.beforeEach(async ({ page }) => {
    await loadFixture(page, "loader");
  });

  test("should not be broken by loading the modules before core", async ({ page }) => {
    await expect(page.locator('p')).toHaveText("Hello, world!");
  });
});