describe('CSS Animation Properties', () => {

  beforeEach(async () => {
    // Clean up any previous test state
    await page.evaluate(() => {
      const container = document.getElementById('test-container');
      if (container) {
        container.innerHTML = '';
      }

      // Remove any existing style tags from previous tests
      const existingStyles = document.querySelectorAll('style[data-test-style]');
      existingStyles.forEach(style => style.remove());
    });
  });

  describe('CSS Transition Duration and Delay', () => {
    it('should properly handle transition-duration property', async () => {
      const result = await page.evaluate(() => {
        try {
          // Create element with transition duration
          const element = document.createElement('div');
          element.style.transitionDuration = '5s';
          document.body.appendChild(element);

          // Test getComputedStyle
          const computedStyle = getComputedStyle(element);
          const duration = computedStyle.transitionDuration;

          // Clean up
          document.body.removeChild(element);

          return {
            success: true,
            duration: duration
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBe('5s');
    });

    it('should properly handle transition-delay property including negative values', async () => {
      const result = await page.evaluate(() => {
        try {
          const results = [];

          // Test various delay values
          const delays = ['2s', '-5s', '-10s', '400s'];

          delays.forEach(delay => {
            const element = document.createElement('div');
            element.style.transitionDelay = delay;
            document.body.appendChild(element);

            const computedStyle = getComputedStyle(element);
            const actualDelay = computedStyle.transitionDelay;

            results.push({
              expected: delay,
              actual: actualDelay
            });

            document.body.removeChild(element);
          });

          return {
            success: true,
            results: results
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      result.results.forEach(test => {
        expect(test.actual).toBe(test.expected);
      });
    });

    it('should properly handle transition-property', async () => {
      const result = await page.evaluate(() => {
        try {
          const element = document.createElement('div');
          element.style.transitionProperty = 'all';
          document.body.appendChild(element);

          const computedStyle = getComputedStyle(element);
          const property = computedStyle.transitionProperty;

          document.body.removeChild(element);

          return {
            success: true,
            property: property
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.property).toBe('all');
    });
  });

  describe('CSS Animation Duration and Delay', () => {
    it('should properly handle animation-duration property', async () => {
      const result = await page.evaluate(() => {
        try {
          const element = document.createElement('div');
          element.style.animationDuration = '5s';
          document.body.appendChild(element);

          const computedStyle = getComputedStyle(element);
          const duration = computedStyle.animationDuration;

          document.body.removeChild(element);

          return {
            success: true,
            duration: duration
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.duration).toBe('5s');
    });

    it('should properly handle animation-delay property including negative values', async () => {
      const result = await page.evaluate(() => {
        try {
          const results = [];

          // Test various delay values
          const delays = ['10s', '-1s', '-2s', '50s'];

          delays.forEach(delay => {
            const element = document.createElement('div');
            element.style.animationDelay = delay;
            document.body.appendChild(element);

            const computedStyle = getComputedStyle(element);
            const actualDelay = computedStyle.animationDelay;

            results.push({
              expected: delay,
              actual: actualDelay
            });

            document.body.removeChild(element);
          });

          return {
            success: true,
            results: results
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      result.results.forEach(test => {
        expect(test.actual).toBe(test.expected);
      });
    });

    it('should properly handle animation-timing-function', async () => {
      const result = await page.evaluate(() => {
        try {
          const element = document.createElement('div');
          element.style.animationTimingFunction = 'ease-out';
          document.body.appendChild(element);

          const computedStyle = getComputedStyle(element);
          const timingFunction = computedStyle.animationTimingFunction;

          document.body.removeChild(element);

          return {
            success: true,
            timingFunction: timingFunction
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.timingFunction).toBe('ease-out');
    });
  });

  describe('CSS Style Attribute Manipulation', () => {
    it('should properly set and read style attributes', async () => {
      const result = await page.evaluate(() => {
        try {
          const element = document.createElement('div');

          // Set multiple style properties
          element.style.transitionDelay = '-10s';
          element.style.transitionDuration = '2.5s';
          element.style.transitionProperty = 'all';

          document.body.appendChild(element);

          // Read back the values
          const delay = element.style.transitionDelay;
          const duration = element.style.transitionDuration;
          const property = element.style.transitionProperty;
          const styleAttr = element.getAttribute('style');

          document.body.removeChild(element);

          return {
            success: true,
            delay: delay,
            duration: duration,
            property: property,
            styleAttr: styleAttr,
            containsDelay: styleAttr.includes('transition-delay'),
            containsDuration: styleAttr.includes('transition-duration')
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.delay).toBe('-10s');
      expect(result.duration).toBe('2.5s');
      expect(result.property).toBe('all');
      expect(result.containsDelay).toBe(true);
      expect(result.containsDuration).toBe(true);
    });

    it('should properly remove style properties', async () => {
      const result = await page.evaluate(() => {
        try {
          const element = document.createElement('div');

          // Set style properties
          element.style.transitionDelay = '-5s';
          element.style.transitionDuration = '1s';

          document.body.appendChild(element);

          // Verify they are set
          const initialStyle = element.getAttribute('style');
          const hasDelayBefore = initialStyle.includes('transition-delay');

          // Remove transition-delay
          element.style.transitionDelay = '';

          // Check final state
          const finalStyle = element.getAttribute('style');
          const hasDelayAfter = finalStyle.includes('transition-delay');
          const hasDurationAfter = finalStyle.includes('transition-duration');

          document.body.removeChild(element);

          return {
            success: true,
            hasDelayBefore: hasDelayBefore,
            hasDelayAfter: hasDelayAfter,
            hasDurationAfter: hasDurationAfter,
            initialStyle: initialStyle,
            finalStyle: finalStyle
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.hasDelayBefore).toBe(true);
      expect(result.hasDelayAfter).toBe(false);
      expect(result.hasDurationAfter).toBe(true);
    });
  });

  describe('CSS Class and Animation State', () => {
    it('should properly handle CSS classes with animation properties', async () => {
      const result = await page.evaluate(() => {
        try {
          // Add CSS rule
          const style = document.createElement('style');
          style.setAttribute('data-test-style', 'true');
          style.textContent = `
            .animate-class {
              transition: 1.5s linear all;
              animation: slideIn 2s ease;
            }
            @keyframes slideIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `;
          document.head.appendChild(style);

          const element = document.createElement('div');
          element.className = 'animate-class';
          document.body.appendChild(element);

          // Get computed styles
          const computedStyle = getComputedStyle(element);
          const transitionDuration = computedStyle.transitionDuration;
          const animationDuration = computedStyle.animationDuration;
          const animationName = computedStyle.animationName;

          // Clean up
          document.body.removeChild(element);
          document.head.removeChild(style);

          return {
            success: true,
            transitionDuration: transitionDuration,
            animationDuration: animationDuration,
            animationName: animationName
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.transitionDuration).toBe('1.5s');
      expect(result.animationDuration).toBe('2s');
      expect(result.animationName).toBe('slideIn');
    });

    it('should properly handle element class manipulation', async () => {
      const result = await page.evaluate(() => {
        try {
          const element = document.createElement('div');
          element.className = 'initial-class';
          document.body.appendChild(element);

          // Test class operations
          const hasInitial = element.classList.contains('initial-class');

          element.classList.add('ng-enter');
          element.classList.add('ng-enter-active');

          const hasEnter = element.classList.contains('ng-enter');
          const hasEnterActive = element.classList.contains('ng-enter-active');

          element.classList.remove('ng-enter');

          const hasEnterAfterRemove = element.classList.contains('ng-enter');
          const hasEnterActiveAfterRemove = element.classList.contains('ng-enter-active');

          document.body.removeChild(element);

          return {
            success: true,
            hasInitial: hasInitial,
            hasEnter: hasEnter,
            hasEnterActive: hasEnterActive,
            hasEnterAfterRemove: hasEnterAfterRemove,
            hasEnterActiveAfterRemove: hasEnterActiveAfterRemove,
            finalClassName: element.className
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.hasInitial).toBe(true);
      expect(result.hasEnter).toBe(true);
      expect(result.hasEnterActive).toBe(true);
      expect(result.hasEnterAfterRemove).toBe(false);
      expect(result.hasEnterActiveAfterRemove).toBe(true);
    });
  });

  describe('Animation Events', () => {
    it('should support TransitionEvent and AnimationEvent constructors', async () => {
      const result = await page.evaluate(() => {
        try {
          // Test TransitionEvent
          const transitionEvent = new TransitionEvent('transitionend', {
            propertyName: 'opacity',
            elapsedTime: 1.5
          });

          // Test AnimationEvent
          const animationEvent = new AnimationEvent('animationend', {
            animationName: 'slideIn',
            elapsedTime: 2.0
          });

          return {
            success: true,
            hasTransitionEvent: transitionEvent instanceof TransitionEvent,
            hasAnimationEvent: animationEvent instanceof AnimationEvent,
            transitionPropertyName: transitionEvent.propertyName,
            transitionElapsedTime: transitionEvent.elapsedTime,
            animationName: animationEvent.animationName,
            animationElapsedTime: animationEvent.elapsedTime
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      expect(result.success).toBe(true);
      expect(result.hasTransitionEvent).toBe(true);
      expect(result.hasAnimationEvent).toBe(true);
      expect(result.transitionPropertyName).toBe('opacity');
      expect(result.transitionElapsedTime).toBe(1.5);
      expect(result.animationName).toBe('slideIn');
      expect(result.animationElapsedTime).toBe(2.0);
    });
  });
});