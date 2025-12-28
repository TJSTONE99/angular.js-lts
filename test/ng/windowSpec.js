'use strict';

describe('$window', () => {
  it('should inject $window', angular.mock.inject($window => {
    expect($window).toBe(window);
  }));

  it('should be able to mock $window without errors', () => {
    angular.mock.module({ $window: {} });
    angular.mock.inject(['$sce', angular.noop]);
  });
});
