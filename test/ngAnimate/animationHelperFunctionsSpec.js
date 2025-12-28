'use strict';

describe('animation option helper functions', () => {

  beforeEach(angular.mock.module('ngAnimate'));

  let element, applyAnimationClasses;
  beforeEach(angular.mock.inject($$jqLite => {
    applyAnimationClasses = ngInternals.applyAnimationClassesFactory($$jqLite);
    element = angular.element('<div></div>');
  }));

  describe('prepareAnimationOptions', () => {
    it('should construct an options wrapper from the provided options',
      angular.mock.inject(() => {

        const options = ngInternals.prepareAnimationOptions({
          value: 'hello'
        });

        expect(options.value).toBe('hello');
      }));

    it('should return the same instance it already instantiated as an options object with the given element',
      angular.mock.inject(() => {

        const options = ngInternals.prepareAnimationOptions({});
        expect(ngInternals.prepareAnimationOptions(options)).toBe(options);

        const options2 = {};
        expect(ngInternals.prepareAnimationOptions(options2)).not.toBe(options);
      }));
  });

  describe('applyAnimationStyles', () => {
    it('should apply the provided `from` styles', angular.mock.inject(() => {
      const options = ngInternals.prepareAnimationOptions({
        from: { color: 'maroon' },
        to: { color: 'blue' }
      });

      ngInternals.applyAnimationFromStyles(element, options);
      expect(element.attr('style')).toContain('maroon');
    }));

    it('should apply the provided `to` styles', angular.mock.inject(() => {
      const options = ngInternals.prepareAnimationOptions({
        from: { color: 'red' },
        to: { color: 'black' }
      });

      ngInternals.applyAnimationToStyles(element, options);
      expect(element.attr('style')).toContain('black');
    }));

    it('should apply the both provided `from` and `to` styles', angular.mock.inject(() => {
      const options = ngInternals.prepareAnimationOptions({
        from: { color: 'red', 'font-size': '50px' },
        to: { color: 'green' }
      });

      ngInternals.applyAnimationStyles(element, options);
      expect(element.attr('style')).toContain('green');
      expect(element.css('font-size')).toBe('50px');
    }));

    it('should only apply the options once', angular.mock.inject(() => {
      const options = ngInternals.prepareAnimationOptions({
        from: { color: 'red', 'font-size': '50px' },
        to: { color: 'blue' }
      });

      ngInternals.applyAnimationStyles(element, options);
      expect(element.attr('style')).toContain('blue');

      element.attr('style', '');

      ngInternals.applyAnimationStyles(element, options);
      expect(element.attr('style') || '').toBe('');
    }));
  });

  describe('applyAnimationClasses', () => {
    it('should add/remove the provided CSS classes', angular.mock.inject(() => {
      element.addClass('four six');
      const options = ngInternals.prepareAnimationOptions({
        addClass: 'one two three',
        removeClass: 'four'
      });

      applyAnimationClasses(element, options);
      expect(element).toHaveClass('one two three');
      expect(element).toHaveClass('six');
      expect(element).not.toHaveClass('four');
    }));

    it('should add/remove the provided CSS classes only once', angular.mock.inject(() => {
      element.attr('class', 'blue');
      const options = ngInternals.prepareAnimationOptions({
        addClass: 'black',
        removeClass: 'blue'
      });

      applyAnimationClasses(element, options);
      element.attr('class', 'blue');

      applyAnimationClasses(element, options);
      expect(element).toHaveClass('blue');
      expect(element).not.toHaveClass('black');
    }));
  });

  describe('mergeAnimationDetails', () => {
    it('should merge in new options', angular.mock.inject(() => {
      element.attr('class', 'blue');
      const options = ngInternals.prepareAnimationOptions({
        name: 'matias',
        age: 28,
        addClass: 'black',
        removeClass: 'blue gold'
      });

      const animation1 = { options: options };
      const animation2 = {
        options: {
          age: 29,
          addClass: 'gold brown',
          removeClass: 'orange'
        }
      };

      ngInternals.mergeAnimationDetails(element, animation1, animation2);

      expect(options.name).toBe('matias');
      expect(options.age).toBe(29);
      expect(options.addClass).toBe('black brown');
      expect(options.removeClass).toBe('blue');
    }));
  });
});
