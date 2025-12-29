const { test, expect } = require("@playwright/test");
const { loadFixture } = require("./helpers/angular-helpers.cjs");

test.describe("$anchorScroll", () => {
  test.describe("basic functionality", () => {
    test.beforeEach(async ({ page }) => {
      await loadFixture(page, "anchor-scroll");
    });

    test("should scroll to #bottom when clicking #top and vice versa", async ({ page }) => {
      // Check initial state - top should be visible, bottom should not
      await expect(page.locator('#top')).toBeInViewport();
      await expect(page.locator('#bottom')).not.toBeInViewport();

      // Click top link to scroll to bottom
      await page.locator('#top').click();
      await expect(page.locator('#top')).not.toBeInViewport();
      await expect(page.locator('#bottom')).toBeInViewport();

      // Click bottom link to scroll back to top
      await page.locator('#bottom').click();
      await expect(page.locator('#top')).toBeInViewport();
      await expect(page.locator('#bottom')).not.toBeInViewport();
    });
  });

  test.describe("with yOffset", () => {
    const yOffset = 50;

    test.beforeEach(async ({ page }) => {
      await loadFixture(page, "anchor-scroll-y-offset");
    });

    test("should scroll to the correct anchor when clicking each button", async ({ page }) => {
      const buttons = page.locator('[ng-repeat="x in [1, 2, 3, 4, 5]"]').filter({ hasText: 'Scroll to anchor-' });
      const anchors = page.locator('[ng-repeat="y in [1, 2, 3, 4, 5]"]').filter({ hasText: 'Anchor' });
      
      // Get the last anchor to check if we have enough room
      const lastAnchor = anchors.last();
      const lastAnchorBox = await lastAnchor.boundingBox();
      
      if (lastAnchorBox) {
        const tempHeight = lastAnchorBox.height - 10;
        
        // Set temporary viewport height
        await page.setViewportSize({ width: 1280, height: tempHeight });
        
        // Test each button
        const buttonCount = await buttons.count();
        for (let i = 0; i < buttonCount; i++) {
          await buttons.nth(i).click();
          
          const anchorId = `anchor-${i + 1}`;
          const anchor = page.locator(`#${anchorId}`);
          
          // Check if anchor is in viewport
          await expect(anchor).toBeInViewport();
          
          // Check if anchor is at the correct offset from top
          const anchorBox = await anchor.boundingBox();
          if (anchorBox) {
            expect(Math.abs(anchorBox.y - yOffset)).toBeLessThanOrEqual(1);
          }
        }
        
        // Restore viewport
        await page.setViewportSize({ width: 1280, height: 720 });
      }
    });

    test("should automatically scroll when navigating to a URL with a hash", async ({ page }) => {
      const lastAnchorId = 'anchor-5';
      const lastAnchor = page.locator(`#${lastAnchorId}`);
      const lastAnchorBox = await lastAnchor.boundingBox();
      
      if (lastAnchorBox) {
        const tempHeight = lastAnchorBox.height - 10;
        
        // Set temporary viewport height
        await page.setViewportSize({ width: 1280, height: tempHeight });
        
        // Initially, last anchor should not be in viewport
        await expect(lastAnchor).not.toBeInViewport();

        // Navigate to the anchor using hash
        await page.goto(page.url() + '#' + lastAnchorId);
        
        // Check if anchor is now in viewport and at correct position
        await expect(lastAnchor).toBeInViewport();
        const anchorBox = await lastAnchor.boundingBox();
        if (anchorBox) {
          expect(Math.abs(anchorBox.y - yOffset)).toBeLessThanOrEqual(1);
        }

        // Test direct navigation by refreshing
        await scrollToTop(page);
        await expect(lastAnchor).not.toBeInViewport();

        await page.reload();
        await expect(lastAnchor).toBeInViewport();
        const anchorBoxAfterRefresh = await lastAnchor.boundingBox();
        if (anchorBoxAfterRefresh) {
          expect(Math.abs(anchorBoxAfterRefresh.y - yOffset)).toBeLessThanOrEqual(1);
        }
        
        // Restore viewport
        await page.setViewportSize({ width: 1280, height: 720 });
      }
    });

    test("should not scroll \"overzealously\"", async ({ page }) => {
      // Skip for Firefox as mentioned in original test
      const userAgent = await page.evaluate(() => navigator.userAgent);
      if (userAgent.includes('Firefox')) {
        test.skip();
        return;
      }

      const lastButton = page.locator('[ng-repeat="x in [1, 2, 3, 4, 5]"]').filter({ hasText: 'Scroll to anchor-5' });
      const lastAnchor = page.locator('#anchor-5');
      const lastAnchorId = 'anchor-5';
      
      const lastAnchorBox = await lastAnchor.boundingBox();
      
      if (lastAnchorBox) {
        const tempHeight = lastAnchorBox.height + (yOffset / 2);
        
        // Set viewport so there's not enough room to scroll anchor to top
        await page.setViewportSize({ width: 1280, height: tempHeight });
        
        // Scroll anchor into view first
        await scrollIntoView(page, lastAnchorId);
        
        // Check initial position
        let anchorBox = await lastAnchor.boundingBox();
        if (anchorBox) {
          expect(Math.abs(anchorBox.y - (yOffset / 2))).toBeLessThanOrEqual(1);
        }

        // Click the button
        await lastButton.click();
        
        // Check final position - should be in viewport and at yOffset
        await expect(lastAnchor).toBeInViewport();
        anchorBox = await lastAnchor.boundingBox();
        if (anchorBox) {
          expect(Math.abs(anchorBox.y - yOffset)).toBeLessThanOrEqual(1);
        }
        
        // Restore viewport
        await page.setViewportSize({ width: 1280, height: 720 });
      }
    });
  });

  // Helper functions
  async function scrollIntoView(page, id) {
    await page.evaluate((elementId) => {
      document.getElementById(elementId).scrollIntoView();
    }, id);
  }

  async function scrollToTop(page) {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }
});