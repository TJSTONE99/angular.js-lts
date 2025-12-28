'use strict';

describe('a', () => {
  let element;
  let $compile;
  let $rootScope;

  const createClickEvent = () => {
    const event = window.document.createEvent('MouseEvent');
    event.initMouseEvent(
      'click',
      true,
      true,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    return event;
  };

  const wrapPreventDefault = (event, onCalled) => {
    event.preventDefaultOrg = event.preventDefault;
    event.preventDefault = function () {
      onCalled();
      if (this.preventDefaultOrg) {
        this.preventDefaultOrg();
      }
    };
  };

  beforeEach(angular.mock.module(($compileProvider) => {
    $compileProvider
      .directive(
        'linkTo',
        ngInternals.valueFn({
          restrict: 'A',
          template:
            '<div class="my-link"><a href="{{destination}}">{{destination}}</a></div>',
          replace: true,
          scope: {
            destination: '@linkTo'
          }
        })
      )
      .directive(
        'linkNot',
        ngInternals.valueFn({
          restrict: 'A',
          template: '<div class="my-link"><a href>{{destination}}</a></div>',
          replace: true,
          scope: {
            destination: '@linkNot'
          }
        })
      );
  }));

  beforeEach(
    angular.mock.inject((_$compile_, _$rootScope_) => {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    })
  );

  afterEach(() => {
    dealoc(element);
  });

  it('should prevent default action to be executed when href is empty', () => {
    const orgLocation = window.document.location.href;
    let preventDefaultCalled = false;

    element = $compile('<a href="">empty link</a>')($rootScope);

    const event = createClickEvent();
    wrapPreventDefault(event, () => {
      preventDefaultCalled = true;
    });

    element[0].dispatchEvent(event);

    expect(preventDefaultCalled).toEqual(true);
    expect(window.document.location.href).toEqual(orgLocation);
  });

  it('should prevent IE for changing text content when setting attribute', () => {
    element = angular.element('<a href="">hello@you</a>');
    $compile(element)($rootScope);
    element.attr('href', 'bye@me');

    expect(element.text()).toBe('hello@you');
  });

  it('should not link and hookup an event if href is present at compile', () => {
    element = angular.element('<a href="//a.com">hello@you</a>');
    const linker = $compile(element);

    const spy = jest
      .spyOn(angular.element.prototype, 'on')
      .mockImplementation(() => { });

    linker($rootScope);

    expect(angular.element.prototype.on).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it(
    'should not preventDefault if anchor element is replaced with href-containing element',
    () => {
      const spy = jest.spyOn(angular.element.prototype, 'on');

      element = $compile('<a link-to="https://www.google.com">')($rootScope);
      $rootScope.$digest();

      const child = element.children('a');
      const preventDefault = jest.fn();

      child.triggerHandler({
        type: 'click',
        preventDefault
      });

      expect(preventDefault).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  );

  it(
    'should preventDefault if anchor element is replaced with element without href attribute',
    () => {
      const spy = jest.spyOn(angular.element.prototype, 'on');

      element = $compile('<a link-not="https://www.google.com">')($rootScope);
      $rootScope.$digest();

      const child = element.children('a');
      const preventDefault = jest.fn();

      child.triggerHandler({
        type: 'click',
        preventDefault
      });

      expect(preventDefault).toHaveBeenCalled();
      spy.mockRestore();
    }
  );

  if (angular.isDefined(window.SVGElement)) {
    describe('SVGAElement', () => {
      it('should prevent default action to be executed when href is empty', () => {
        const orgLocation = window.document.location.href;
        let preventDefaultCalled = false;

        element = $compile(
          '<svg><a xlink:href="">empty link</a></svg>'
        )($rootScope);
        const child = element.children('a');

        const event = createClickEvent();
        wrapPreventDefault(event, () => {
          preventDefaultCalled = true;
        });

        child[0].dispatchEvent(event);

        expect(preventDefaultCalled).toEqual(true);
        expect(window.document.location.href).toEqual(orgLocation);
      });

      it(
        'should not link and hookup an event if xlink:href is present at compile',
        () => {
          const spy = jest
            .spyOn(angular.element.prototype, 'on')
            .mockImplementation(() => { });

          element = angular.element(
            '<svg><a xlink:href="bobby">hello@you</a></svg>'
          );
          const linker = $compile(element);

          linker($rootScope);

          expect(angular.element.prototype.on).not.toHaveBeenCalled();
          spy.mockRestore();
        }
      );
    });
  }
});
