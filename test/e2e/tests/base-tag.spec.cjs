const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("SCE URL policy when base tags are present", () => {
  test.beforeEach(async ({ page }) => {
    await loadFixture(page, "base-tag");
  });

  test("allows the page URL (location.href)", async ({ page }) => {
    const currentUrl = page.url();
    const isTrusted = await expectToBeTrusted(page, currentUrl, true);
    expect(isTrusted).toBe(true);
  });

  test("blocks off-origin URLs", async ({ page }) => {
    const isTrusted = await expectToBeTrusted(page, "http://evil.com", false);
    expect(isTrusted).toBe(false);
  });

  test("allows relative URLs (\"/relative\")", async ({ page }) => {
    const isTrusted = await expectToBeTrusted(page, "/relative", true);
    expect(isTrusted).toBe(true);
  });

  test("allows absolute URLs from the base origin", async ({ page }) => {
    const isTrusted = await expectToBeTrusted(page, "http://www.example.com/path/to/file.html", true);
    expect(isTrusted).toBe(true);
  });

  test("tracks changes to the base URL", async ({ page }) => {
    await page.evaluate(() => {
      document.getElementsByTagName("base")[0].href = "http://xxx.example.com/";
    });
    
    const isTrusted1 = await expectToBeTrusted(page, "http://xxx.example.com/path/to/file.html", true);
    expect(isTrusted1).toBe(true);
    
    const isTrusted2 = await expectToBeTrusted(page, "http://www.example.com/path/to/file.html", false);
    expect(isTrusted2).toBe(false);
  });

  // Helper function
  async function expectToBeTrusted(page, url, expectedTrusted) {
    const urlIsTrusted = await page.evaluate((testUrl) => {
      return window.isTrustedUrl(testUrl);
    }, url);
    return urlIsTrusted;
  }
});