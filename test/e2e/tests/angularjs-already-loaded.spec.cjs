const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("App where AngularJS is loaded more than once", () => {
  test.beforeEach(async ({ page }) => {
    await loadFixture(page, "angularjs-already-loaded");
  });

  test("should have the interpolated text", async ({ page }) => {
    await expect(page.locator('p')).toHaveText("Hello, world!");
  });
});