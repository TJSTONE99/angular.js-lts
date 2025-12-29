const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("Customizing the jqLite / jQuery version", () => {
  test("should be able to force jqLite", async ({ page }) => {
    await loadFixture(page, "ng-jq");
    await expect(page.locator('[ng-bind="jqueryVersion"]')).toHaveText("jqLite");
  });

  test("should be able to use a specific version jQuery", async ({ page }) => {
    await loadFixture(page, "ng-jq-jquery");
    await expect(page.locator('[ng-bind="jqueryVersion"]')).toHaveText("2.1.0");
  });
});