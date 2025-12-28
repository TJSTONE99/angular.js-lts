'use strict';

describe('ngAnimate $$animateJs', () => {

  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  function getDoneFunction(args) {
    for (let i = 1; i < args.length; i++) {
      const a = args[i];
      if (angular.isFunction(a)) return a;
    }
  }

  it('should return nothing if no animations are registered at all', angular.mock.inject($$animateJs => {
    const element = angular.element('<div></div>');
    expect($$animateJs(element, 'enter')).toBeFalsy();
  }));

  it('should return nothing if no matching animations classes are found', () => {
    angular.mock.module($animateProvider => {
      $animateProvider.register('.foo', () => {
        return { enter: angular.noop };
      });
    });
    angular.mock.inject($$animateJs => {
      const element = angular.element('<div class="bar"></div>');
      expect($$animateJs(element, 'enter')).toBeFalsy();
    });
  });

  it('should return nothing if a matching animation class is found, but not a matching event', () => {
    angular.mock.module($animateProvider => {
      $animateProvider.register('.foo', () => {
        return { enter: angular.noop };
      });
    });
    angular.mock.inject($$animateJs => {
      const element = angular.element('<div class="foo"></div>');
      expect($$animateJs(element, 'leave')).toBeFalsy();
    });
  });

  it('should return a truthy value if a matching animation class and event are found', () => {
    angular.mock.module($animateProvider => {
      $animateProvider.register('.foo', () => {
        return { enter: angular.noop };
      });
    });
    angular.mock.inject($$animateJs => {
      const element = angular.element('<div class="foo"></div>');
      expect($$animateJs(element, 'enter')).toBeTruthy();
    });
  });

  it('should strictly query for the animation based on the classes value if passed in', () => {
    angular.mock.module($animateProvider => {
      $animateProvider.register('.superman', () => {
        return { enter: angular.noop };
      });
      $animateProvider.register('.batman', () => {
        return { leave: angular.noop };
      });
    });
    angular.mock.inject($$animateJs => {
      const element = angular.element('<div class="batman"></div>');
      expect($$animateJs(element, 'enter', 'superman')).toBeTruthy();
      expect($$animateJs(element, 'leave', 'legoman batman')).toBeTruthy();
      expect($$animateJs(element, 'enter', 'legoman')).toBeFalsy();
      expect($$animateJs(element, 'leave', {})).toBeTruthy();
    });
  });

  it('should run multiple animations in parallel', () => {
    const doneCallbacks = [];
    function makeAnimation(event) {
      return () => {
        const data = {};
        data[event] = (element, done) => {
          doneCallbacks.push(done);
        };
        return data;
      };
    }
    angular.mock.module($animateProvider => {
      $animateProvider.register('.one', makeAnimation('enter'));
      $animateProvider.register('.two', makeAnimation('enter'));
      $animateProvider.register('.three', makeAnimation('enter'));
    });
    angular.mock.inject(($$animateJs, $animate) => {
      const element = angular.element('<div class="one two three"></div>');
      const animator = $$animateJs(element, 'enter');
      let complete = false;
      animator.start().done(() => {
        complete = true;
      });
      expect(doneCallbacks.length).toBe(3);
      angular.forEach(doneCallbacks, cb => {
        cb();
      });
      $animate.flush();
      expect(complete).toBe(true);
    });
  });

  they('should $prop the animation when runner.$prop() is called', ['end', 'cancel'], method => {
    let ended = false;
    let status;
    angular.mock.module($animateProvider => {
      $animateProvider.register('.the-end', () => {
        return {
          enter: function () {
            return cancelled => {
              ended = true;
              status = cancelled ? 'cancel' : 'end';
            };
          }
        };
      });
    });
    angular.mock.inject($$animateJs => {
      const element = angular.element('<div class="the-end"></div>');
      const animator = $$animateJs(element, 'enter');
      const runner = animator.start();

      expect(angular.isFunction(runner[method])).toBe(true);

      expect(ended).toBeFalsy();
      runner[method]();
      expect(ended).toBeTruthy();
      expect(status).toBe(method);
    });
  });

  they('should $prop all of the running the animations when runner.$prop() is called',
    ['end', 'cancel'], method => {

      const lookup = {};
      angular.mock.module($animateProvider => {
        angular.forEach(['one', 'two', 'three'], klass => {
          $animateProvider.register('.' + klass, () => {
            return {
              enter: function () {
                return cancelled => {
                  lookup[klass] = cancelled ? 'cancel' : 'end';
                };
              }
            };
          });
        });
      });
      angular.mock.inject($$animateJs => {
        const element = angular.element('<div class="one two three"></div>');
        const animator = $$animateJs(element, 'enter');
        const runner = animator.start();

        runner[method]();
        expect(lookup.one).toBe(method);
        expect(lookup.two).toBe(method);
        expect(lookup.three).toBe(method);
      });
    });

  they('should only run the $prop operation once', ['end', 'cancel'], method => {
    let ended = false;
    let count = 0;
    angular.mock.module($animateProvider => {
      $animateProvider.register('.the-end', () => {
        return {
          enter: function () {
            return cancelled => {
              ended = true;
              count++;
            };
          }
        };
      });
    });
    angular.mock.inject($$animateJs => {
      const element = angular.element('<div class="the-end"></div>');
      const animator = $$animateJs(element, 'enter');
      const runner = animator.start();

      expect(angular.isFunction(runner[method])).toBe(true);

      expect(ended).toBeFalsy();
      runner[method]();
      expect(ended).toBeTruthy();
      expect(count).toBe(1);

      runner[method]();
      expect(count).toBe(1);
    });
  });

  it('should always run the provided animation in atleast one RAF frame if defined', () => {
    let before, after, endCalled;
    angular.mock.module($animateProvider => {
      $animateProvider.register('.the-end', () => {
        return {
          beforeAddClass: function (element, className, done) {
            before = done;
          },
          addClass: function (element, className, done) {
            after = done;
          }
        };
      });
    });
    angular.mock.inject(($$animateJs, $animate) => {
      const element = angular.element('<div class="the-end"></div>');
      const animator = $$animateJs(element, 'addClass', {
        addClass: 'red'
      });

      const runner = animator.start();
      runner.done(() => {
        endCalled = true;
      });

      expect(before).toBeDefined();
      before();

      expect(after).toBeUndefined();
      $animate.flush();
      expect(after).toBeDefined();
      after();

      expect(endCalled).toBeUndefined();
      $animate.flush();
      expect(endCalled).toBe(true);
    });
  });

  they('should still run the associated DOM event when the $prop function is run but no more animations', ['cancel', 'end'], method => {
    const log = [];
    angular.mock.module($animateProvider => {
      $animateProvider.register('.the-end', () => {
        return {
          beforeAddClass: function () {
            return cancelled => {
              const status = cancelled ? 'cancel' : 'end';
              log.push('before addClass ' + status);
            };
          },
          addClass: function () {
            return cancelled => {
              const status = cancelled ? 'cancel' : 'end';
              log.push('after addClass' + status);
            };
          }
        };
      });
    });
    angular.mock.inject(($$animateJs, $animate) => {
      const element = angular.element('<div class="the-end"></div>');
      const animator = $$animateJs(element, 'addClass', {
        domOperation: function () {
          log.push('dom addClass');
        }
      });
      const runner = animator.start();
      runner.done(() => {
        log.push('addClass complete');
      });
      runner[method]();

      $animate.flush();
      expect(log).toEqual(
        ['before addClass ' + method,
          'dom addClass',
          'addClass complete']);
    });
  });

  it('should resolve the promise when end() is called', () => {
    angular.mock.module($animateProvider => {
      $animateProvider.register('.the-end', () => {
        return { beforeAddClass: angular.noop };
      });
    });
    angular.mock.inject(($$animateJs, $animate, $rootScope) => {
      const element = angular.element('<div class="the-end"></div>');
      const animator = $$animateJs(element, 'addClass');
      const runner = animator.start();
      let done = false;
      let cancelled = false;
      runner.then(() => {
        done = true;
      }, () => {
        cancelled = true;
      });

      runner.end();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(true);
      expect(cancelled).toBe(false);
    });
  });

  it('should reject the promise when cancel() is called', () => {
    angular.mock.module($animateProvider => {
      $animateProvider.register('.the-end', () => {
        return { beforeAddClass: angular.noop };
      });
    });
    angular.mock.inject(($$animateJs, $animate, $rootScope) => {
      const element = angular.element('<div class="the-end"></div>');
      const animator = $$animateJs(element, 'addClass');
      const runner = animator.start();
      let done = false;
      let cancelled = false;
      runner.then(() => {
        done = true;
      }, () => {
        cancelled = true;
      });

      runner.cancel();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(false);
      expect(cancelled).toBe(true);
    });
  });

  describe('events', () => {
    let animations, runAnimation, element, log;
    beforeEach(angular.mock.module($animateProvider => {
      element = angular.element('<div class="test-animation"></div>');
      animations = {};
      log = [];

      $animateProvider.register('.test-animation', () => {
        return animations;
      });

      return $$animateJs => {
        runAnimation = (method, done, error, options) => {
          options = angular.extend(options || {}, {
            domOperation: function () {
              log.push('dom ' + method);
            }
          });

          const driver = $$animateJs(element, method, 'test-animation', options);
          driver.start().done(status => {
            ((status ? done : error) || angular.noop)();
          });
        };
      };
    }));

    they('$prop should have the function signature of (element, done, options) for the after animation',
      ['enter', 'move', 'leave'], event => {
        angular.mock.inject(() => {
          let args;
          const animationOptions = {};
          animationOptions.foo = 'bar';
          animations[event] = function () {
            args = arguments;
          };
          runAnimation(event, angular.noop, angular.noop, animationOptions);

          expect(args.length).toBe(3);
          expect(args[0]).toBe(element);
          expect(angular.isFunction(args[1])).toBe(true);
          expect(args[2].foo).toBe(animationOptions.foo);
        });
      });

    they('$prop should not execute a before function', enterMoveEvents, event => {
      angular.mock.inject(() => {
        let args;
        const beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
        const animationOptions = {};
        animations[beforeMethod] = function () {
          args = arguments;
        };

        runAnimation(event, angular.noop, angular.noop, animationOptions);
        expect(args).toBeFalsy();
      });
    });

    they('$prop should have the function signature of (element, className, done, options) for the before animation',
      ['addClass', 'removeClass'], event => {
        angular.mock.inject(() => {
          const beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
          let args;
          const className = 'matias';
          animations[beforeMethod] = function () {
            args = arguments;
          };

          const animationOptions = {};
          animationOptions.foo = 'bar';
          animationOptions[event] = className;
          runAnimation(event, angular.noop, angular.noop, animationOptions);

          expect(args.length).toBe(4);
          expect(args[0]).toBe(element);
          expect(args[1]).toBe(className);
          expect(angular.isFunction(args[2])).toBe(true);
          expect(args[3].foo).toBe(animationOptions.foo);
        });
      });

    they('$prop should have the function signature of (element, className, done, options) for the after animation',
      ['addClass', 'removeClass'], event => {
        angular.mock.inject(() => {
          let args;
          const className = 'fatias';
          animations[event] = function () {
            args = arguments;
          };

          const animationOptions = {};
          animationOptions.foo = 'bar';
          animationOptions[event] = className;
          runAnimation(event, angular.noop, angular.noop, animationOptions);

          expect(args.length).toBe(4);
          expect(args[0]).toBe(element);
          expect(args[1]).toBe(className);
          expect(angular.isFunction(args[2])).toBe(true);
          expect(args[3].foo).toBe(animationOptions.foo);
        });
      });

    they('setClass should have the function signature of (element, addClass, removeClass, done, options) for the $prop animation', ['before', 'after'], event => {
      angular.mock.inject(() => {
        let args;
        const method = event === 'before' ? 'beforeSetClass' : 'setClass';
        animations[method] = function () {
          args = arguments;
        };

        const addClass = 'on';
        const removeClass = 'on';
        const animationOptions = {
          foo: 'bar',
          addClass: addClass,
          removeClass: removeClass
        };
        runAnimation('setClass', angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(5);
        expect(args[0]).toBe(element);
        expect(args[1]).toBe(addClass);
        expect(args[2]).toBe(removeClass);
        expect(angular.isFunction(args[3])).toBe(true);
        expect(args[4].foo).toBe(animationOptions.foo);
      });
    });

    they('animate should have the function signature of (element, from, to, done, options) for the $prop animation', ['before', 'after'], event => {
      angular.mock.inject(() => {
        let args;
        const method = event === 'before' ? 'beforeAnimate' : 'animate';
        animations[method] = function () {
          args = arguments;
        };

        const to = { color: 'red' };
        const from = { color: 'blue' };
        const animationOptions = {
          foo: 'bar',
          to: to,
          from: from
        };
        runAnimation('animate', angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(5);
        expect(args[0]).toBe(element);
        expect(args[1]).toBe(from);
        expect(args[2]).toBe(to);
        expect(angular.isFunction(args[3])).toBe(true);
        expect(args[4].foo).toBe(animationOptions.foo);
      });
    });

    they('custom events should have the function signature of (element, done, options) for the $prop animation', ['before', 'after'], event => {
      angular.mock.inject(() => {
        let args;
        const method = event === 'before' ? 'beforeCustom' : 'custom';
        animations[method] = function () {
          args = arguments;
        };

        const animationOptions = {};
        animationOptions.foo = 'bar';
        runAnimation('custom', angular.noop, angular.noop, animationOptions);

        expect(args.length).toBe(3);
        expect(args[0]).toBe(element);
        expect(angular.isFunction(args[1])).toBe(true);
        expect(args[2].foo).toBe(animationOptions.foo);
      });
    });

    var enterMoveEvents = ['enter', 'move'];
    const otherEvents = ['addClass', 'removeClass', 'setClass'];
    const allEvents = ['leave'].concat(otherEvents).concat(enterMoveEvents);

    they('$prop should asynchronously render the before$prop animation', otherEvents, event => {
      angular.mock.inject($animate => {
        const beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
        animations[beforeMethod] = function (element, a, b, c) {
          log.push('before ' + event);
          const done = getDoneFunction(arguments);
          done();
        };

        runAnimation(event);
        expect(log).toEqual(['before ' + event]);
        $animate.flush();

        expect(log).toEqual(['before ' + event, 'dom ' + event]);
      });
    });

    they('$prop should asynchronously render the $prop animation', allEvents, event => {
      angular.mock.inject($animate => {
        animations[event] = function (element, a, b, c) {
          log.push('after ' + event);
          const done = getDoneFunction(arguments);
          done();
        };

        runAnimation(event, () => {
          log.push('complete');
        });

        if (event === 'leave') {
          expect(log).toEqual(['after leave']);
          $animate.flush();
          expect(log).toEqual(['after leave', 'dom leave', 'complete']);
        } else {
          expect(log).toEqual(['dom ' + event, 'after ' + event]);
          $animate.flush();
          expect(log).toEqual(['dom ' + event, 'after ' + event, 'complete']);
        }
      });
    });

    they('$prop should asynchronously render the $prop animation when a start/end animator object is returned',
      allEvents, event => {

        angular.mock.inject(($animate, $$AnimateRunner) => {
          let runner;
          animations[event] = (element, a, b, c) => {
            return {
              start: function () {
                log.push('start ' + event);
                runner = new $$AnimateRunner();
                return runner;
              }
            };
          };

          runAnimation(event, () => {
            log.push('complete');
          });

          if (event === 'leave') {
            expect(log).toEqual(['start leave']);
            runner.end();
            $animate.flush();
            expect(log).toEqual(['start leave', 'dom leave', 'complete']);
          } else {
            expect(log).toEqual(['dom ' + event, 'start ' + event]);
            runner.end();
            $animate.flush();
            expect(log).toEqual(['dom ' + event, 'start ' + event, 'complete']);
          }
        });
      });

    they('$prop should asynchronously render the $prop animation when an instance of $$AnimateRunner is returned',
      allEvents, event => {

        angular.mock.inject(($animate, $$AnimateRunner) => {
          let runner;
          animations[event] = (element, a, b, c) => {
            log.push('start ' + event);
            runner = new $$AnimateRunner();
            return runner;
          };

          runAnimation(event, () => {
            log.push('complete');
          });

          if (event === 'leave') {
            expect(log).toEqual(['start leave']);
            runner.end();
            $animate.flush();
            expect(log).toEqual(['start leave', 'dom leave', 'complete']);
          } else {
            expect(log).toEqual(['dom ' + event, 'start ' + event]);
            runner.end();
            $animate.flush();
            expect(log).toEqual(['dom ' + event, 'start ' + event, 'complete']);
          }
        });
      });

    they('$prop should asynchronously reject the before animation if the callback function is called with false', otherEvents, event => {
      angular.mock.inject(($animate, $rootScope) => {
        const beforeMethod = 'before' + event.charAt(0).toUpperCase() + event.substr(1);
        animations[beforeMethod] = function (element, a, b, c) {
          log.push('before ' + event);
          const done = getDoneFunction(arguments);
          done(false);
        };

        animations[event] = function (element, a, b, c) {
          log.push('after ' + event);
          const done = getDoneFunction(arguments);
          done();
        };

        runAnimation(event,
          () => { log.push('pass'); },
          () => { log.push('fail'); });

        expect(log).toEqual(['before ' + event]);
        $animate.flush();
        expect(log).toEqual(['before ' + event, 'dom ' + event, 'fail']);
      });
    });

    they('$prop should asynchronously reject the after animation if the callback function is called with false', allEvents, event => {
      angular.mock.inject(($animate, $rootScope) => {
        animations[event] = function (element, a, b, c) {
          log.push('after ' + event);
          const done = getDoneFunction(arguments);
          done(false);
        };

        runAnimation(event,
          () => { log.push('pass'); },
          () => { log.push('fail'); });

        const expectations = [];
        if (event === 'leave') {
          expect(log).toEqual(['after leave']);
          $animate.flush();
          expect(log).toEqual(['after leave', 'dom leave', 'fail']);
        } else {
          expect(log).toEqual(['dom ' + event, 'after ' + event]);
          $animate.flush();
          expect(log).toEqual(['dom ' + event, 'after ' + event, 'fail']);
        }
      });
    });

    it('setClass should delegate down to addClass/removeClass if not defined', angular.mock.inject($animate => {
      animations.addClass = (element, done) => {
        log.push('addClass');
      };

      animations.removeClass = (element, done) => {
        log.push('removeClass');
      };

      expect(animations.setClass).toBeFalsy();

      runAnimation('setClass');

      expect(log).toEqual(['dom setClass', 'removeClass', 'addClass']);
    }));

    it('beforeSetClass should delegate down to beforeAddClass/beforeRemoveClass if not defined',
      angular.mock.inject($animate => {

        animations.beforeAddClass = (element, className, done) => {
          log.push('beforeAddClass');
          done();
        };

        animations.beforeRemoveClass = (element, className, done) => {
          log.push('beforeRemoveClass');
          done();
        };

        expect(animations.setClass).toBeFalsy();

        runAnimation('setClass');
        $animate.flush();

        expect(log).toEqual(['beforeRemoveClass', 'beforeAddClass', 'dom setClass']);
      }));

    it('leave should always ignore the `beforeLeave` animation',
      angular.mock.inject($animate => {

        animations.beforeLeave = (element, done) => {
          log.push('beforeLeave');
          done();
        };

        animations.leave = (element, done) => {
          log.push('leave');
          done();
        };

        runAnimation('leave');
        $animate.flush();

        expect(log).toEqual(['leave', 'dom leave']);
      }));

    it('should allow custom events to be triggered',
      angular.mock.inject($animate => {

        animations.beforeFlex = (element, done) => {
          log.push('beforeFlex');
          done();
        };

        animations.flex = (element, done) => {
          log.push('flex');
          done();
        };

        runAnimation('flex');
        $animate.flush();

        expect(log).toEqual(['beforeFlex', 'dom flex', 'flex']);
      }));
  });
});
