'use strict';

describe('ngAnimate integration tests', () => {

  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  let element, html, ss;
  beforeEach(angular.mock.module(() => {
    return ($rootElement, $document, $animate) => {
      $animate.enabled(true);

      ss = createMockStyleSheet($document);

      const body = angular.element($document[0].body);
      html = element => {
        body.append($rootElement);
        $rootElement.append(element);
      };
    };
  }));

  afterEach(angular.mock.inject(($rootElement, $animate) => {
    // ensure pending animations are not left hanging
    try { $animate.flush(); } catch (e) { }

    // remove root from DOM so jqLite data/scope refs can be GC’d
    $rootElement.remove();
    dealoc($rootElement);

    dealoc(element);
    ss.destroy();
  }));

  it('should not alter the provided options values in anyway throughout the animation', angular.mock.inject(($animate, $rootScope, $compile) => {
    element = angular.element('<div class="parent-man"></div>');
    const child = angular.element('<div class="child-man one"></div>');

    const initialOptions = {
      from: { height: '50px' },
      to: { width: '100px' },
      addClass: 'one',
      removeClass: 'two',
      domOperation: undefined
    };

    const copiedOptions = angular.copy(initialOptions);
    expect(copiedOptions).toEqual(initialOptions);

    html(element);
    $compile(element)($rootScope);

    $animate.enter(child, element, null, copiedOptions);
    $rootScope.$digest();
    expect(copiedOptions).toEqual(initialOptions);

    $animate.flush();
    expect(copiedOptions).toEqual(initialOptions);

    expect(child).toHaveClass('one');
    expect(child).not.toHaveClass('two');

    expect(child.attr('style')).toContain('100px');
    expect(child.attr('style')).toContain('50px');
  }));

});
