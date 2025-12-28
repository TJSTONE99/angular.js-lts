'use strict';

describe('$rootElement', () => {
  it('should publish the bootstrap element into $rootElement', () => {
    window.name = "";

    const element = angular.element('<div></div>');
    const injector = angular.bootstrap(element);

    expect(injector.get('$rootElement')[0]).toBe(element[0]);

    dealoc(element);
  });
});
