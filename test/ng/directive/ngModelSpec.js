'use strict';

/* globals generateInputCompilerHelper: false */

describe('ngModel', () => {

  describe('NgModelController', () => {
    /* global NgModelController: false */
    let ctrl, scope, element, parentFormCtrl;

    beforeEach(angular.mock.inject(($rootScope, $controller) => {
      const attrs = { name: 'testAlias', ngModel: 'value' };

      parentFormCtrl = {
        $$setPending: jest.fn(),
        $setValidity: jest.fn(),
        $setDirty: jest.fn(),
        $$clearControlValidity: angular.noop
      };

      element = angular.element('<form><input></form>');

      scope = $rootScope;
      ctrl = $controller(ngInternals.NgModelController, {
        $scope: scope,
        $element: element.find('input'),
        $attrs: attrs
      });

      //Assign the mocked parentFormCtrl to the model controller
      ctrl.$$parentForm = parentFormCtrl;
    }));


    afterEach(() => {
      dealoc(element);
    });


    it('should init the properties', () => {
      expect(ctrl.$untouched).toBe(true);
      expect(ctrl.$touched).toBe(false);
      expect(ctrl.$dirty).toBe(false);
      expect(ctrl.$pristine).toBe(true);
      expect(ctrl.$valid).toBe(true);
      expect(ctrl.$invalid).toBe(false);

      expect(ctrl.$viewValue).toBeDefined();
      expect(ctrl.$modelValue).toBeDefined();

      expect(ctrl.$formatters).toEqual([]);
      expect(ctrl.$parsers).toEqual([]);

      expect(ctrl.$name).toBe('testAlias');
    });


    describe('setValidity', () => {

      function expectOneError() {
        expect(ctrl.$error).toEqual({ someError: true });
        expect(ctrl.$$success).toEqual({});
        expect(ctrl.$pending).toBeUndefined();
      }

      function expectOneSuccess() {
        expect(ctrl.$error).toEqual({});
        expect(ctrl.$$success).toEqual({ someError: true });
        expect(ctrl.$pending).toBeUndefined();
      }

      function expectOnePending() {
        expect(ctrl.$error).toEqual({});
        expect(ctrl.$$success).toEqual({});
        expect(ctrl.$pending).toEqual({ someError: true });
      }

      function expectCleared() {
        expect(ctrl.$error).toEqual({});
        expect(ctrl.$$success).toEqual({});
        expect(ctrl.$pending).toBeUndefined();
      }


      it('should propagate validity to the parent form', () => {
        expect(parentFormCtrl.$setValidity).not.toHaveBeenCalled();
        ctrl.$setValidity('ERROR', false);
        expect(parentFormCtrl.$setValidity).toHaveBeenCalledOnceWith('ERROR', false, ctrl);
      });


      it('should transition from states correctly', () => {
        expectCleared();

        ctrl.$setValidity('someError', false);
        expectOneError();

        ctrl.$setValidity('someError', undefined);
        expectOnePending();

        ctrl.$setValidity('someError', true);
        expectOneSuccess();

        ctrl.$setValidity('someError', null);
        expectCleared();
      });


      it('should set valid/invalid with multiple errors', () => {
        ctrl.$setValidity('first', false);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity('second', false);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity('third', undefined);
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();

        ctrl.$setValidity('third', null);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity('second', true);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity('first', true);
        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
      });
    });

    describe('setPristine', () => {

      it('should set control to its pristine state', () => {
        ctrl.$setViewValue('edit');
        expect(ctrl.$dirty).toBe(true);
        expect(ctrl.$pristine).toBe(false);

        ctrl.$setPristine();
        expect(ctrl.$dirty).toBe(false);
        expect(ctrl.$pristine).toBe(true);
      });
    });

    describe('setDirty', () => {

      it('should set control to its dirty state', () => {
        expect(ctrl.$pristine).toBe(true);
        expect(ctrl.$dirty).toBe(false);

        ctrl.$setDirty();
        expect(ctrl.$pristine).toBe(false);
        expect(ctrl.$dirty).toBe(true);
      });


      it('should set parent form to its dirty state', () => {
        ctrl.$setDirty();
        expect(parentFormCtrl.$setDirty).toHaveBeenCalled();
      });
    });

    describe('setUntouched', () => {

      it('should set control to its untouched state', () => {
        ctrl.$setTouched();

        ctrl.$setUntouched();
        expect(ctrl.$touched).toBe(false);
        expect(ctrl.$untouched).toBe(true);
      });
    });

    describe('setTouched', () => {

      it('should set control to its touched state', () => {
        ctrl.$setUntouched();

        ctrl.$setTouched();
        expect(ctrl.$touched).toBe(true);
        expect(ctrl.$untouched).toBe(false);
      });
    });

    describe('view -> model', () => {

      it('should set the value to $viewValue', () => {
        ctrl.$setViewValue('some-val');
        expect(ctrl.$viewValue).toBe('some-val');
      });


      it('should pipeline all registered parsers and set result to $modelValue', () => {
        const log = [];

        ctrl.$parsers.push(value => {
          log.push(value);
          return value + '-a';
        });

        ctrl.$parsers.push(value => {
          log.push(value);
          return value + '-b';
        });

        ctrl.$setViewValue('init');
        expect(log).toEqual(['init', 'init-a']);
        expect(ctrl.$modelValue).toBe('init-a-b');
      });


      it('should fire viewChangeListeners when the value changes in the view (even if invalid)',
        () => {
          const spy = jest.fn();
          ctrl.$viewChangeListeners.push(spy);
          ctrl.$setViewValue('val');
          expect(spy).toHaveBeenCalledTimes(1);
          spy.mockClear();

          // invalid
          ctrl.$parsers.push(() => { return undefined; });
          ctrl.$setViewValue('val2');
          expect(spy).toHaveBeenCalledTimes(1);
        });


      it('should reset the model when the view is invalid', () => {
        ctrl.$setViewValue('aaaa');
        expect(ctrl.$modelValue).toBe('aaaa');

        // add a validator that will make any input invalid
        ctrl.$parsers.push(() => { return undefined; });
        expect(ctrl.$modelValue).toBe('aaaa');
        ctrl.$setViewValue('bbbb');
        expect(ctrl.$modelValue).toBeUndefined();
      });


      it('should not reset the model when the view is invalid due to an external validator', () => {
        ctrl.$setViewValue('aaaa');
        expect(ctrl.$modelValue).toBe('aaaa');

        ctrl.$setValidity('someExternalError', false);
        ctrl.$setViewValue('bbbb');
        expect(ctrl.$modelValue).toBe('bbbb');
      });


      it('should not reset the view when the view is invalid', () => {
        // this test fails when the view changes the model and
        // then the model listener in ngModel picks up the change and
        // tries to update the view again.

        // add a validator that will make any input invalid
        ctrl.$parsers.push(() => { return undefined; });
        jest.spyOn(ctrl, '$render');

        // first digest
        ctrl.$setViewValue('bbbb');
        expect(ctrl.$modelValue).toBeUndefined();
        expect(ctrl.$viewValue).toBe('bbbb');
        expect(ctrl.$render).not.toHaveBeenCalled();
        expect(scope.value).toBeUndefined();

        // further digests
        scope.$apply('value = "aaa"');
        expect(ctrl.$viewValue).toBe('aaa');
        ctrl.$render.mockClear();

        ctrl.$setViewValue('cccc');
        expect(ctrl.$modelValue).toBeUndefined();
        expect(ctrl.$viewValue).toBe('cccc');
        expect(ctrl.$render).not.toHaveBeenCalled();
        expect(scope.value).toBeUndefined();
      });


      it('should call parentForm.$setDirty only when pristine', () => {
        ctrl.$setViewValue('');
        expect(ctrl.$pristine).toBe(false);
        expect(ctrl.$dirty).toBe(true);
        expect(parentFormCtrl.$setDirty).toHaveBeenCalledTimes(1);

        parentFormCtrl.$setDirty.mockClear();
        ctrl.$setViewValue('');
        expect(ctrl.$pristine).toBe(false);
        expect(ctrl.$dirty).toBe(true);
        expect(parentFormCtrl.$setDirty).not.toHaveBeenCalled();
      });


      it('should remove all other errors when any parser returns undefined', () => {
        let a;
        let b;

        const val = (val, x) => {
          return x ? val : x;
        };

        ctrl.$parsers.push(v => { return val(v, a); });
        ctrl.$parsers.push(v => { return val(v, b); });

        ctrl.$validators.high = value => {
          return !angular.isDefined(value) || value > 5;
        };

        ctrl.$validators.even = value => {
          return !angular.isDefined(value) || value % 2 === 0;
        };

        a = b = true;

        ctrl.$setViewValue('3');
        expect(ctrl.$error).toEqual({ high: true, even: true });

        ctrl.$setViewValue('10');
        expect(ctrl.$error).toEqual({});

        a = undefined;

        ctrl.$setViewValue('12');
        expect(ctrl.$error).toEqual({ parse: true });

        a = true;
        b = undefined;

        ctrl.$setViewValue('14');
        expect(ctrl.$error).toEqual({ parse: true });

        a = undefined;
        b = undefined;

        ctrl.$setViewValue('16');
        expect(ctrl.$error).toEqual({ parse: true });

        a = b = false; //not undefined

        ctrl.$setViewValue('2');
        expect(ctrl.$error).toEqual({ high: true });
      });


      it('should not remove external validators when a parser failed', () => {
        ctrl.$parsers.push(v => { return undefined; });
        ctrl.$setValidity('externalError', false);
        ctrl.$setViewValue('someValue');
        expect(ctrl.$error).toEqual({ externalError: true, parse: true });
      });


      it('should remove all non-parse-related CSS classes from the form when a parser fails',
        angular.mock.inject(($compile, $rootScope) => {

          const element = $compile('<form name="myForm">' +
            '<input name="myControl" ng-model="value" >' +
            '</form>')($rootScope);
          const inputElm = element.find('input');
          const ctrl = $rootScope.myForm.myControl;

          let parserIsFailing = false;
          ctrl.$parsers.push(value => {
            return parserIsFailing ? undefined : value;
          });

          ctrl.$validators.alwaysFail = () => {
            return false;
          };

          ctrl.$setViewValue('123');
          scope.$digest();

          expect(element).toHaveClass('ng-valid-parse');
          expect(element).not.toHaveClass('ng-invalid-parse');
          expect(element).toHaveClass('ng-invalid-always-fail');

          parserIsFailing = true;
          ctrl.$setViewValue('12345');
          scope.$digest();

          expect(element).not.toHaveClass('ng-valid-parse');
          expect(element).toHaveClass('ng-invalid-parse');
          expect(element).not.toHaveClass('ng-invalid-always-fail');

          dealoc(element);
        }));


      it('should set the ng-invalid-parse and ng-valid-parse CSS class when parsers fail and pass', () => {
        let pass = true;
        ctrl.$parsers.push(v => {
          return pass ? v : undefined;
        });

        const input = element.find('input');

        ctrl.$setViewValue('1');
        expect(input).toHaveClass('ng-valid-parse');
        expect(input).not.toHaveClass('ng-invalid-parse');

        pass = undefined;

        ctrl.$setViewValue('2');
        expect(input).not.toHaveClass('ng-valid-parse');
        expect(input).toHaveClass('ng-invalid-parse');
        dealoc(input);
      });


      it('should update the model after all async validators resolve', angular.mock.inject($q => {
        let defer;
        ctrl.$asyncValidators.promiseValidator = value => {
          defer = $q.defer();
          return defer.promise;
        };

        // set view value on first digest
        ctrl.$setViewValue('b');

        expect(ctrl.$modelValue).toBeUndefined();
        expect(scope.value).toBeUndefined();

        defer.resolve();
        scope.$digest();

        expect(ctrl.$modelValue).toBe('b');
        expect(scope.value).toBe('b');

        // set view value on further digests
        ctrl.$setViewValue('c');

        expect(ctrl.$modelValue).toBe('b');
        expect(scope.value).toBe('b');

        defer.resolve();
        scope.$digest();

        expect(ctrl.$modelValue).toBe('c');
        expect(scope.value).toBe('c');
      }));


      it('should not throw an error if the scope has been destroyed', () => {
        scope.$destroy();
        ctrl.$setViewValue('some-val');
        expect(ctrl.$viewValue).toBe('some-val');
      });
    });


    describe('model -> view', () => {

      it('should set the value to $modelValue', () => {
        scope.$apply('value = 10');
        expect(ctrl.$modelValue).toBe(10);
      });


      it('should pipeline all registered formatters in reversed order and set result to $viewValue',
        () => {
          const log = [];

          ctrl.$formatters.unshift(value => {
            log.push(value);
            return value + 2;
          });

          ctrl.$formatters.unshift(value => {
            log.push(value);
            return value + '';
          });

          scope.$apply('value = 3');
          expect(log).toEqual([3, 5]);
          expect(ctrl.$viewValue).toBe('5');
        });


      it('should $render only if value changed', () => {
        jest.spyOn(ctrl, '$render');

        scope.$apply('value = 3');
        expect(ctrl.$render).toHaveBeenCalledTimes(1);
        ctrl.$render.mockClear();

        ctrl.$formatters.push(() => { return 3; });
        scope.$apply('value = 5');
        expect(ctrl.$render).not.toHaveBeenCalled();
      });


      it('should clear the view even if invalid', () => {
        jest.spyOn(ctrl, '$render');

        ctrl.$formatters.push(() => { return undefined; });
        scope.$apply('value = 5');
        expect(ctrl.$render).toHaveBeenCalledTimes(1);
      });


      it('should render immediately even if there are async validators', angular.mock.inject($q => {
        jest.spyOn(ctrl, '$render');
        ctrl.$asyncValidators.someValidator = () => {
          return $q.defer().promise;
        };

        scope.$apply('value = 5');
        expect(ctrl.$viewValue).toBe(5);
        expect(ctrl.$render).toHaveBeenCalledTimes(1);
      }));


      it('should not rerender nor validate in case view value is not changed', () => {
        ctrl.$formatters.push(value => {
          return 'nochange';
        });

        jest.spyOn(ctrl, '$render');
        ctrl.$validators.spyValidator = jest.fn();
        scope.$apply('value = "first"');
        scope.$apply('value = "second"');
        expect(ctrl.$validators.spyValidator).toHaveBeenCalledTimes(1);
        expect(ctrl.$render).toHaveBeenCalledTimes(1);
      });


      it('should always format the viewValue as a string for a blank input type when the value is present',
        angular.mock.inject(($compile, $rootScope, $sniffer) => {

          const form = $compile('<form name="form"><input name="field" ng-model="val" /></form>')($rootScope);

          $rootScope.val = 123;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe('123');

          $rootScope.val = null;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe(null);

          dealoc(form);
        }));


      it('should always format the viewValue as a string for a `text` input type when the value is present',
        angular.mock.inject(($compile, $rootScope, $sniffer) => {

          const form = $compile('<form name="form"><input type="text" name="field" ng-model="val" /></form>')($rootScope);
          $rootScope.val = 123;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe('123');

          $rootScope.val = null;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe(null);

          dealoc(form);
        }));


      it('should always format the viewValue as a string for an `email` input type when the value is present',
        angular.mock.inject(($compile, $rootScope, $sniffer) => {

          const form = $compile('<form name="form"><input type="email" name="field" ng-model="val" /></form>')($rootScope);
          $rootScope.val = 123;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe('123');

          $rootScope.val = null;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe(null);

          dealoc(form);
        }));


      it('should always format the viewValue as a string for a `url` input type when the value is present',
        angular.mock.inject(($compile, $rootScope, $sniffer) => {

          const form = $compile('<form name="form"><input type="url" name="field" ng-model="val" /></form>')($rootScope);
          $rootScope.val = 123;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe('123');

          $rootScope.val = null;
          $rootScope.$digest();
          expect($rootScope.form.field.$viewValue).toBe(null);

          dealoc(form);
        }));


      it('should set NaN as the $modelValue when an asyncValidator is present',
        angular.mock.inject($q => {

          ctrl.$asyncValidators.test = () => {
            return $q((resolve, reject) => {
              resolve();
            });
          };

          scope.$apply('value = 10');
          expect(ctrl.$modelValue).toBe(10);

          expect(() => {
            scope.$apply(() => {
              scope.value = NaN;
            });
          }).not.toThrow();

          expect(ctrl.$modelValue).toBeNaN();

        }));

      describe('$processModelValue', () => {
        // Emulate setting the model on the scope
        function setModelValue(ctrl, value) {
          ctrl.$modelValue = ctrl.$$rawModelValue = value;
          ctrl.$$parserValid = undefined;
        }

        it('should run the model -> view pipeline', () => {
          const log = [];
          const input = ctrl.$$element;

          ctrl.$formatters.unshift(value => {
            log.push(value);
            return value + 2;
          });

          ctrl.$formatters.unshift(value => {
            log.push(value);
            return value + '';
          });

          jest.spyOn(ctrl, '$render');

          setModelValue(ctrl, 3);

          expect(ctrl.$modelValue).toBe(3);

          ctrl.$processModelValue();

          expect(ctrl.$modelValue).toBe(3);
          expect(log).toEqual([3, 5]);
          expect(ctrl.$viewValue).toBe('5');
          expect(ctrl.$render).toHaveBeenCalledTimes(1);
        });

        it('should add the validation and empty-state classes',
          angular.mock.inject(($compile, $rootScope, $animate) => {
            const input = $compile('<input name="myControl" maxlength="1" ng-model="value" >')($rootScope);
            $rootScope.$digest();

            jest.spyOn($animate, 'addClass');
            jest.spyOn($animate, 'removeClass');

            const ctrl = input.controller('ngModel');

            expect(input).toHaveClass('ng-empty');
            expect(input).toHaveClass('ng-valid');

            setModelValue(ctrl, 3);
            ctrl.$processModelValue();

            // $animate adds / removes classes in the $$postDigest, which
            // we cannot trigger with $digest, because that would set the model from the scope,
            // so we simply check if the functions have been called
            expect($animate.removeClass.mock.calls[$animate.removeClass.mock.calls.length - 1][0][0]).toBe(input[0]);
            expect($animate.removeClass.mock.calls[$animate.removeClass.mock.calls.length - 1][1]).toBe('ng-empty');

            expect($animate.addClass.mock.calls[$animate.addClass.mock.calls.length - 1][0][0]).toBe(input[0]);
            expect($animate.addClass.mock.calls[$animate.addClass.mock.calls.length - 1][1]).toBe('ng-not-empty');

            $animate.removeClass.mockClear();
            $animate.addClass.mockClear();

            setModelValue(ctrl, 35);
            ctrl.$processModelValue();

            expect($animate.addClass.mock.calls[1][0][0]).toBe(input[0]);
            expect($animate.addClass.mock.calls[1][1]).toBe('ng-invalid');

            expect($animate.addClass.mock.calls[2][0][0]).toBe(input[0]);
            expect($animate.addClass.mock.calls[2][1]).toBe('ng-invalid-maxlength');
            dealoc(input);
          })
        );

        // this is analogue to $setViewValue
        it('should run the model -> view pipeline even if the value has not changed', () => {
          const log = [];

          ctrl.$formatters.unshift(value => {
            log.push(value);
            return value + 2;
          });

          ctrl.$formatters.unshift(value => {
            log.push(value);
            return value + '';
          });

          jest.spyOn(ctrl, '$render');

          setModelValue(ctrl, 3);
          ctrl.$processModelValue();

          expect(ctrl.$modelValue).toBe(3);
          expect(ctrl.$viewValue).toBe('5');
          expect(log).toEqual([3, 5]);
          expect(ctrl.$render).toHaveBeenCalledTimes(1);

          ctrl.$processModelValue();
          expect(ctrl.$modelValue).toBe(3);
          expect(ctrl.$viewValue).toBe('5');
          expect(log).toEqual([3, 5, 3, 5]);
          // $render() is not called if the viewValue didn't change
          expect(ctrl.$render).toHaveBeenCalledTimes(1);
        });
      });
    });


    describe('validation', () => {

      describe('$validate', () => {

        it('should perform validations when $validate() is called', () => {
          scope.$apply('value = ""');

          let validatorResult = false;
          ctrl.$validators.someValidator = value => {
            return validatorResult;
          };

          ctrl.$validate();

          expect(ctrl.$valid).toBe(false);

          validatorResult = true;
          ctrl.$validate();

          expect(ctrl.$valid).toBe(true);
        });


        it('should pass the last parsed modelValue to the validators', () => {
          ctrl.$parsers.push(modelValue => {
            return modelValue + 'def';
          });

          ctrl.$setViewValue('abc');

          ctrl.$validators.test = (modelValue, viewValue) => {
            return true;
          };

          jest.spyOn(ctrl.$validators, 'test');

          ctrl.$validate();

          expect(ctrl.$validators.test).toHaveBeenCalledWith('abcdef', 'abc');
        });


        it('should set the model to undefined when it becomes invalid', () => {
          let valid = true;
          ctrl.$validators.test = (modelValue, viewValue) => {
            return valid;
          };

          scope.$apply('value = "abc"');
          expect(scope.value).toBe('abc');

          valid = false;
          ctrl.$validate();

          expect(scope.value).toBeUndefined();
        });


        it('should update the model when it becomes valid', () => {
          let valid = true;
          ctrl.$validators.test = (modelValue, viewValue) => {
            return valid;
          };

          scope.$apply('value = "abc"');
          expect(scope.value).toBe('abc');

          valid = false;
          ctrl.$validate();
          expect(scope.value).toBeUndefined();

          valid = true;
          ctrl.$validate();
          expect(scope.value).toBe('abc');
        });


        it('should not update the model when it is valid, but there is a parse error', () => {
          ctrl.$parsers.push(modelValue => {
            return undefined;
          });

          ctrl.$setViewValue('abc');
          expect(ctrl.$error.parse).toBe(true);
          expect(scope.value).toBeUndefined();

          ctrl.$validators.test = (modelValue, viewValue) => {
            return true;
          };

          ctrl.$validate();
          expect(ctrl.$error).toEqual({ parse: true });
          expect(scope.value).toBeUndefined();
        });


        it('should not set an invalid model to undefined when validity is the same', () => {
          ctrl.$validators.test = () => {
            return false;
          };

          scope.$apply('value = "invalid"');
          expect(ctrl.$valid).toBe(false);
          expect(scope.value).toBe('invalid');

          ctrl.$validate();
          expect(ctrl.$valid).toBe(false);
          expect(scope.value).toBe('invalid');
        });


        it('should not change a model that has a formatter', () => {
          ctrl.$validators.test = () => {
            return true;
          };

          ctrl.$formatters.push(modelValue => {
            return 'xyz';
          });

          scope.$apply('value = "abc"');
          expect(ctrl.$viewValue).toBe('xyz');

          ctrl.$validate();
          expect(scope.value).toBe('abc');
        });


        it('should not change a model that has a parser', () => {
          ctrl.$validators.test = () => {
            return true;
          };

          ctrl.$parsers.push(modelValue => {
            return 'xyz';
          });

          scope.$apply('value = "abc"');

          ctrl.$validate();
          expect(scope.value).toBe('abc');
        });
      });

      describe('view -> model update', () => {

        it('should always perform validations using the parsed model value', () => {
          let captures;
          ctrl.$validators.raw = function () {
            captures = Array.prototype.slice.call(arguments);
            return captures[0];
          };

          ctrl.$parsers.push(value => {
            return value.toUpperCase();
          });

          ctrl.$setViewValue('my-value');

          expect(captures).toEqual(['MY-VALUE', 'my-value']);
        });


        it('should always perform validations using the formatted view value', () => {
          let captures;
          ctrl.$validators.raw = function () {
            captures = Array.prototype.slice.call(arguments);
            return captures[0];
          };

          ctrl.$formatters.push(value => {
            return value + '...';
          });

          scope.$apply('value = "matias"');

          expect(captures).toEqual(['matias', 'matias...']);
        });


        it('should only perform validations if the view value is different', () => {
          let count = 0;
          ctrl.$validators.countMe = () => {
            count++;
          };

          ctrl.$setViewValue('my-value');
          expect(count).toBe(1);

          ctrl.$setViewValue('my-value');
          expect(count).toBe(1);

          ctrl.$setViewValue('your-value');
          expect(count).toBe(2);
        });
      });


      it('should perform validations twice each time the model value changes within a digest', () => {
        let count = 0;
        ctrl.$validators.number = value => {
          count++;
          return (/^\d+$/).test(value);
        };

        scope.$apply('value = ""');
        expect(count).toBe(1);

        scope.$apply('value = 1');
        expect(count).toBe(2);

        scope.$apply('value = 1');
        expect(count).toBe(2);

        scope.$apply('value = ""');
        expect(count).toBe(3);
      });


      it('should only validate to true if all validations are true', () => {
        ctrl.$modelValue = undefined;
        ctrl.$validators.a = ngInternals.valueFn(true);
        ctrl.$validators.b = ngInternals.valueFn(true);
        ctrl.$validators.c = ngInternals.valueFn(false);

        ctrl.$validate();
        expect(ctrl.$valid).toBe(false);

        ctrl.$validators.c = ngInternals.valueFn(true);

        ctrl.$validate();
        expect(ctrl.$valid).toBe(true);
      });

      it('should treat all responses as boolean for synchronous validators', () => {
        const expectValid = (value, expected) => {
          ctrl.$modelValue = undefined;
          ctrl.$validators.a = ngInternals.valueFn(value);

          ctrl.$validate();
          expect(ctrl.$valid).toBe(expected);
        };

        // False tests
        expectValid(false, false);
        expectValid(undefined, false);
        expectValid(null, false);
        expectValid(0, false);
        expectValid(NaN, false);
        expectValid('', false);

        // True tests
        expectValid(true, true);
        expectValid(1, true);
        expectValid('0', true);
        expectValid('false', true);
        expectValid([], true);
        expectValid({}, true);
      });


      it('should register invalid validations on the $error object', () => {
        ctrl.$modelValue = undefined;
        ctrl.$validators.unique = ngInternals.valueFn(false);
        ctrl.$validators.tooLong = ngInternals.valueFn(false);
        ctrl.$validators.notNumeric = ngInternals.valueFn(true);

        ctrl.$validate();

        expect(ctrl.$error.unique).toBe(true);
        expect(ctrl.$error.tooLong).toBe(true);
        expect(ctrl.$error.notNumeric).not.toBe(true);
      });


      it('should render a validator asynchronously when a promise is returned', angular.mock.inject($q => {
        let defer;
        ctrl.$asyncValidators.promiseValidator = value => {
          defer = $q.defer();
          return defer.promise;
        };

        scope.$apply('value = ""');

        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();
        expect(ctrl.$pending.promiseValidator).toBe(true);

        defer.resolve();
        scope.$digest();

        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
        expect(ctrl.$pending).toBeUndefined();

        scope.$apply('value = "123"');

        defer.reject();
        scope.$digest();

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(ctrl.$pending).toBeUndefined();
      }));


      it('should throw an error when a promise is not returned for an asynchronous validator', angular.mock.inject($q => {
        ctrl.$asyncValidators.async = value => {
          return true;
        };

        expect(() => {
          scope.$apply('value = "123"');
        }).toThrowMinErr('ngModel', 'nopromise',
          'Expected asynchronous validator to return a promise but got \'true\' instead.');
      }));


      it('should only run the async validators once all the sync validators have passed',
        angular.mock.inject($q => {

          const stages = {};

          stages.sync = { status1: false, status2: false, count: 0 };
          ctrl.$validators.syncValidator1 = (modelValue, viewValue) => {
            stages.sync.count++;
            return stages.sync.status1;
          };

          ctrl.$validators.syncValidator2 = (modelValue, viewValue) => {
            stages.sync.count++;
            return stages.sync.status2;
          };

          stages.async = { defer: null, count: 0 };
          ctrl.$asyncValidators.asyncValidator = (modelValue, viewValue) => {
            stages.async.defer = $q.defer();
            stages.async.count++;
            return stages.async.defer.promise;
          };

          scope.$apply('value = "123"');

          expect(ctrl.$valid).toBe(false);
          expect(ctrl.$invalid).toBe(true);

          expect(stages.sync.count).toBe(2);
          expect(stages.async.count).toBe(0);

          stages.sync.status1 = true;

          scope.$apply('value = "456"');

          expect(stages.sync.count).toBe(4);
          expect(stages.async.count).toBe(0);

          stages.sync.status2 = true;

          scope.$apply('value = "789"');

          expect(stages.sync.count).toBe(6);
          expect(stages.async.count).toBe(1);

          stages.async.defer.resolve();
          scope.$apply();

          expect(ctrl.$valid).toBe(true);
          expect(ctrl.$invalid).toBe(false);
        }));


      it('should ignore expired async validation promises once delivered', angular.mock.inject($q => {
        let defer, oldDefer, newDefer;
        ctrl.$asyncValidators.async = value => {
          defer = $q.defer();
          return defer.promise;
        };

        scope.$apply('value = ""');
        oldDefer = defer;
        scope.$apply('value = "123"');
        newDefer = defer;

        newDefer.reject();
        scope.$digest();
        oldDefer.resolve();
        scope.$digest();

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(ctrl.$pending).toBeUndefined();
      }));


      it('should clear and ignore all pending promises when the model value changes', angular.mock.inject($q => {
        ctrl.$validators.sync = value => {
          return true;
        };

        const defers = [];
        ctrl.$asyncValidators.async = value => {
          const defer = $q.defer();
          defers.push(defer);
          return defer.promise;
        };

        scope.$apply('value = "123"');
        expect(ctrl.$pending).toEqual({ async: true });
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();
        expect(defers.length).toBe(1);
        expect(angular.isObject(ctrl.$pending)).toBe(true);

        scope.$apply('value = "456"');
        expect(ctrl.$pending).toEqual({ async: true });
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();
        expect(defers.length).toBe(2);
        expect(angular.isObject(ctrl.$pending)).toBe(true);

        defers[1].resolve();
        scope.$digest();
        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
        expect(angular.isObject(ctrl.$pending)).toBe(false);
      }));


      it('should clear and ignore all pending promises when a parser fails', angular.mock.inject($q => {
        let failParser = false;
        ctrl.$parsers.push(value => {
          return failParser ? undefined : value;
        });

        let defer;
        ctrl.$asyncValidators.async = value => {
          defer = $q.defer();
          return defer.promise;
        };

        ctrl.$setViewValue('x..y..z');
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();

        failParser = true;

        ctrl.$setViewValue('1..2..3');
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(angular.isObject(ctrl.$pending)).toBe(false);

        defer.resolve();
        scope.$digest();

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(angular.isObject(ctrl.$pending)).toBe(false);
      }));


      it('should clear all errors from async validators if a parser fails', angular.mock.inject($q => {
        let failParser = false;
        ctrl.$parsers.push(value => {
          return failParser ? undefined : value;
        });

        ctrl.$asyncValidators.async = value => {
          return $q.reject();
        };

        ctrl.$setViewValue('x..y..z');
        expect(ctrl.$error).toEqual({ async: true });

        failParser = true;

        ctrl.$setViewValue('1..2..3');
        expect(ctrl.$error).toEqual({ parse: true });
      }));


      it('should clear all errors from async validators if a sync validator fails', angular.mock.inject($q => {
        let failValidator = false;
        ctrl.$validators.sync = value => {
          return !failValidator;
        };

        ctrl.$asyncValidators.async = value => {
          return $q.reject();
        };

        ctrl.$setViewValue('x..y..z');
        expect(ctrl.$error).toEqual({ async: true });

        failValidator = true;

        ctrl.$setViewValue('1..2..3');
        expect(ctrl.$error).toEqual({ sync: true });
      }));


      it('should be possible to extend Object prototype and still be able to do form validation',
        angular.mock.inject(($compile, $rootScope) => {
          // eslint-disable-next-line no-extend-native
          Object.prototype.someThing = () => { };
          const element = $compile('<form name="myForm">' +
            '<input type="text" name="username" ng-model="username" minlength="10" required />' +
            '</form>')($rootScope);
          const inputElm = element.find('input');

          const formCtrl = $rootScope.myForm;
          const usernameCtrl = formCtrl.username;

          $rootScope.$digest();
          expect(usernameCtrl.$invalid).toBe(true);
          expect(formCtrl.$invalid).toBe(true);

          usernameCtrl.$setViewValue('valid-username');
          $rootScope.$digest();

          expect(usernameCtrl.$invalid).toBe(false);
          expect(formCtrl.$invalid).toBe(false);
          delete Object.prototype.someThing;

          dealoc(element);
        }));

      it('should re-evaluate the form validity state once the asynchronous promise has been delivered',
        angular.mock.inject(($compile, $rootScope, $q) => {

          const element = $compile('<form name="myForm">' +
            '<input type="text" name="username" ng-model="username" minlength="10" required />' +
            '<input type="number" name="age" ng-model="age" min="10" required />' +
            '</form>')($rootScope);
          const inputElm = element.find('input');

          const formCtrl = $rootScope.myForm;
          const usernameCtrl = formCtrl.username;
          const ageCtrl = formCtrl.age;

          let usernameDefer;
          usernameCtrl.$asyncValidators.usernameAvailability = () => {
            usernameDefer = $q.defer();
            return usernameDefer.promise;
          };

          $rootScope.$digest();
          expect(usernameCtrl.$invalid).toBe(true);
          expect(formCtrl.$invalid).toBe(true);

          usernameCtrl.$setViewValue('valid-username');
          $rootScope.$digest();

          expect(formCtrl.$pending.usernameAvailability).toBeTruthy();
          expect(usernameCtrl.$invalid).toBeUndefined();
          expect(formCtrl.$invalid).toBeUndefined();

          usernameDefer.resolve();
          $rootScope.$digest();
          expect(usernameCtrl.$invalid).toBe(false);
          expect(formCtrl.$invalid).toBe(true);

          ageCtrl.$setViewValue(22);
          $rootScope.$digest();

          expect(usernameCtrl.$invalid).toBe(false);
          expect(ageCtrl.$invalid).toBe(false);
          expect(formCtrl.$invalid).toBe(false);

          usernameCtrl.$setViewValue('valid');
          $rootScope.$digest();

          expect(usernameCtrl.$invalid).toBe(true);
          expect(ageCtrl.$invalid).toBe(false);
          expect(formCtrl.$invalid).toBe(true);

          usernameCtrl.$setViewValue('another-valid-username');
          $rootScope.$digest();

          usernameDefer.resolve();
          $rootScope.$digest();

          expect(usernameCtrl.$invalid).toBe(false);
          expect(formCtrl.$invalid).toBe(false);
          expect(formCtrl.$pending).toBeFalsy();
          expect(ageCtrl.$invalid).toBe(false);

          dealoc(element);
        }));


      it('should always use the most recent $viewValue for validation', () => {
        ctrl.$parsers.push(value => {
          if (value && value.substr(-1) === 'b') {
            value = 'a';
            ctrl.$setViewValue(value);
            ctrl.$render();
          }

          return value;
        });

        ctrl.$validators.mock = modelValue => {
          return true;
        };

        jest.spyOn(ctrl.$validators, 'mock');

        ctrl.$setViewValue('ab');

        expect(ctrl.$validators.mock).toHaveBeenCalledWith('a', 'a');
        expect(ctrl.$validators.mock).toHaveBeenCalledTimes(2);
      });


      it('should validate even if the modelValue did not change', () => {
        ctrl.$parsers.push(value => {
          if (value && value.substr(-1) === 'b') {
            value = 'a';
          }

          return value;
        });

        ctrl.$validators.mock = modelValue => {
          return true;
        };

        jest.spyOn(ctrl.$validators, 'mock');

        ctrl.$setViewValue('a');

        expect(ctrl.$validators.mock).toHaveBeenCalledWith('a', 'a');
        expect(ctrl.$validators.mock).toHaveBeenCalledTimes(1);

        ctrl.$setViewValue('ab');

        expect(ctrl.$validators.mock).toHaveBeenCalledWith('a', 'ab');
        expect(ctrl.$validators.mock).toHaveBeenCalledTimes(2);
      });

      it('should validate correctly when $parser name equals $validator key', () => {

        ctrl.$validators.parserOrValidator = value => {
          switch (value) {
            case 'allInvalid':
            case 'parseValid-validatorsInvalid':
            case 'stillParseValid-validatorsInvalid':
              return false;
            default:
              return true;
          }
        };

        ctrl.$validators.validator = value => {
          switch (value) {
            case 'allInvalid':
            case 'parseValid-validatorsInvalid':
            case 'stillParseValid-validatorsInvalid':
              return false;
            default:
              return true;
          }
        };

        ctrl.$parsers.push(value => {
          switch (value) {
            case 'allInvalid':
            case 'stillAllInvalid':
            case 'parseInvalid-validatorsValid':
            case 'stillParseInvalid-validatorsValid':
              ctrl.$$parserName = 'parserOrValidator';
              return undefined;
            default:
              return value;
          }
        });

        //Parser and validators are invalid
        scope.$apply('value = "allInvalid"');
        expect(scope.value).toBe('allInvalid');
        expect(ctrl.$error).toEqual({ parserOrValidator: true, validator: true });

        ctrl.$validate();
        expect(scope.value).toEqual('allInvalid');
        expect(ctrl.$error).toEqual({ parserOrValidator: true, validator: true });

        ctrl.$setViewValue('stillAllInvalid');
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });

        ctrl.$validate();
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });

        //Parser is valid, validators are invalid
        scope.$apply('value = "parseValid-validatorsInvalid"');
        expect(scope.value).toBe('parseValid-validatorsInvalid');
        expect(ctrl.$error).toEqual({ parserOrValidator: true, validator: true });

        ctrl.$validate();
        expect(scope.value).toBe('parseValid-validatorsInvalid');
        expect(ctrl.$error).toEqual({ parserOrValidator: true, validator: true });

        ctrl.$setViewValue('stillParseValid-validatorsInvalid');
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true, validator: true });

        ctrl.$validate();
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true, validator: true });

        //Parser is invalid, validators are valid
        scope.$apply('value = "parseInvalid-validatorsValid"');
        expect(scope.value).toBe('parseInvalid-validatorsValid');
        expect(ctrl.$error).toEqual({});

        ctrl.$validate();
        expect(scope.value).toBe('parseInvalid-validatorsValid');
        expect(ctrl.$error).toEqual({});

        ctrl.$setViewValue('stillParseInvalid-validatorsValid');
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });

        ctrl.$validate();
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });
      });

    });

    describe('override ModelOptions', () => {
      it('should replace the previous model options', () => {
        const $options = ctrl.$options;
        ctrl.$overrideModelOptions({});
        expect(ctrl.$options).not.toBe($options);
      });

      it('should set the given options', () => {
        const $options = ctrl.$options;
        ctrl.$overrideModelOptions({ debounce: 1000, updateOn: 'blur' });
        expect(ctrl.$options.getOption('debounce')).toEqual(1000);
        expect(ctrl.$options.getOption('updateOn')).toEqual('blur');
        expect(ctrl.$options.getOption('updateOnDefault')).toBe(false);
      });

      it('should inherit from a parent model options if specified', angular.mock.inject(($compile, $rootScope) => {
        const element = $compile(
          '<form name="form" ng-model-options="{debounce: 1000, updateOn: \'blur\'}">' +
          '  <input ng-model="value" name="input">' +
          '</form>')($rootScope);
        const ctrl = $rootScope.form.input;
        ctrl.$overrideModelOptions({ debounce: 2000, '*': '$inherit' });
        expect(ctrl.$options.getOption('debounce')).toEqual(2000);
        expect(ctrl.$options.getOption('updateOn')).toEqual('blur');
        expect(ctrl.$options.getOption('updateOnDefault')).toBe(false);
        dealoc(element);
      }));

      it('should not inherit from a parent model options if not specified', angular.mock.inject(($compile, $rootScope) => {
        const element = $compile(
          '<form name="form" ng-model-options="{debounce: 1000, updateOn: \'blur\'}">' +
          '  <input ng-model="value" name="input">' +
          '</form>')($rootScope);
        const ctrl = $rootScope.form.input;
        ctrl.$overrideModelOptions({ debounce: 2000 });
        expect(ctrl.$options.getOption('debounce')).toEqual(2000);
        expect(ctrl.$options.getOption('updateOn')).toEqual('');
        expect(ctrl.$options.getOption('updateOnDefault')).toBe(true);
        dealoc(element);
      }));
    });
  });


  describe('CSS classes', () => {
    const EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

    it('should set ng-empty or ng-not-empty when the view value changes',
      angular.mock.inject(($compile, $rootScope, $sniffer) => {

        const element = $compile('<input ng-model="value" />')($rootScope);

        $rootScope.$digest();
        expect(element).toBeEmpty();

        $rootScope.value = 'XXX';
        $rootScope.$digest();
        expect(element).toBeNotEmpty();

        element.val('');
        browserTrigger(element, $sniffer.hasEvent('input') ? 'input' : 'change');
        expect(element).toBeEmpty();

        element.val('YYY');
        browserTrigger(element, $sniffer.hasEvent('input') ? 'input' : 'change');
        expect(element).toBeNotEmpty();

        dealoc(element);
      }));


    it('should set css classes (ng-valid, ng-invalid, ng-pristine, ng-dirty, ng-untouched, ng-touched)',
      angular.mock.inject(($compile, $rootScope, $sniffer) => {
        const element = $compile('<input type="email" ng-model="value" />')($rootScope);

        $rootScope.$digest();
        expect(element).toBeValid();
        expect(element).toBePristine();
        expect(element).toBeUntouched();
        expect(element.hasClass('ng-valid-email')).toBe(true);
        expect(element.hasClass('ng-invalid-email')).toBe(false);

        $rootScope.$apply('value = \'invalid-email\'');
        expect(element).toBeInvalid();
        expect(element).toBePristine();
        expect(element.hasClass('ng-valid-email')).toBe(false);
        expect(element.hasClass('ng-invalid-email')).toBe(true);

        element.val('invalid-again');
        browserTrigger(element, ($sniffer.hasEvent('input')) ? 'input' : 'change');
        expect(element).toBeInvalid();
        expect(element).toBeDirty();
        expect(element.hasClass('ng-valid-email')).toBe(false);
        expect(element.hasClass('ng-invalid-email')).toBe(true);

        element.val('vojta@google.com');
        browserTrigger(element, $sniffer.hasEvent('input') ? 'input' : 'change');
        expect(element).toBeValid();
        expect(element).toBeDirty();
        expect(element.hasClass('ng-valid-email')).toBe(true);
        expect(element.hasClass('ng-invalid-email')).toBe(false);

        browserTrigger(element, 'blur');
        expect(element).toBeTouched();

        dealoc(element);
      }));


    it('should set invalid classes on init', angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<input type="email" ng-model="value" required />')($rootScope);
      $rootScope.$digest();

      expect(element).toBeInvalid();
      expect(element).toHaveClass('ng-invalid-required');

      dealoc(element);
    }));

  });


  describe('custom formatter and parser that are added by a directive in post linking', () => {
    let inputElm, scope;

    beforeEach(angular.mock.module($compileProvider => {
      $compileProvider.directive('customFormat', () => {
        return {
          require: 'ngModel',
          link: function (scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$formatters.push(value => {
              return value.part;
            });
            ngModelCtrl.$parsers.push(value => {
              return { part: value };
            });
          }
        };
      });
    }));


    afterEach(() => {
      dealoc(inputElm);
    });


    function createInput(type) {
      angular.mock.inject(($compile, $rootScope) => {
        scope = $rootScope;
        inputElm = $compile('<input type="' + type + '" ng-model="val" custom-format/>')($rootScope);
      });
    }


    it('should use them after the builtin ones for text inputs', () => {
      createInput('text');
      scope.$apply('val = {part: "a"}');
      expect(inputElm.val()).toBe('a');

      inputElm.val('b');
      browserTrigger(inputElm, 'change');
      expect(scope.val).toEqual({ part: 'b' });
    });


    it('should use them after the builtin ones for number inputs', () => {
      createInput('number');
      scope.$apply('val = {part: 1}');
      expect(inputElm.val()).toBe('1');

      inputElm.val('2');
      browserTrigger(inputElm, 'change');
      expect(scope.val).toEqual({ part: 2 });
    });


    it('should use them after the builtin ones for date inputs', () => {
      createInput('date');
      scope.$apply(() => {
        scope.val = { part: new Date(2000, 10, 8) };
      });
      expect(inputElm.val()).toBe('2000-11-08');

      inputElm.val('2001-12-09');
      browserTrigger(inputElm, 'change');
      expect(scope.val).toEqual({ part: new Date(2001, 11, 9) });
    });
  });


  describe('$touched', () => {

    it('should set the control touched state on "blur" event', angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<form name="myForm">' +
        '<input name="myControl" ng-model="value" >' +
        '</form>')($rootScope);
      const inputElm = element.find('input');
      const control = $rootScope.myForm.myControl;

      expect(control.$touched).toBe(false);
      expect(control.$untouched).toBe(true);

      browserTrigger(inputElm, 'blur');
      expect(control.$touched).toBe(true);
      expect(control.$untouched).toBe(false);

      dealoc(element);
    }));


    it('should not cause a digest on "blur" event if control is already touched',
      angular.mock.inject(($compile, $rootScope) => {

        const element = $compile('<form name="myForm">' +
          '<input name="myControl" ng-model="value" >' +
          '</form>')($rootScope);
        const inputElm = element.find('input');
        const control = $rootScope.myForm.myControl;

        control.$setTouched();
        jest.spyOn($rootScope, '$apply');
        browserTrigger(inputElm, 'blur');

        expect($rootScope.$apply).not.toHaveBeenCalled();

        dealoc(element);
      }));


    it('should digest asynchronously on "blur" event if a apply is already in progress',
      angular.mock.inject(($compile, $rootScope) => {

        const element = $compile('<form name="myForm">' +
          '<input name="myControl" ng-model="value" >' +
          '</form>')($rootScope);
        const inputElm = element.find('input');
        const control = $rootScope.myForm.myControl;

        $rootScope.$apply(() => {
          expect(control.$touched).toBe(false);
          expect(control.$untouched).toBe(true);

          browserTrigger(inputElm, 'blur');

          expect(control.$touched).toBe(false);
          expect(control.$untouched).toBe(true);
        });

        expect(control.$touched).toBe(true);
        expect(control.$untouched).toBe(false);

        dealoc(element);
      }));
  });


  describe('nested in a form', () => {

    it('should register/deregister a nested ngModel with parent form when entering or leaving DOM',
      angular.mock.inject(($compile, $rootScope) => {

        const element = $compile('<form name="myForm">' +
          '<input ng-if="inputPresent" name="myControl" ng-model="value" required >' +
          '</form>')($rootScope);
        let isFormValid;

        $rootScope.inputPresent = false;
        $rootScope.$watch('myForm.$valid', value => { isFormValid = value; });

        $rootScope.$apply();

        expect($rootScope.myForm.$valid).toBe(true);
        expect(isFormValid).toBe(true);
        expect($rootScope.myForm.myControl).toBeUndefined();

        $rootScope.inputPresent = true;
        $rootScope.$apply();

        expect($rootScope.myForm.$valid).toBe(false);
        expect(isFormValid).toBe(false);
        expect($rootScope.myForm.myControl).toBeDefined();

        $rootScope.inputPresent = false;
        $rootScope.$apply();

        expect($rootScope.myForm.$valid).toBe(true);
        expect(isFormValid).toBe(true);
        expect($rootScope.myForm.myControl).toBeUndefined();

        dealoc(element);
      }));


    it('should register/deregister a nested ngModel with parent form when entering or leaving DOM with animations',
      () => {

        // ngAnimate performs the dom manipulation after digest, and since the form validity can be affected by a form
        // control going away we must ensure that the deregistration happens during the digest while we are still doing
        // dirty checking.
        angular.mock.module('ngAnimate');

        angular.mock.inject(($compile, $rootScope) => {
          const element = $compile('<form name="myForm">' +
            '<input ng-if="inputPresent" name="myControl" ng-model="value" required >' +
            '</form>')($rootScope);
          let isFormValid;

          $rootScope.inputPresent = false;
          // this watch ensure that the form validity gets updated during digest (so that we can observe it)
          $rootScope.$watch('myForm.$valid', value => { isFormValid = value; });

          $rootScope.$apply();

          expect($rootScope.myForm.$valid).toBe(true);
          expect(isFormValid).toBe(true);
          expect($rootScope.myForm.myControl).toBeUndefined();

          $rootScope.inputPresent = true;
          $rootScope.$apply();

          expect($rootScope.myForm.$valid).toBe(false);
          expect(isFormValid).toBe(false);
          expect($rootScope.myForm.myControl).toBeDefined();

          $rootScope.inputPresent = false;
          $rootScope.$apply();

          expect($rootScope.myForm.$valid).toBe(true);
          expect(isFormValid).toBe(true);
          expect($rootScope.myForm.myControl).toBeUndefined();

          dealoc(element);
        });
      });


    it('should keep previously defined watches consistent when changes in validity are made',
      angular.mock.inject(($compile, $rootScope) => {

        let isFormValid;
        $rootScope.$watch('myForm.$valid', value => { isFormValid = value; });

        const element = $compile('<form name="myForm">' +
          '<input  name="myControl" ng-model="value" required >' +
          '</form>')($rootScope);

        $rootScope.$apply();
        expect(isFormValid).toBe(false);
        expect($rootScope.myForm.$valid).toBe(false);

        $rootScope.value = 'value';
        $rootScope.$apply();
        expect(isFormValid).toBe(true);
        expect($rootScope.myForm.$valid).toBe(true);

        dealoc(element);
      }));
  });


  describe('animations', () => {

    function findElementAnimations(element, queue) {
      const node = element[0];
      const animations = [];
      for (let i = 0; i < queue.length; i++) {
        const animation = queue[i];
        if (animation.element[0] === node) {
          animations.push(animation);
        }
      }
      return animations;
    }


    function assertValidAnimation(animation, event, classNameA, classNameB) {
      expect(animation.event).toBe(event);
      expect(animation.args[1]).toBe(classNameA);
      if (classNameB) expect(animation.args[2]).toBe(classNameB);
    }

    let doc, input, scope, model;


    beforeEach(angular.mock.module('ngAnimateMock'));


    beforeEach(angular.mock.inject(($rootScope, $compile, $rootElement, $animate) => {
      scope = $rootScope.$new();
      doc = angular.element('<form name="myForm">' +
        '  <input type="text" ng-model="input" name="myInput" />' +
        '</form>');
      $rootElement.append(doc);
      $compile(doc)(scope);
      $animate.queue = [];

      input = doc.find('input');
      model = scope.myForm.myInput;
    }));


    afterEach(() => {
      dealoc(input);
      dealoc(doc);
    });


    it('should trigger an animation when invalid', angular.mock.inject($animate => {
      model.$setValidity('required', false);

      const animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'removeClass', 'ng-valid');
      assertValidAnimation(animations[1], 'addClass', 'ng-invalid');
      assertValidAnimation(animations[2], 'addClass', 'ng-invalid-required');
    }));


    it('should trigger an animation when valid', angular.mock.inject($animate => {
      model.$setValidity('required', false);

      $animate.queue = [];

      model.$setValidity('required', true);

      const animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'addClass', 'ng-valid');
      assertValidAnimation(animations[1], 'removeClass', 'ng-invalid');
      assertValidAnimation(animations[2], 'addClass', 'ng-valid-required');
      assertValidAnimation(animations[3], 'removeClass', 'ng-invalid-required');
    }));


    it('should trigger an animation when dirty', angular.mock.inject($animate => {
      model.$setViewValue('some dirty value');

      const animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'removeClass', 'ng-empty');
      assertValidAnimation(animations[1], 'addClass', 'ng-not-empty');
      assertValidAnimation(animations[2], 'removeClass', 'ng-pristine');
      assertValidAnimation(animations[3], 'addClass', 'ng-dirty');
    }));


    it('should trigger an animation when pristine', angular.mock.inject($animate => {
      model.$setPristine();

      const animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'removeClass', 'ng-dirty');
      assertValidAnimation(animations[1], 'addClass', 'ng-pristine');
    }));


    it('should trigger an animation when untouched', angular.mock.inject($animate => {
      model.$setUntouched();

      const animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'setClass', 'ng-untouched');
      expect(animations[0].args[2]).toBe('ng-touched');
    }));


    it('should trigger an animation when touched', angular.mock.inject($animate => {
      model.$setTouched();

      const animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'setClass', 'ng-touched', 'ng-untouched');
      expect(animations[0].args[2]).toBe('ng-untouched');
    }));


    it('should trigger custom errors as addClass/removeClass when invalid/valid', angular.mock.inject($animate => {
      model.$setValidity('custom-error', false);

      let animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'removeClass', 'ng-valid');
      assertValidAnimation(animations[1], 'addClass', 'ng-invalid');
      assertValidAnimation(animations[2], 'addClass', 'ng-invalid-custom-error');

      $animate.queue = [];
      model.$setValidity('custom-error', true);

      animations = findElementAnimations(input, $animate.queue);
      assertValidAnimation(animations[0], 'addClass', 'ng-valid');
      assertValidAnimation(animations[1], 'removeClass', 'ng-invalid');
      assertValidAnimation(animations[2], 'addClass', 'ng-valid-custom-error');
      assertValidAnimation(animations[3], 'removeClass', 'ng-invalid-custom-error');
    }));
  });
});
