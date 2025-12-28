'use strict';

describe('ngRef', () => {

  let element;

  beforeEach(() => {
    expect.extend({
      toEqualJq: function (actual, expected) {
        // Jquery <= 2.2 objects add a context property that is irrelevant for equality
        if (actual && actual.hasOwnProperty('context')) {
          delete actual.context;
        }

        if (expected && expected.hasOwnProperty('context')) {
          delete expected.context;
        }

        const passed = this.equals(actual, expected);
        return {
          message: passed
            ? () => `Expected ${this.utils.stringify(actual)} not to equal ${this.utils.stringify(expected)}`
            : () => `Expected ${this.utils.stringify(actual)} to equal ${this.utils.stringify(expected)}`,
          pass: passed
        };
      }
    });
  });

  afterEach(angular.mock.inject($rootElement => {
    $rootElement.empty();
    dealoc($rootElement);

    dealoc(element);
  }));

  describe('on a component', () => {
    let myComponentController, attributeDirectiveController, $rootScope, $compile;

    beforeEach(angular.mock.module($compileProvider => {
      $compileProvider.component('myComponent', {
        template: 'foo',
        controller: function () {
          myComponentController = this;
        }
      });

      $compileProvider.directive('attributeDirective', () => {
        return {
          restrict: 'A',
          controller: function () {
            attributeDirectiveController = this;
          }
        };
      });
    }));

    beforeEach(angular.mock.inject((_$compile_, _$rootScope_) => {
      $rootScope = _$rootScope_.$new();
      $compile = _$compile_;
    }));

    afterEach(() => {
      $rootScope.$destroy();

      dealoc($rootScope);
      dealoc(element);

      $rootScope = null;
      $compile = null;
      myComponentController = null;
      attributeDirectiveController = null;
    });

    it('should bind in the current scope the controller of a component', () => {
      $rootScope.$ctrl = 'undamaged';

      element = $compile('<my-component ng-ref="myComponentRef"></my-component>')($rootScope);
      $rootScope.$digest();

      expect($rootScope.$ctrl).toBe('undamaged');
      expect($rootScope.myComponentRef).toBe(myComponentController);
    });

    it('should throw if the expression is not assignable', () => {
      expect(() => {
        element = $compile('<my-component ng-ref="\'hello\'"></my-component>')($rootScope);
        $rootScope.$digest();
      }).toThrowMinErr('ngRef', 'nonassign', 'Expression in ngRef="\'hello\'" is non-assignable!');
    });

    it('should work with non:normalized entity name', () => {
      element = $compile('<my:component ng-ref="myComponent1"></my:component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponent1).toBe(myComponentController);
    });

    it('should work with data-non-normalized entity name', () => {
      element = $compile('<data-my-component ng-ref="myComponent2"></data-my-component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponent2).toBe(myComponentController);
    });

    it('should work with x-non-normalized entity name', () => {
      element = $compile('<x-my-component ng-ref="myComponent3"></x-my-component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponent3).toBe(myComponentController);
    });

    it('should work with data-non-normalized attribute name', () => {
      element = $compile('<my-component data-ng-ref="myComponent1"></my-component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponent1).toBe(myComponentController);
    });

    it('should work with x-non-normalized attribute name', () => {
      element = $compile('<my-component x-ng-ref="myComponent2"></my-component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponent2).toBe(myComponentController);
    });

    it('should not bind the controller of an attribute directive', () => {
      element = $compile('<my-component attribute-directive-1 ng-ref="myComponentRef"></my-component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponentRef).toBe(myComponentController);
    });

    it('should not leak to parent scopes', () => {
      const template =
        '<div ng-if="true">' +
        '<my-component ng-ref="myComponent"></my-component>' +
        '</div>';
      element = compileForTest(template);
      $rootScope.$digest();
      expect($rootScope.myComponent).toBe(undefined);
    });

    it('should nullify the variable once the component is destroyed', () => {
      const template = '<div><my-component ng-ref="myComponent"></my-component></div>';

      const element = $compile(template)($rootScope);
      $rootScope.$digest();
      expect($rootScope.myComponent).toBe(myComponentController);

      const componentElement = element.children();
      const isolateScope = componentElement.isolateScope();
      componentElement.remove();
      isolateScope.$destroy();
      expect($rootScope.myComponent).toBe(null);
    });

    it('should be compatible with entering/leaving components', angular.mock.inject($animate => {
      const template = '<my-component ng-ref="myComponent"></my-component>';
      $rootScope.$ctrl = {};
      const parent = $compile('<div></div>')($rootScope);
      toDealoc.push(parent);
      $rootScope.$digest();

      const leaving = $compile(template)($rootScope);
      toDealoc.push(leaving);
      $rootScope.$digest();
      const leavingController = myComponentController;

      $animate.enter(leaving, parent);
      expect($rootScope.myComponent).toBe(leavingController);

      const entering = $compile(template)($rootScope);
      toDealoc.push(entering);
      $rootScope.$digest();
      const enteringController = myComponentController;

      $animate.enter(entering, parent);
      $animate.leave(leaving, parent);
      expect($rootScope.myComponent).toBe(enteringController);
    }));

    it('should allow binding to a nested property', () => {
      $rootScope.obj = {};

      element = $compile('<my-component ng-ref="obj.myComponent"></my-component>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.obj.myComponent).toBe(myComponentController);
    });
  });

  it('should bind the jqlite wrapped DOM element if there is no component', angular.mock.inject(($compile, $rootScope) => {
    $rootScope = $rootScope.$new();

    element = $compile('<span ng-ref="mySpan">my text</span>')($rootScope);
    $rootScope.$digest();

    expect($rootScope.mySpan).toEqualJq(element);
    expect($rootScope.mySpan[0].textContent).toBe('my text');

    $rootScope.$destroy();
  }));

  it('should nullify the expression value if the DOM element is destroyed', angular.mock.inject(($compile, $rootScope) => {
    $rootScope = $rootScope.$new();

    element = $compile('<div><span ng-ref="mySpan">my text</span></div>')($rootScope);
    $rootScope.$digest();

    element.children().remove();
    $rootScope.$digest();
    expect($rootScope.mySpan).toBe(null);

    $rootScope.$destroy();
  }));

  it('should bind the controller of an element directive', () => {
    let myDirectiveController;

    angular.mock.module($compileProvider => {
      $compileProvider.directive('myDirective', () => {
        return {
          controller: function () {
            myDirectiveController = this;
          }
        };
      });
    });

    angular.mock.inject(($compile, $rootScope) => {
      $rootScope = $rootScope.$new();

      element = $compile('<my-directive ng-ref="myDirective"></my-directive>')($rootScope);
      $rootScope.$digest();

      expect($rootScope.myDirective).toBe(myDirectiveController);

      $rootScope.$destroy();
    });
  });

  describe('ngRefRead', () => {
    it('should bind the element instead of the controller of a component if ngRefRead="$element" is set', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.component('myComponent', {
          template: 'my text',
          controller: function () { }
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        element = $compile('<my-component ng-ref="myEl" ng-ref-read="$element"></my-component>')($rootScope);
        $rootScope.$digest();

        expect($rootScope.myEl).toEqualJq(element);
        expect($rootScope.myEl[0].textContent).toBe('my text');

        $rootScope.$destroy();
      });
    });

    it('should bind the element instead an element-directive controller if ngRefRead="$element" is set', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('myDirective', () => {
          return {
            restrict: 'E',
            template: 'my text',
            controller: function () { }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        element = $compile('<my-directive ng-ref="myEl" ng-ref-read="$element"></my-directive>')($rootScope);
        $rootScope.$digest();

        expect($rootScope.myEl).toEqualJq(element);
        expect($rootScope.myEl[0].textContent).toBe('my text');

        $rootScope.$destroy();
      });
    });

    it('should bind an attribute-directive controller if ngRefRead="controllerName" is set', () => {
      let attrDirective1Controller;

      angular.mock.module($compileProvider => {
        $compileProvider.directive('elementDirective', () => {
          return {
            restrict: 'E',
            template: 'my text',
            controller: function () { }
          };
        });

        $compileProvider.directive('attributeDirective1', () => {
          return {
            restrict: 'A',
            controller: function () {
              attrDirective1Controller = this;
            }
          };
        });

        $compileProvider.directive('attributeDirective2', () => {
          return {
            restrict: 'A',
            controller: function () { }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        element = $compile('<element-directive' +
          ' attribute-directive-1' +
          ' attribute-directive-2' +
          ' ng-ref="myController"' +
          ' ng-ref-read="attributeDirective1"></element-directive>')($rootScope);
        $rootScope.$digest();

        expect($rootScope.myController).toBe(attrDirective1Controller);

        $rootScope.$destroy();
      });
    });

    it('should throw if no controller is found for the ngRefRead value', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('elementDirective', () => {
          return {
            restrict: 'E',
            template: 'my text',
            controller: function () { }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        expect(() => {
          element = compileForTest('<element-directive ' +
            'ng-ref="myController" ' +
            'ng-ref-read="attribute"></element-directive>', $rootScope);
          $rootScope.$digest();

        }).toThrowMinErr('ngRef', 'noctrl', 'The controller for ngRefRead="attribute" could not be found on ngRef="myController"');

        $rootScope.$destroy();
        dealoc($rootScope);
      });
    });
  });

  it('should bind the jqlite element if the controller is on an attribute-directive', () => {
    let myDirectiveController;

    angular.mock.module($compileProvider => {
      $compileProvider.directive('myDirective', () => {
        return {
          restrict: 'A',
          template: 'my text',
          controller: function () {
            myDirectiveController = this;
          }
        };
      });
    });

    angular.mock.inject(($compile, $rootScope) => {
      $rootScope = $rootScope.$new();

      element = $compile('<div my-directive ng-ref="myEl"></div>')($rootScope);
      $rootScope.$digest();

      expect(myDirectiveController).toBeDefined();
      expect($rootScope.myEl).toEqualJq(element);
      expect($rootScope.myEl[0].textContent).toBe('my text');

      $rootScope.$destroy();
    });
  });

  it('should bind the jqlite element if the controller is on an class-directive', () => {
    let myDirectiveController;

    angular.mock.module($compileProvider => {
      $compileProvider.directive('myDirective', () => {
        return {
          restrict: 'C',
          template: 'my text',
          controller: function () {
            myDirectiveController = this;
          }
        };
      });
    });

    angular.mock.inject(($compile, $rootScope) => {
      $rootScope = $rootScope.$new();

      element = $compile('<div class="my-directive" ng-ref="myEl"></div>')($rootScope);
      $rootScope.$digest();

      expect(myDirectiveController).toBeDefined();
      expect($rootScope.myEl).toEqualJq(element);
      expect($rootScope.myEl[0].textContent).toBe('my text');

      $rootScope.$destroy();
    });
  });

  describe('transclusion', () => {
    it('should work with simple transclusion', () => {
      angular.mock.module($compileProvider => {
        $compileProvider
          .component('myComponent', {
            transclude: true,
            template: '<ng-transclude></ng-transclude>',
            controller: function () {
              this.text = 'SUCCESS';
            }
          });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        const template = '<my-component ng-ref="myComponent">{{myComponent.text}}</my-component>';
        const element = $compile(template)($rootScope);
        toDealoc.push(element);
        $rootScope.$apply();
        expect(element.text()).toBe('SUCCESS');

        $rootScope.$destroy();
      });
    });

    it('should be compatible with element transclude components', () => {
      angular.mock.module($compileProvider => {
        $compileProvider
          .component('myComponent', {
            transclude: 'element',
            controller: function ($animate, $element, $transclude) {
              this.text = 'SUCCESS';
              this.$postLink = () => {
                $transclude(clone => {
                  $animate.enter(clone, $element.parent(), $element);
                });
              };
            }
          });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        const template =
          '<div>' +
          '<my-component ng-ref="myComponent">' +
          '{{myComponent.text}}' +
          '</my-component>' +
          '</div>';
        const element = $compile(template)($rootScope);
        toDealoc.push(element);
        $rootScope.$apply();
        expect(element.text()).toBe('SUCCESS');

        $rootScope.$destroy();
      });
    });

    it('should be compatible with ngIf and transclusion on same element', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.component('myComponent', {
          template: '<ng-transclude></ng-transclude>',
          transclude: true,
          controller: function () {
            this.text = 'SUCCESS';
          }
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        const template =
          '<div>' +
          '<my-component ng-if="present" ng-ref="myComponent" >' +
          '{{myComponent.text}}' +
          '</my-component>' +
          '</div>';
        const element = $compile(template)($rootScope);
        toDealoc.push(element);

        $rootScope.$apply('present = false');
        expect(element.text()).toBe('');
        $rootScope.$apply('present = true');
        expect(element.text()).toBe('SUCCESS');
        $rootScope.$apply('present = false');
        expect(element.text()).toBe('');
        $rootScope.$apply('present = true');
        expect(element.text()).toBe('SUCCESS');

        $rootScope.$destroy();
      });
    });

    it('should be compatible with element transclude & destroy components', () => {
      let myComponentController;
      angular.mock.module($compileProvider => {
        $compileProvider
          .component('myTranscludingComponent', {
            transclude: 'element',
            controller: function ($animate, $element, $transclude) {
              myComponentController = this;

              let currentClone, currentScope;
              this.transclude = function (text) {
                this.text = text;
                $transclude((clone, newScope) => {
                  currentClone = clone;
                  currentScope = newScope;
                  $animate.enter(clone, $element.parent(), $element);
                });
              };
              this.destroy = () => {
                currentClone.remove();
                currentScope.$destroy();
              };
            }
          });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        const template =
          '<div>' +
          '<my-transcluding-component ng-ref="myComponent">' +
          '{{myComponent.text}}' +
          '</my-transcluding-component>' +
          '</div>';
        const element = $compile(template)($rootScope);
        toDealoc.push(element);
        $rootScope.$apply();
        expect(element.text()).toBe('');

        myComponentController.transclude('transcludedOk');
        $rootScope.$apply();
        expect(element.text()).toBe('transcludedOk');

        myComponentController.destroy();
        $rootScope.$apply();
        expect(element.text()).toBe('');

        $rootScope.$destroy();
      });
    });

    it('should be compatible with element transclude directives', () => {
      angular.mock.module($compileProvider => {
        $compileProvider
          .directive('myDirective', $animate => {
            return {
              transclude: 'element',
              controller: function () {
                this.text = 'SUCCESS';
              },
              link: function (scope, element, attrs, ctrl, $transclude) {
                $transclude(clone => {
                  $animate.enter(clone, element.parent(), element);
                });
              }
            };
          });
      });

      angular.mock.inject(($compile, $rootScope) => {
        $rootScope = $rootScope.$new();

        const template =
          '<div>' +
          '<my-directive ng-ref="myDirective">' +
          '{{myDirective.text}}' +
          '</my-directive>' +
          '</div>';
        const element = $compile(template)($rootScope);
        toDealoc.push(element);
        $rootScope.$apply();
        expect(element.text()).toBe('SUCCESS');

        $rootScope.$destroy();
      });
    });
  });

  it('should work with components with templates via $http', () => {
    angular.mock.module($compileProvider => {
      $compileProvider.component('httpComponent', {
        templateUrl: 'template.html',
        controller: function () {
          this.me = true;
        }
      });
    });

    angular.mock.inject(($compile, $httpBackend, $rootScope) => {
      $rootScope = $rootScope.$new();

      const template = '<div><http-component ng-ref="controller"></http-component></div>';
      const element = $compile(template)($rootScope);
      toDealoc.push(element);
      $httpBackend.expect('GET', 'template.html').respond('ok');
      $rootScope.$apply();
      expect($rootScope.controller).toBeUndefined();
      $httpBackend.flush();
      expect($rootScope.controller.me).toBe(true);

      $rootScope.$destroy();
    });
  });

  it('should work with ngRepeat-ed components', () => {
    const controllers = [];

    angular.mock.module($compileProvider => {
      $compileProvider.component('myComponent', {
        template: 'foo',
        controller: function () {
          controllers.push(this);
        }
      });
    });

    angular.mock.inject(($compile, $rootScope) => {
      $rootScope = $rootScope.$new();
      $rootScope.elements = [0, 1, 2, 3, 4];
      $rootScope.controllers = [];

      const template = '<div><my-component ng-repeat="(key, el) in elements" ng-ref="controllers[key]"></my-component></div>';
      element = $compile(template)($rootScope);
      $rootScope.$apply();

      expect($rootScope.controllers).toEqual(controllers);

      $rootScope.$apply('elements = []');

      expect($rootScope.controllers).toEqual([null, null, null, null, null]);

      $rootScope.$destroy();
    });
  });
});
