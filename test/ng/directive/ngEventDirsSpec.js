'use strict';

describe('event directives', () => {
  let element;


  afterEach(() => {
    dealoc(element);
  });


  describe('ngSubmit', () => {

    it('should get called on form submit', angular.mock.inject(($rootScope, $compile) => {
      element = $compile(
        '<form action="/foo" ng-submit="submitted = true">' +
        '<input type="submit" />' +
        '</form>')($rootScope);
      $rootScope.$digest();

      // Support: Chrome 60+
      // We need to add the form to the DOM in order for `submit` events to be properly fired.
      window.document.body.appendChild(element[0]);

      // prevent submit within the test harness
      element.on('submit', e => { e.preventDefault(); });

      expect($rootScope.submitted).toBeUndefined();

      browserTrigger(element.children()[0]);
      expect($rootScope.submitted).toEqual(true);
    }));

    it('should expose event on form submit', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.formSubmission = e => {
        if (e) {
          $rootScope.formSubmitted = 'foo';
        }
      };

      element = $compile(
        '<form action="/foo" ng-submit="formSubmission($event)">' +
        '<input type="submit" />' +
        '</form>')($rootScope);
      $rootScope.$digest();

      // Support: Chrome 60+ (on Windows)
      // We need to add the form to the DOM in order for `submit` events to be properly fired.
      window.document.body.appendChild(element[0]);

      // prevent submit within the test harness
      element.on('submit', e => { e.preventDefault(); });

      expect($rootScope.formSubmitted).toBeUndefined();

      browserTrigger(element.children()[0]);
      expect($rootScope.formSubmitted).toEqual('foo');
    }));
  });

  describe('focus', () => {

    describe('call the listener asynchronously during $apply', () => {
      function run(scope) {
        angular.mock.inject($compile => {
          element = $compile('<input type="text" ng-focus="focus()">')(scope);
          scope.focus = jest.fn();

          scope.$apply(() => {
            element.triggerHandler('focus');
            expect(scope.focus).not.toHaveBeenCalled();
          });

          expect(scope.focus).toHaveBeenCalledTimes(1);
        });
      }

      it('should call the listener with non isolate scopes', angular.mock.inject($rootScope => {
        run($rootScope.$new());
      }));

      it('should call the listener with isolate scopes', angular.mock.inject($rootScope => {
        run($rootScope.$new(true));
      }));

    });

    it('should call the listener synchronously inside of $apply if outside of $apply',
      angular.mock.inject(($rootScope, $compile) => {
        element = $compile('<input type="text" ng-focus="focus()" ng-model="value">')($rootScope);
        $rootScope.focus = jest.fn(() => {
          $rootScope.value = 'newValue';
        });

        element.triggerHandler('focus');

        expect($rootScope.focus).toHaveBeenCalledTimes(1);
        expect(element.val()).toBe('newValue');
      }));

  });

  describe('DOM event object', () => {
    it('should allow access to the $event object', angular.mock.inject(($rootScope, $compile) => {
      const scope = $rootScope.$new();
      element = $compile('<button ng-click="e = $event">BTN</button>')($rootScope);
      element.triggerHandler('click');
      expect(scope.e.target).toBe(element[0]);
    }));
  });

  describe('blur', () => {

    describe('call the listener asynchronously during $apply', () => {
      function run(scope) {
        angular.mock.inject($compile => {
          element = $compile('<input type="text" ng-blur="blur()">')(scope);
          scope.blur = jest.fn();

          scope.$apply(() => {
            element.triggerHandler('blur');
            expect(scope.blur).not.toHaveBeenCalled();
          });

          expect(scope.blur).toHaveBeenCalledTimes(1);
        });
      }

      it('should call the listener with non isolate scopes', angular.mock.inject($rootScope => {
        run($rootScope.$new());
      }));

      it('should call the listener with isolate scopes', angular.mock.inject($rootScope => {
        run($rootScope.$new(true));
      }));

    });

    it('should call the listener synchronously inside of $apply if outside of $apply',
      angular.mock.inject(($rootScope, $compile) => {
        element = $compile('<input type="text" ng-blur="blur()" ng-model="value">')($rootScope);
        $rootScope.blur = jest.fn(() => {
          $rootScope.value = 'newValue';
        });

        element.triggerHandler('blur');

        expect($rootScope.blur).toHaveBeenCalledTimes(1);
        expect(element.val()).toBe('newValue');
      }));
  });


  it('should call the listener synchronously if the event is triggered inside of a digest',
    angular.mock.inject(($rootScope, $compile) => {
      let watchedVal;

      element = $compile('<button type="button" ng-click="click()">Button</button>')($rootScope);
      $rootScope.$watch('value', newValue => {
        watchedVal = newValue;
      });
      $rootScope.click = jest.fn(() => {
        $rootScope.value = 'newValue';
      });

      $rootScope.$apply(() => {
        element.triggerHandler('click');
      });

      expect($rootScope.click).toHaveBeenCalledTimes(1);
      expect(watchedVal).toEqual('newValue');
    }));


  it('should call the listener synchronously if the event is triggered outside of a digest',
    angular.mock.inject(($rootScope, $compile) => {
      let watchedVal;

      element = $compile('<button type="button" ng-click="click()">Button</button>')($rootScope);
      $rootScope.$watch('value', newValue => {
        watchedVal = newValue;
      });
      $rootScope.click = jest.fn(() => {
        $rootScope.value = 'newValue';
      });

      element.triggerHandler('click');

      expect($rootScope.click).toHaveBeenCalledTimes(1);
      expect(watchedVal).toEqual('newValue');
    }));


  describe('throwing errors in event handlers', () => {

    it('should not stop execution if the event is triggered outside a digest', () => {

      angular.mock.module($exceptionHandlerProvider => {
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(($rootScope, $compile, $exceptionHandler, $log) => {

        element = $compile('<button ng-click="click()">Click</button>')($rootScope);
        expect($log.assertEmpty());
        $rootScope.click = () => {
          throw new Error('listener error');
        };

        $rootScope.do = () => {
          element.triggerHandler('click');
          $log.log('done');
        };

        $rootScope.do();

        expect($exceptionHandler.errors).toEqual([Error('listener error')]);
        expect($log.log.logs).toEqual([['done']]);
        $log.reset();
      });
    });


    it('should not stop execution if the event is triggered inside a digest', () => {

      angular.mock.module($exceptionHandlerProvider => {
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(($rootScope, $compile, $exceptionHandler, $log) => {

        element = $compile('<button ng-click="click()">Click</button>')($rootScope);
        expect($log.assertEmpty());
        $rootScope.click = () => {
          throw new Error('listener error');
        };

        $rootScope.do = () => {
          element.triggerHandler('click');
          $log.log('done');
        };

        $rootScope.$apply(() => {
          $rootScope.do();
        });

        expect($exceptionHandler.errors).toEqual([Error('listener error')]);
        expect($log.log.logs).toEqual([['done']]);
        $log.reset();
      });
    });


    it('should not stop execution if the event is triggered in a watch expression function', () => {

      angular.mock.module($exceptionHandlerProvider => {
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(($rootScope, $compile, $exceptionHandler, $log) => {

        element = $compile('<button ng-click="click()">Click</button>')($rootScope);
        $rootScope.click = () => {
          throw new Error('listener error');
        };

        $rootScope.$watch(() => {
          element.triggerHandler('click');
          $log.log('done');
        });

        $rootScope.$digest();

        expect($exceptionHandler.errors).toEqual([Error('listener error'), Error('listener error')]);
        expect($log.log.logs).toEqual([['done'], ['done']]);
        $log.reset();
      });
    });
  });
});
