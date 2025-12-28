'use strict';

describe('ngStyle', () => {
  let element;


  afterEach(() => {
    dealoc(element);
  });


  it('should set', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-style="{height: \'40px\'}"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.css('height')).toEqual('40px');
  }));


  it('should silently ignore undefined style', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-style="myStyle"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.hasClass('ng-exception')).toBeFalsy();
  }));


  it('should not deep watch objects', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-style="{height: heightObj.value}"></div>')($rootScope);
    $rootScope.$digest();
    expect(parseInt(element.css('height') + 0, 10)).toEqual(0); // height could be '' or '0px'
    $rootScope.heightObj = { value: '40px' };
    $rootScope.$digest();
    expect(element.css('height')).toBe('40px');

    element.css('height', '10px');
    $rootScope.heightObj.otherProp = 123;
    $rootScope.$digest();
    expect(element.css('height')).toBe('10px');
  }));


  it('should support binding for object literals', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-style="{height: heightStr}"></div>')($rootScope);
    $rootScope.$digest();
    expect(parseInt(element.css('height') + 0, 10)).toEqual(0); // height could be '' or '0px'
    $rootScope.$apply('heightStr = "40px"');
    expect(element.css('height')).toBe('40px');

    $rootScope.$apply('heightStr = "100px"');
    expect(element.css('height')).toBe('100px');
  }));


  it('should support lazy one-time binding for object literals', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<div ng-style="::{height: heightStr}"></div>')($rootScope);
    $rootScope.$digest();
    expect(parseInt(element.css('height') + 0, 10)).toEqual(0); // height could be '' or '0px'
    $rootScope.$apply('heightStr = "40px"');
    expect(element.css('height')).toBe('40px');
  }));


  describe('preserving styles set before and after compilation', () => {
    let scope, preCompStyle, preCompVal, postCompStyle, postCompVal, element;

    beforeEach(angular.mock.inject(($rootScope, $compile) => {
      preCompStyle = 'width';
      preCompVal = '300px';
      postCompStyle = 'height';
      postCompVal = '100px';
      element = angular.element('<div ng-style="styleObj"></div>');
      element.css(preCompStyle, preCompVal);
      angular.element(window.document.body).append(element);
      $compile(element)($rootScope);
      scope = $rootScope;
      scope.styleObj = { 'margin-top': '44px' };
      scope.$apply();
      element.css(postCompStyle, postCompVal);
    }));

    afterEach(() => {
      element.remove();
    });


    it('should not mess up stuff after compilation', () => {
      element.css('margin', '44px');
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
    });


    it('should not mess up stuff after $apply with no model changes', () => {
      element.css('padding-top', '33px');
      scope.$apply();
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
      expect(element.css('padding-top')).toBe('33px');
    });


    it('should not mess up stuff after $apply with non-colliding model changes', () => {
      scope.styleObj = { 'padding-top': '99px' };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe(preCompVal);
      expect(element.css('margin-top')).toBe('44px');
      expect(element.css('padding-top')).toBe('99px');
      expect(element.css(postCompStyle)).toBe(postCompVal);
    });


    it('should overwrite original styles after a colliding model change', () => {
      scope.styleObj = { 'height': '99px', 'width': '88px' };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = {};
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    it('should clear style when the new model is null', () => {
      scope.styleObj = { 'height': '99px', 'width': '88px' };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = null;
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    it('should clear style when the value is undefined or null', () => {
      scope.styleObj = { 'height': '99px', 'width': '88px' };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = { 'height': undefined, 'width': null };
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    it('should clear style when the value is false', () => {
      scope.styleObj = { 'height': '99px', 'width': '88px' };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = { 'height': false, 'width': false };
      scope.$apply();
      expect(element.css(preCompStyle)).not.toBe('88px');
      expect(element.css(postCompStyle)).not.toBe('99px');
    });

    it('should set style when the value is zero', () => {
      scope.styleObj = { 'height': '99px', 'width': '88px' };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('88px');
      expect(element.css(postCompStyle)).toBe('99px');
      scope.styleObj = { 'height': 0, 'width': 0 };
      scope.$apply();
      expect(element.css(preCompStyle)).toBe('0px');
      expect(element.css(postCompStyle)).toBe('0px');
    });
  });
});
