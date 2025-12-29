const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("$http", () => {
  test.beforeEach(async ({ page }) => {
    await loadFixture(page, "http");
  });

  test("should correctly update the outstanding request count", async ({ page }) => {
    await expect(page.locator('p')).toHaveText("Hello, world!");
  });
});