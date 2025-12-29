const { test, expect } = require("@playwright/test");
const { loadFixture, getAngularVersion } = require("./helpers/angular-helpers.cjs");

test.describe("angular.version", () => {
  test.beforeEach(async ({ page }) => {
    await loadFixture(page, "version");
  });

  test("should expose the current version as object", async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(version).toBeTruthy();
    expect(typeof version).toBe("object");
  });

  test("should contain property `full` (string)", async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(typeof version.full).toBe("string");
  });

  test("should contain property `major` (number)", async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(typeof version.major).toBe("number");
  });

  test("should contain property `minor` (number)", async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(typeof version.minor).toBe("number");
  });

  test("should contain property `dot` (number)", async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(typeof version.dot).toBe("number");
  });

  test("should contain property `codeName` (string)", async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(typeof version.codeName).toBe("string");
  });

  test('should not contain "NG_VERSION_" in `codeName`', async ({ page }) => {
    const version = await getAngularVersion(page);
    expect(version.codeName).not.toMatch(/NG_VERSION_/);
  });

  test('`full` property should start with "major.minor.dot"', async ({ page }) => {
    const version = await getAngularVersion(page);

    const prefix = [version.major, version.minor, version.dot].join(".");
    expect(version.full.startsWith(prefix)).toBe(true);
  });
});