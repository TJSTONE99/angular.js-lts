'use strict';

describe('$animate', () => {

  describe('without animation', () => {
    let element, $rootElement;

    afterEach(() => {
      dealoc(element);
      dealoc($rootElement);
    })

    beforeEach(angular.mock.module(() => {
      return ($compile, _$rootElement_, $rootScope) => {
        element = $compile('<div></div>')($rootScope);
        $rootElement = _$rootElement_;
      };
    }));

    it('should add element at the start of enter animation', angular.mock.inject(($animate, $compile, $rootScope) => {
      const child = $compile('<div></div>')($rootScope);
      expect(element.contents().length).toBe(0);
      $animate.enter(child, element);
      expect(element.contents().length).toBe(1);
    }));

    it('should enter the element to the start of the parent container',
      angular.mock.inject(($animate, $compile, $rootScope) => {

        for (let i = 0; i < 5; i++) {
          element.append(angular.element('<div> ' + i + '</div>'));
        }

        const child = angular.element('<div>first</div>');
        $animate.enter(child, element);

        expect(element.text()).toEqual('first 0 1 2 3 4');
      }));

    it('should remove the element at the end of leave animation', angular.mock.inject(($animate, $compile, $rootScope) => {
      const child = $compile('<div></div>')($rootScope);
      element.append(child);
      expect(element.contents().length).toBe(1);
      $animate.leave(child);
      expect(element.contents().length).toBe(0);
    }));

    it('should reorder the move animation', angular.mock.inject(($animate, $compile, $rootScope) => {
      const child1 = $compile('<div>1</div>')($rootScope);
      const child2 = $compile('<div>2</div>')($rootScope);
      element.append(child1);
      element.append(child2);
      expect(element.text()).toBe('12');
      $animate.move(child1, element, child2);
      expect(element.text()).toBe('21');
    }));

    it('should apply styles instantly to the element',
      angular.mock.inject(($animate, $compile, $rootScope) => {

        $animate.animate(element, { color: 'rgb(0, 0, 0)' });
        expect(element.css('color')).toBe('rgb(0, 0, 0)');

        $animate.animate(element, { color: 'rgb(255, 0, 0)' }, { color: 'rgb(0, 255, 0)' });
        expect(element.css('color')).toBe('rgb(0, 255, 0)');
      }));

    it('should still perform DOM operations even if animations are disabled (post-digest)', angular.mock.inject(($animate, $rootScope) => {
      $animate.enabled(false);
      expect(element).toBeShown();
      $animate.addClass(element, 'ng-hide');
      $rootScope.$digest();
      expect(element).toBeHidden();
    }));

    it('should run each method and return a promise', angular.mock.inject(($animate, $document) => {
      const element = angular.element('<div></div>');
      const move = angular.element('<div></div>');
      const parent = angular.element($document[0].body);
      parent.append(move);

      expect($animate.enter(element, parent)).toBeAPromise();
      expect($animate.move(element, move)).toBeAPromise();
      expect($animate.addClass(element, 'on')).toBeAPromise();
      expect($animate.removeClass(element, 'off')).toBeAPromise();
      expect($animate.setClass(element, 'on', 'off')).toBeAPromise();
      expect($animate.leave(element)).toBeAPromise();
    }));

    it('should provide the `enabled` and `cancel` methods', angular.mock.inject($animate => {
      expect($animate.enabled()).toBeUndefined();
      expect($animate.cancel({})).toBeUndefined();
    }));

    it('should provide the `on` and `off` methods', angular.mock.inject($animate => {
      expect(angular.isFunction($animate.on)).toBe(true);
      expect(angular.isFunction($animate.off)).toBe(true);
    }));

    it('should add and remove classes on SVG elements', angular.mock.inject(($animate, $rootScope) => {
      if (!window.SVGElement) return;
      const svg = angular.element('<svg><rect></rect></svg>');
      const rect = svg.children();
      $animate.enabled(false);
      expect(rect).toBeShown();
      $animate.addClass(rect, 'ng-hide');
      $rootScope.$digest();
      expect(rect).toBeHidden();
      $animate.removeClass(rect, 'ng-hide');
      $rootScope.$digest();
      expect(rect).not.toBeHidden();
    }));

    it('should throw error on wrong selector', () => {
      angular.mock.module($animateProvider => {
        expect(() => {
          $animateProvider.register('abc', null);
        }).toThrowMinErr('$animate', 'notcsel', 'Expecting class selector starting with \'.\' got \'abc\'.');
      });
      angular.mock.inject();
    });

    it('should register the animation and be available for lookup', () => {
      let provider;
      angular.mock.module($animateProvider => {
        provider = $animateProvider;
      });
      angular.mock.inject(() => {
        // by using hasOwnProperty we know for sure that the lookup object is an empty object
        // instead of inheriting properties from its original prototype.
        expect(provider.$$registeredAnimations.hasOwnProperty).toBeFalsy();

        provider.register('.filter', angular.noop);
        expect(provider.$$registeredAnimations['filter']).toBe('.filter-animation');
      });
    });

    it('should apply and retain inline styles on the element that is animated', angular.mock.inject(($animate, $rootScope) => {
      const element = angular.element('<div></div>');
      const parent = angular.element('<div></div>');
      const other = angular.element('<div></div>');
      parent.append(other);
      $animate.enabled(true);

      $animate.enter(element, parent, null, {
        to: { color: 'red' }
      });
      assertColor('red');

      $animate.move(element, null, other, {
        to: { color: 'yellow' }
      });
      assertColor('yellow');

      $animate.addClass(element, 'on', {
        to: { color: 'green' }
      });
      $rootScope.$digest();
      assertColor('green');

      $animate.setClass(element, 'off', 'on', {
        to: { color: 'black' }
      });
      $rootScope.$digest();
      assertColor('black');

      $animate.removeClass(element, 'off', {
        to: { color: 'blue' }
      });
      $rootScope.$digest();
      assertColor('blue');

      $animate.leave(element, {
        to: { color: 'yellow' }
      });
      $rootScope.$digest();
      assertColor('yellow');

      function assertColor(color) {
        expect(element[0].style.color).toBe(color);
      }
    }));

    it('should merge the from and to styles that are provided',
      angular.mock.inject(($animate, $rootScope) => {

        const element = angular.element('<div></div>');

        element.css('color', 'red');
        $animate.addClass(element, 'on', {
          from: { color: 'green' },
          to: { borderColor: 'purple' }
        });
        $rootScope.$digest();

        const style = element[0].style;
        expect(style.color).toBe('green');
        expect(style.borderColor).toBe('purple');
      }));

    it('should avoid cancelling out add/remove when the element already contains the class',
      angular.mock.inject(($animate, $rootScope) => {

        const element = angular.element('<div class="ng-hide"></div>');

        $animate.addClass(element, 'ng-hide');
        $animate.removeClass(element, 'ng-hide');
        $rootScope.$digest();

        expect(element).not.toHaveClass('ng-hide');
      }));

    it('should avoid cancelling out remove/add if the element does not contain the class',
      angular.mock.inject(($animate, $rootScope) => {

        const element = angular.element('<div></div>');

        $animate.removeClass(element, 'ng-hide');
        $animate.addClass(element, 'ng-hide');
        $rootScope.$digest();

        expect(element).toHaveClass('ng-hide');
      }));

    they('should accept an unwrapped "parent" element for the $prop event',
      ['enter', 'move'], method => {

        angular.mock.inject(($document, $animate, $rootElement) => {
          const element = angular.element('<div></div>');
          const parent = $document[0].createElement('div');
          $rootElement.append(parent);

          $animate[method](element, parent);
          expect(element[0].parentNode).toBe(parent);
        });
      });

    they('should accept an unwrapped "after" element for the $prop event',
      ['enter', 'move'], method => {

        angular.mock.inject(($document, $animate, $rootElement) => {
          const element = angular.element('<div></div>');
          const after = $document[0].createElement('div');
          $rootElement.append(after);

          $animate[method](element, null, after);
          expect(element[0].previousSibling).toBe(after);
        });
      });

    they('$prop() should operate using a native DOM element',
      ['enter', 'move', 'leave', 'addClass', 'removeClass', 'setClass', 'animate'], event => {

        const captureSpy = jest.fn();

        angular.mock.module($provide => {
          $provide.value('$$animateQueue', {
            push: captureSpy
          });
        });

        angular.mock.inject(($animate, $rootScope, $document, $rootElement) => {
          const element = angular.element('<div></div>');
          const parent2 = angular.element('<div></div>');
          const parent = $rootElement;
          parent.append(parent2);

          if (event !== 'enter' && event !== 'move') {
            parent.append(element);
          }

          let fn;
          const invalidOptions = () => { };

          switch (event) {
            case 'enter':
            case 'move':
              fn = () => {
                $animate[event](element, parent, parent2, invalidOptions);
              };
              break;

            case 'addClass':
              fn = () => {
                $animate.addClass(element, 'klass', invalidOptions);
              };
              break;

            case 'removeClass':
              element.className = 'klass';
              fn = () => {
                $animate.removeClass(element, 'klass', invalidOptions);
              };
              break;

            case 'setClass':
              element.className = 'two';
              fn = () => {
                $animate.setClass(element, 'one', 'two', invalidOptions);
              };
              break;

            case 'leave':
              fn = () => {
                $animate.leave(element, invalidOptions);
              };
              break;

            case 'animate':
              const toStyles = { color: 'red' };
              fn = () => {
                $animate.animate(element, {}, toStyles, 'klass', invalidOptions);
              };
              break;
          }

          expect(() => {
            fn();
            $rootScope.$digest();
          }).not.toThrow();

          const optionsArg = captureSpy.mock.calls[captureSpy.mock.calls.length - 1][2];
          expect(optionsArg).not.toBe(invalidOptions);
          expect(angular.isObject(optionsArg)).toBeTruthy();
        });
      });
  });

  it('should not issue a call to addClass if the provided class value is not a string or array', () => {
    angular.mock.inject(($animate, $rootScope, $rootElement) => {
      const element = angular.element('<div></div>');
      const parent = $rootElement;

      // not string/array => should not add anything
      $animate.enter(element, parent, null, { addClass: angular.noop });
      $rootScope.$digest();
      expect(element.hasClass('fatias')).toBe(false);

      $animate.leave(element, { addClass: true });
      $rootScope.$digest();
      expect(element.hasClass('fatias')).toBe(false);

      // string => should add the class
      $animate.enter(element, parent, null, { addClass: 'fatias' });
      $rootScope.$digest();
      expect(element.hasClass('fatias')).toBe(true);
    });
  });


  it('should not break postDigest for subsequent elements if addClass contains non-valid CSS class names', () => {
    angular.mock.inject(($animate, $rootScope, $rootElement) => {
      const element1 = angular.element('<div></div>');
      const element2 = angular.element('<div></div>');

      $animate.enter(element1, $rootElement, null, { addClass: ' ' });
      $animate.enter(element2, $rootElement, null, { addClass: 'valid-name' });
      $rootScope.$digest();

      expect(element2.hasClass('valid-name')).toBeTruthy();
    });
  });


  it('should not issue a call to removeClass if the provided class value is not a string or array', () => {
    angular.mock.inject(($animate, $rootScope, $rootElement) => {
      const element = angular.element('<div class="fatias"></div>');
      const parent = $rootElement;

      $animate.enter(element, parent, null, { removeClass: angular.noop });
      $rootScope.$digest();
      expect(element[0].className).toBe("fatias");

      $animate.leave(element, { removeClass: true });
      $rootScope.$digest();
      expect(element[0].className).toBe("fatias");

      element.addClass('fatias');
      $animate.enter(element, parent, null, { removeClass: 'fatias' });
      $rootScope.$digest();
      expect(element[0].className).toBe("");

    });
  });

  it('should not alter the provided options input in any way throughout the animation', angular.mock.inject(($animate, $rootElement, $rootScope) => {
    const element = angular.element('<div></div>');
    const parent = $rootElement;

    const initialOptions = {
      from: { height: '50px' },
      to: { width: '50px' },
      addClass: 'one',
      removeClass: 'two'
    };

    const copiedOptions = angular.copy(initialOptions);
    expect(copiedOptions).toEqual(initialOptions);

    const runner = $animate.enter(element, parent, null, copiedOptions);
    expect(copiedOptions).toEqual(initialOptions);

    $rootScope.$digest();
    expect(copiedOptions).toEqual(initialOptions);
  }));

  describe('CSS class DOM manipulation', () => {
    let element;
    let addClass;
    let removeClass;

    beforeEach(angular.mock.module(provideLog));

    afterEach(() => {
      // restore spies if set
      if (addClass && addClass.mockRestore) addClass.mockRestore();
      if (removeClass && removeClass.mockRestore) removeClass.mockRestore();
      dealoc(element);
    });

    function setupClassManipulationSpies() {
      // No inject() here. Just spy on jqLite/jQuery public API.
      const proto = angular.element.prototype;
      addClass = jest.spyOn(proto, 'addClass');
      removeClass = jest.spyOn(proto, 'removeClass');
    }

    function setupClassManipulationLogger(log) {
      // No inject() here. Just spy on jqLite/jQuery public API.
      const proto = angular.element.prototype;

      const originalAddClass = proto.addClass;
      const originalRemoveClass = proto.removeClass;

      addClass = jest.spyOn(proto, 'addClass').mockImplementation(function (classes) {
        const names = Array.isArray(classes) ? classes.join(' ') : classes;
        log(`addClass(${names})`);
        return originalAddClass.call(this, classes);
      });

      removeClass = jest.spyOn(proto, 'removeClass').mockImplementation(function (classes) {
        const names = Array.isArray(classes) ? classes.join(' ') : classes;
        log(`removeClass(${names})`);
        return originalRemoveClass.call(this, classes);
      });
    }

    it('should defer class manipulation until end of digest', angular.mock.inject(($rootScope, $animate, log) => {
      element = angular.element('<p>test</p>');

      const postDigestSpy = jest.spyOn($rootScope, '$$postDigest');

      $rootScope.$apply(() => {
        $animate.addClass(element, 'test-class1');
        expect(element).not.toHaveClass('test-class1');

        $animate.removeClass(element, 'test-class1');

        $animate.addClass(element, 'test-class2');
        expect(element).not.toHaveClass('test-class2');

        $animate.setClass(element, 'test-class3', 'test-class4');
        expect(element).not.toHaveClass('test-class3');
        expect(element).not.toHaveClass('test-class4');
      });

      // After the digest completes, the postDigest flush has run and classes are updated.
      expect(element).not.toHaveClass('test-class1');
      expect(element).not.toHaveClass('test-class4');
      expect(element).toHaveClass('test-class2');
      expect(element).toHaveClass('test-class3');

      // Coalescing: only one postDigest handler should be scheduled for all ops.
      expect(postDigestSpy).toHaveBeenCalledTimes(1);

      postDigestSpy.mockRestore();
    }));


    it('should defer class manipulation until postDigest when outside of digest', angular.mock.inject(($rootScope, $animate, log) => {
      element = angular.element('<p class="test-class4">test</p>');
      const postDigestSpy = jest.spyOn($rootScope, '$$postDigest');

      $animate.addClass(element, 'test-class1');
      $animate.removeClass(element, 'test-class1');
      $animate.addClass(element, 'test-class2');
      $animate.setClass(element, 'test-class3', 'test-class4');

      // Nothing applied yet (outside digest, changes flush in postDigest)
      expect(element).not.toHaveClass('test-class1');
      expect(element).not.toHaveClass('test-class2');
      expect(element).not.toHaveClass('test-class3');
      expect(element).toHaveClass('test-class4');

      // A single flush should be scheduled (coalescing)
      expect(postDigestSpy).toHaveBeenCalledTimes(1);

      $rootScope.$digest();

      // After digest/postDigest flush, final classes should be correct
      expect(element).not.toHaveClass('test-class1');
      expect(element).toHaveClass('test-class2');
      expect(element).toHaveClass('test-class3');
      expect(element).not.toHaveClass('test-class4');

      postDigestSpy.mockRestore();
    }));


    it('should perform class manipulation in expected order at end of digest', angular.mock.inject(($rootScope, $animate, log) => {
      element = angular.element('<p class="test-class3">test</p>');

      const postDigestSpy = jest.spyOn($rootScope, '$$postDigest');

      $rootScope.$apply(() => {
        $animate.addClass(element, 'test-class1');
        $animate.addClass(element, 'test-class2');
        $animate.removeClass(element, 'test-class1');
        $animate.removeClass(element, 'test-class3');
        $animate.addClass(element, 'test-class3');

        // still deferred within digest
        expect(element).toHaveClass('test-class3'); // initial still present *during* apply
        expect(element).not.toHaveClass('test-class2');
      });

      // End result: class1 removed, class2 present, class3 present (re-added)
      expect(element).not.toHaveClass('test-class1');
      expect(element).toHaveClass('test-class2');
      expect(element).toHaveClass('test-class3');

      // Still should batch into one postDigest flush
      expect(postDigestSpy).toHaveBeenCalledTimes(1);

      postDigestSpy.mockRestore();
    }));


    it('should return a promise which is resolved on a different turn', angular.mock.inject((log, $animate, $$rAF, $rootScope) => {
      element = angular.element('<p class="test2">test</p>');

      $animate.addClass(element, 'test1').then(log.fn('addClass(test1)'));
      $animate.removeClass(element, 'test2').then(log.fn('removeClass(test2)'));

      $rootScope.$digest();
      expect(log).toEqual([]);
      $$rAF.flush();
      $rootScope.$digest();
      expect(log).toEqual(['addClass(test1)', 'removeClass(test2)']);

      log.reset();
      element = angular.element('<p class="test4">test</p>');

      $rootScope.$apply(() => {
        $animate.addClass(element, 'test3').then(log.fn('addClass(test3)'));
        $animate.removeClass(element, 'test4').then(log.fn('removeClass(test4)'));
      });

      $$rAF.flush();
      $rootScope.$digest();
      expect(log).toEqual(['addClass(test3)', 'removeClass(test4)']);
    }));


    it('should defer class manipulation until end of digest for SVG', angular.mock.inject(($rootScope, $animate) => {
      if (!window.SVGElement) return;

      element = angular.element('<svg><g></g></svg>');
      const target = element.children().eq(0);

      const postDigestSpy = jest.spyOn($rootScope, '$$postDigest');

      $rootScope.$apply(() => {
        $animate.addClass(target, 'test-class1');
        expect(target).not.toHaveClass('test-class1');

        $animate.removeClass(target, 'test-class1');

        $animate.addClass(target, 'test-class2');
        expect(target).not.toHaveClass('test-class2');

        $animate.setClass(target, 'test-class3', 'test-class4');
        expect(target).not.toHaveClass('test-class3');
        expect(target).not.toHaveClass('test-class4');
      });

      expect(target).not.toHaveClass('test-class1');
      expect(target).toHaveClass('test-class2');
      expect(target).toHaveClass('test-class3');
      expect(target).not.toHaveClass('test-class4');

      expect(postDigestSpy).toHaveBeenCalledTimes(1);
      postDigestSpy.mockRestore();
    }));


    it('should defer class manipulation until postDigest when outside of digest for SVG', angular.mock.inject(($rootScope, $animate, log) => {
      if (!window.SVGElement) return;

      element = angular.element('<svg><g class="test-class4"></g></svg>');
      const target = element.children().eq(0);

      const postDigestSpy = jest.spyOn($rootScope, '$$postDigest');

      $animate.addClass(target, 'test-class1');
      $animate.removeClass(target, 'test-class1');
      $animate.addClass(target, 'test-class2');
      $animate.setClass(target, 'test-class3', 'test-class4');

      expect(target).toHaveClass('test-class4');
      expect(target).not.toHaveClass('test-class2');
      expect(target).not.toHaveClass('test-class3');

      expect(postDigestSpy).toHaveBeenCalledTimes(1);

      $rootScope.$digest();

      expect(target).not.toHaveClass('test-class1');
      expect(target).toHaveClass('test-class2');
      expect(target).toHaveClass('test-class3');
      expect(target).not.toHaveClass('test-class4');

      postDigestSpy.mockRestore();
    }));


    it('should perform class manipulation in expected order at end of digest for SVG', angular.mock.inject(($rootScope, $animate, log) => {
      if (!window.SVGElement) return;

      element = angular.element('<svg><g class="test-class3"></g></svg>');
      const target = element.children().eq(0);

      const postDigestSpy = jest.spyOn($rootScope, '$$postDigest');

      $rootScope.$apply(() => {
        $animate.addClass(target, 'test-class1');
        $animate.addClass(target, 'test-class2');
        $animate.removeClass(target, 'test-class1');
        $animate.removeClass(target, 'test-class3');
        $animate.addClass(target, 'test-class3');

        // still deferred inside the digest
        expect(target).toHaveClass('test-class3');
        expect(target).not.toHaveClass('test-class2');
      });

      // end result matches the intended ordering
      expect(target).not.toHaveClass('test-class1');
      expect(target).toHaveClass('test-class2');
      expect(target).toHaveClass('test-class3');

      // still coalesced into one postDigest flush
      expect(postDigestSpy).toHaveBeenCalledTimes(1);

      postDigestSpy.mockRestore();
    }));
  });
});
