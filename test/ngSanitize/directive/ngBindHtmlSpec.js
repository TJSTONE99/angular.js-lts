'use strict';


describe('ngBindHtml', () => {
  beforeEach(angular.mock.module('ngSanitize'));

  it('should set html', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = '<div unknown>hello</div>';
    $rootScope.$digest();
    expect((element.html()).toLowerCase()).toEqual('<div>hello</div>');
    dealoc(element);
  }));


  it('should reset html when value is null or undefined', angular.mock.inject(($compile, $rootScope) => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    angular.forEach([null, undefined, ''], val => {
      $rootScope.html = 'some val';
      $rootScope.$digest();
      expect((element.html()).toLowerCase()).toEqual('some val');

      $rootScope.html = val;
      $rootScope.$digest();
      expect((element.html()).toLowerCase()).toEqual('');
      dealoc(element);
    });
  }));
});
