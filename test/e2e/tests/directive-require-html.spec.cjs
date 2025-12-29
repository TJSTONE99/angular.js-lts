const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("require parent controller on html element", () => {
  test("should not use the html element as the parent element", async ({ page }) => {
    await loadFixture(page, "directive-require-html");
    
    const containerText = await page.locator('#container').textContent();
    expect(containerText).toContain("Controller 'requireTargetDirective', required by directive 'requireDirective', can't be found!");
  });
});