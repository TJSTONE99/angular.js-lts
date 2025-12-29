"use strict";

/**
 * Playwright fixture loader
 * @param {import('@playwright/test').Page} page
 */
function createFixtureHelper(page) {
  const helper = {
    loadFixture(fixture) {
      let i = 0;
      while (fixture[i] === "/") ++i;
      fixture = fixture.slice(i);

      if (!/\/(index\.html)?$/.test(fixture)) {
        fixture += "/";
      }

      if (process.env.USE_JQUERY) {
        fixture += "?jquery";
      }

      return page.goto(`/e2e/fixtures/${fixture}`);
    },
  };

  return helper;
}

module.exports = {
  createFixtureHelper
};
