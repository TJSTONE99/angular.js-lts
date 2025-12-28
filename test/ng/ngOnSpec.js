'use strict';

describe('ngOn* event binding', () => {
  let scope, element, exposedAttrs;

  beforeEach(() => {
    exposedAttrs = undefined;
  });

  // Register once, before any injector is created (i.e. before any inject()).
  beforeEach(angular.mock.module($compileProvider => {
    $compileProvider.directive('attrExposer', ngInternals.valueFn({
      link: function ($scope, $element, $attrs) {
        exposedAttrs = $attrs;
      }
    }));
  }));

  beforeEach(angular.mock.inject($rootScope => {
    scope = $rootScope.$new();
  }));

  afterEach(() => {
    if (element) {
      dealoc(element);
      element = null;
    }
    if (scope) {
      scope.$destroy();
      scope = null;
    }
  });

  function compile($compile, html) {
    if (element) {
      dealoc(element);
      element = null;
    }
    element = $compile(html)(scope);
    return element;
  }

  it('should add event listener of specified name', angular.mock.inject($compile => {
    scope.name = 'Misko';
    element = compile($compile, '<span ng-on-foo="name = name + 3"></span>');
    element.triggerHandler('foo');
    expect(scope.name).toBe('Misko3');
  }));

  it('should use angular.element(x).on() API to add listener', angular.mock.inject($compile => {
    jest.spyOn(angular.element.prototype, 'on');

    element = compile($compile, '<span ng-on-foo="name = name + 3"></span>');

    expect(angular.element.prototype.on).toHaveBeenCalledWith('foo', expect.any(Function));
  }));

  it('should allow access to the $event object', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-foo="e = $event"></span>');
    element.triggerHandler('foo');
    expect(scope.e.target).toBe(element[0]);
  }));

  it('should call the listener synchronously', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-foo="fooEvent()"></span>');
    scope.fooEvent = jest.fn();

    element.triggerHandler('foo');

    expect(scope.fooEvent).toHaveBeenCalledTimes(1);
  }));

  it('should support multiple events on a single element', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-foo="fooEvent()" ng-on-bar="barEvent()"></span>');
    scope.fooEvent = jest.fn();
    scope.barEvent = jest.fn();

    element.triggerHandler('foo');
    expect(scope.fooEvent).toHaveBeenCalled();
    expect(scope.barEvent).not.toHaveBeenCalled();

    scope.fooEvent.mockClear();
    scope.barEvent.mockClear();

    element.triggerHandler('bar');
    expect(scope.fooEvent).not.toHaveBeenCalled();
    expect(scope.barEvent).toHaveBeenCalled();
  }));

  it('should work with different prefixes', angular.mock.inject($compile => {
    const cb = scope.cb = jest.fn();
    element = compile($compile, '<span ng:on:test="cb(1)" ng-On-test2="cb(2)" ng_On_test3="cb(3)"></span>');

    element.triggerHandler('test');
    expect(cb).toHaveBeenCalledWith(1);

    element.triggerHandler('test2');
    expect(cb).toHaveBeenCalledWith(2);

    element.triggerHandler('test3');
    expect(cb).toHaveBeenCalledWith(3);
  }));

  it('should work if they are prefixed with x- or data- and different prefixes', angular.mock.inject($compile => {
    const cb = scope.cb = jest.fn();
    element = compile(
      $compile,
      '<span data-ng-on-test2="cb(2)" x-ng-on-test3="cb(3)" data-ng:on-test4="cb(4)" ' +
      'x_ng-on-test5="cb(5)" data:ng-on-test6="cb(6)"></span>'
    );

    element.triggerHandler('test2');
    expect(cb).toHaveBeenCalledWith(2);

    element.triggerHandler('test3');
    expect(cb).toHaveBeenCalledWith(3);

    element.triggerHandler('test4');
    expect(cb).toHaveBeenCalledWith(4);

    element.triggerHandler('test5');
    expect(cb).toHaveBeenCalledWith(5);

    element.triggerHandler('test6');
    expect(cb).toHaveBeenCalledWith(6);
  }));

  it('should work independently of attributes with the same name', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-asdf="cb()" asdf="foo" />');
    const cb = scope.cb = jest.fn();
    scope.$digest();
    element.triggerHandler('asdf');
    expect(cb).toHaveBeenCalled();
    expect(element.attr('asdf')).toBe('foo');
  }));

  it('should work independently of (ng-)attributes with the same name', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-asdf="cb()" ng-attr-asdf="foo" />');
    const cb = scope.cb = jest.fn();
    scope.$digest();
    element.triggerHandler('asdf');
    expect(cb).toHaveBeenCalled();
    expect(element.attr('asdf')).toBe('foo');
  }));

  it('should work independently of properties with the same name', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-asdf="cb()" ng-prop-asdf="123" />');
    const cb = scope.cb = jest.fn();
    scope.$digest();
    element.triggerHandler('asdf');
    expect(cb).toHaveBeenCalled();
    expect(element.prop('asdf')).toBe(123);
  }));

  it('should use the full ng-on-* attribute name in $attr mappings', () => {
    angular.mock.inject($compile => {
      element = compile($compile, '<div attr-exposer ng-on-title="cb(1)" ng-on-super-title="cb(2)" ng-on-my-camel_title="cb(3)"></div>');
      scope.$digest();

      const attrs = exposedAttrs;

      expect(attrs.title).toBeUndefined();
      expect(attrs.$attr.title).toBeUndefined();
      expect(attrs.ngOnTitle).toBe('cb(1)');
      expect(attrs.$attr.ngOnTitle).toBe('ng-on-title');

      expect(attrs.superTitle).toBeUndefined();
      expect(attrs.$attr.superTitle).toBeUndefined();
      expect(attrs.ngOnSuperTitle).toBe('cb(2)');
      expect(attrs.$attr.ngOnSuperTitle).toBe('ng-on-super-title');

      expect(attrs.myCamelTitle).toBeUndefined();
      expect(attrs.$attr.myCamelTitle).toBeUndefined();
      expect(attrs.ngOnMyCamelTitle).toBe('cb(3)');
      expect(attrs.$attr.ngOnMyCamelTitle).toBe('ng-on-my-camel_title');
    });
  });

  it('should not conflict with (ng-attr-)attribute mappings of the same name', () => {
    angular.mock.inject($compile => {
      element = compile($compile, '<div attr-exposer ng-on-title="42" ng-attr-title="foo" title="bar"></div>');
      scope.$digest();

      const attrs = exposedAttrs;

      expect(attrs.title).toBe('foo');
      expect(attrs.$attr.title).toBe('title');
      expect(attrs.$attr.ngOnTitle).toBe('ng-on-title');
    });
  });

  it('should correctly bind to kebab-cased event names', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-foo-bar="cb()"></span>');
    const cb = scope.cb = jest.fn();
    scope.$digest();

    element.triggerHandler('foobar');
    element.triggerHandler('fooBar');
    element.triggerHandler('foo_bar');
    element.triggerHandler('foo:bar');
    expect(cb).not.toHaveBeenCalled();

    element.triggerHandler('foo-bar');
    expect(cb).toHaveBeenCalled();
  }));

  it('should correctly bind to camelCased event names', angular.mock.inject($compile => {
    element = compile($compile, '<span ng-on-foo_bar="cb()"></span>');
    const cb = scope.cb = jest.fn();
    scope.$digest();

    element.triggerHandler('foobar');
    element.triggerHandler('foo-bar');
    element.triggerHandler('foo_bar');
    element.triggerHandler('foo:bar');
    expect(cb).not.toHaveBeenCalled();

    element.triggerHandler('fooBar');
    expect(cb).toHaveBeenCalled();
  }));
});
