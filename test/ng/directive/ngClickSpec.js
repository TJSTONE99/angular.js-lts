'use strict';

describe('ngClick', () => {
  let element;

  afterEach(() => {
    dealoc(element);
  });

  it('should get called on a click', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-click="clicked = true"></div>')($rootScope);
    $rootScope.$digest();
    expect($rootScope.clicked).toBeFalsy();

    browserTrigger(element, 'click');
    expect($rootScope.clicked).toEqual(true);
  }));

  it('should pass event object', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-click="event = $event"></div>')($rootScope);
    $rootScope.$digest();

    browserTrigger(element, 'click');
    expect($rootScope.event).toBeDefined();
  }));
});
