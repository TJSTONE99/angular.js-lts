const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("Sample", () => {
  test.beforeEach(async ({ page }) => {
    await loadFixture(page, "sample");
  });

  test("should have the interpolated text", async ({ page }) => {
    // Wait for Angular to interpolate the text
    await expect(page.locator('p')).toHaveText("Hello, world!");
  });

  test("should insert the ng-cloak styles", async ({ page }) => {
    await page.evaluate(() => {
      const span = document.createElement("span");
      span.className = "ng-cloak foo";
      document.body.appendChild(span);
    });

    // ng-cloak hides the element via CSS
    await expect(page.locator(".foo")).toBeHidden();
  });
});
