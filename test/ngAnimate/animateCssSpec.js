'use strict';

describe('ngAnimate $animateCss', () => {

  beforeEach(angular.mock.module('ngAnimate'));
  beforeEach(angular.mock.module('ngAnimateMock'));

  function assertAnimationRunning(element, not) {
    const className = element.attr('class');
    const regex = /\b\w+-active\b/;
    if (not) {
      expect(className).toBe(regex);
    } else {
      expect(className).not.toBe(regex);
    }
  }


  function keyframeProgress(element, duration, delay) {
    browserTrigger(element, 'animationend',
      { timeStamp: Date.now() + ((delay || 1) * 1000), elapsedTime: duration });
  }

  function transitionProgress(element, duration, delay) {
    browserTrigger(element, 'transitionend',
      { timeStamp: Date.now() + ((delay || 1) * 1000), elapsedTime: duration });
  }

  function isPromiseLike(p) {
    return !!(p && p.then);
  }

  const fakeStyle = {
    color: 'blue'
  };

  let ss, triggerAnimationStartFrame;
  beforeEach(angular.mock.module(() => {
    return ($document, $sniffer, $$rAF, $animate) => {
      ss = createMockStyleSheet($document);

      $animate.enabled(true);
      triggerAnimationStartFrame = () => {
        $$rAF.flush();
      };
    };
  }));

  afterEach(() => {
    if (ss) {
      ss.destroy();
    }
  });

  it('should return false if neither transitions or keyframes are supported by the browser',
    angular.mock.inject(($animateCss, $sniffer, $rootElement, $document) => {

      let animator;
      const element = angular.element('<div></div>');
      $rootElement.append(element);
      angular.element($document[0].body).append($rootElement);

      $sniffer.transitions = $sniffer.animations = false;
      animator = $animateCss(element, {
        duration: 10,
        to: { 'background': 'red' }
      });
      expect(animator.$$willAnimate).toBeFalsy();
    }));

  describe('when active', () => {

    it('should not attempt an animation if animations are globally disabled',
      angular.mock.inject(($animateCss, $animate, $rootElement, $document) => {
        $animate.enabled(false);

        let animator;
        const element = angular.element('<div></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        animator = $animateCss(element, {
          duration: 10,
          to: { 'height': '100px' }
        });

        expect(animator.$$willAnimate).toBeFalsy();
      }));

    it('should silently quit the animation and not throw when an element has no parent during preparation',
      angular.mock.inject(($animateCss, $rootScope, $document, $rootElement) => {

        const element = angular.element('<div></div>');
        expect(() => {
          $animateCss(element, {
            duration: 1000,
            event: 'fake',
            to: fakeStyle
          }).start();
        }).not.toThrow();

        expect(element).not.toHaveClass('fake');
        triggerAnimationStartFrame();
        expect(element).not.toHaveClass('fake-active');
      }));

    it('should silently quit the animation and not throw when an element has no parent before starting',
      angular.mock.inject(($animateCss, $$rAF, $rootScope, $document, $rootElement) => {

        const element = angular.element('<div></div>');
        angular.element($document[0].body).append($rootElement);
        $rootElement.append(element);

        $animateCss(element, {
          duration: 1000,
          addClass: 'wait-for-it',
          to: fakeStyle
        }).start();

        element.remove();

        expect(() => {
          triggerAnimationStartFrame();
        }).not.toThrow();
      }));

    describe('rAF usage', () => {
      it('should buffer all requests into a single requestAnimationFrame call',
        angular.mock.inject(($animateCss, $$rAF, $rootScope, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          let count = 0;
          const runners = [];
          function makeRequest() {
            const element = angular.element('<div></div>');
            $rootElement.append(element);
            const runner = $animateCss(element, { duration: 5, to: fakeStyle }).start();
            runner.then(() => {
              count++;
            });
            runners.push(runner);
          }

          makeRequest();
          makeRequest();
          makeRequest();

          expect(count).toBe(0);

          triggerAnimationStartFrame();
          angular.forEach(runners, runner => {
            runner.end();
          });

          $rootScope.$digest();
          expect(count).toBe(3);
        }));

      it('should cancel previous requests to rAF to avoid premature flushing', () => {
        let count = 0;
        angular.mock.module($provide => {
          $provide.value('$$rAF', () => {
            return function cancellationFn() {
              count++;
            };
          });
        });
        angular.mock.inject(($animateCss, $$rAF, $document, $rootElement) => {
          angular.element($document[0].body).append($rootElement);

          function makeRequest() {
            const element = angular.element('<div></div>');
            $rootElement.append(element);
            $animateCss(element, { duration: 5, to: fakeStyle }).start();
          }

          makeRequest();
          makeRequest();
          makeRequest();
          expect(count).toBe(2);
        });
      });
    });

    describe('animator and runner', () => {
      const animationDuration = 5;
      let element, animator;
      beforeEach(angular.mock.inject(($animateCss, $rootElement, $document) => {
        element = angular.element('<div></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        animator = $animateCss(element, {
          event: 'enter',
          structural: true,
          duration: animationDuration,
          to: fakeStyle
        });
      }));

      it('should expose start and end functions for the animator object', angular.mock.inject(() => {
        expect(typeof animator.start).toBe('function');
        expect(typeof animator.end).toBe('function');
      }));

      it('should expose end, cancel, resume and pause methods on the runner object', angular.mock.inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();

        expect(typeof runner.end).toBe('function');
        expect(typeof runner.cancel).toBe('function');
        expect(typeof runner.resume).toBe('function');
        expect(typeof runner.pause).toBe('function');
      }));

      it('should start the animation', angular.mock.inject(() => {
        expect(element).not.toHaveClass('ng-enter-active');
        animator.start();
        triggerAnimationStartFrame();

        expect(element).toHaveClass('ng-enter-active');
      }));

      it('should end the animation when called from the animator object', angular.mock.inject(() => {
        animator.start();
        triggerAnimationStartFrame();

        animator.end();
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should end the animation when called from the runner object', angular.mock.inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();
        runner.end();
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should permanently close the animation if closed before the next rAF runs', angular.mock.inject(() => {
        const runner = animator.start();
        runner.end();

        triggerAnimationStartFrame();
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should return a runner object at the start of the animation that contains a `then` method',
        angular.mock.inject($rootScope => {

          const runner = animator.start();
          triggerAnimationStartFrame();

          expect(isPromiseLike(runner)).toBeTruthy();

          let resolved;
          runner.then(() => {
            resolved = true;
          });

          runner.end();
          $rootScope.$digest();
          expect(resolved).toBeTruthy();
        }));

      it('should cancel the animation and reject', angular.mock.inject($rootScope => {
        let rejected;
        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.then(angular.noop, () => {
          rejected = true;
        });

        runner.cancel();
        $rootScope.$digest();
        expect(rejected).toBeTruthy();
      }));

      it('should pause the transition, have no effect, but not end it', angular.mock.inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.pause();

        browserTrigger(element, 'transitionend',
          { timeStamp: Date.now(), elapsedTime: 5 });

        expect(element).toHaveClass('ng-enter-active');
      }));

    });

    describe('CSS', () => {

      describe('staggering', () => {

        it('should not apply a stagger if the transition delay value is inherited from a earlier CSS class',
          angular.mock.inject(($animateCss, $document, $rootElement) => {

            angular.element($document[0].body).append($rootElement);

            ss.addPossiblyPrefixedRule('.transition-animation', 'transition:2s 5s linear all;');

            for (let i = 0; i < 5; i++) {
              const element = angular.element('<div class="transition-animation"></div>');
              $rootElement.append(element);

              $animateCss(element, { event: 'enter', structural: true }).start();
              triggerAnimationStartFrame();


              expect(element).toHaveClass('ng-enter-active');
            }
          }));


        it('should ignore animation staggers if only transition animations were detected',
          angular.mock.inject(($animateCss, $document, $rootElement) => {

            angular.element($document[0].body).append($rootElement);

            ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'animation-delay:0.2s');
            ss.addPossiblyPrefixedRule('.transition-animation', 'transition:2s 5s linear all;');

            for (let i = 0; i < 5; i++) {
              const element = angular.element('<div class="transition-animation"></div>');
              $rootElement.append(element);

              $animateCss(element, { event: 'enter', structural: true }).start();
              triggerAnimationStartFrame();


              expect(element).toHaveClass('ng-enter-active');
            }
          }));

        it('should ignore transition staggers if only keyframe animations were detected',
          angular.mock.inject(($animateCss, $document, $rootElement) => {

            angular.element($document[0].body).append($rootElement);

            ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:0.2s');
            ss.addPossiblyPrefixedRule('.transition-animation', 'animation: 2s 5s my_animation;');

            for (let i = 0; i < 5; i++) {
              const elm = angular.element('<div class="transition-animation"></div>');
              $rootElement.append(elm);

              const animator = $animateCss(elm, { event: 'enter', structural: true }).start();
              triggerAnimationStartFrame();


              expect(elm).toHaveClass('ng-enter-active');
            }
          }));

        it('should apply the closing timeout ontop of the stagger timeout',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout, $browser) => {
            angular.element($document[0].body).append($rootElement);

            ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:1s;');
            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

            let elm;
            let i;
            const elms = [];
            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              elms.push(elm);
              $rootElement.append(elm);

              $animateCss(elm, { event: 'enter', structural: true }).start();
              triggerAnimationStartFrame();
            }

            for (i = 1; i < 2; i++) {
              elm = elms[i];
              expect(elm).toHaveClass('ng-enter');
              $timeout.flush(1000);
              $timeout.flush(15000);
              expect(elm).not.toHaveClass('ng-enter');
            }
          }));

        it('should apply the closing timeout ontop of the stagger timeout with an added delay',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout, $browser) => {
            angular.element($document[0].body).append($rootElement);

            ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:1s;');
            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all; transition-delay:50s;');

            let elm;
            let i;
            const elms = [];
            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              elms.push(elm);
              $rootElement.append(elm);

              $animateCss(elm, { event: 'enter', structural: true }).start();
              triggerAnimationStartFrame();
            }

            for (i = 1; i < 2; i++) {
              elm = elms[i];
              expect(elm).toHaveClass('ng-enter');
              $timeout.flush(1000);
              $timeout.flush(65000);
              expect(elm).not.toHaveClass('ng-enter');
            }
          }));

      });

      describe('closing timeout', () => {
        it('should close off the animation after 150% of the animation time has passed',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout) => {

            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            const animator = $animateCss(element, { event: 'enter', structural: true });
            animator.start();
            triggerAnimationStartFrame();


            expect(element).toHaveClass('ng-enter');
            expect(element).toHaveClass('ng-enter-active');

            $timeout.flush(15000);

            expect(element).not.toHaveClass('ng-enter');
            expect(element).not.toHaveClass('ng-enter-active');
          }));

        it('should close off the animation after 150% of the animation time has passed and consider the detected delay value',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout) => {

            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all; transition-delay:30s;');

            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            const animator = $animateCss(element, { event: 'enter', structural: true });
            animator.start();
            triggerAnimationStartFrame();


            expect(element).toHaveClass('ng-enter');
            expect(element).toHaveClass('ng-enter-active');

            $timeout.flush(45000);

            expect(element).not.toHaveClass('ng-enter');
            expect(element).not.toHaveClass('ng-enter-active');
          }));

        it('should still resolve the animation once expired',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout, $animate, $rootScope) => {

            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            const animator = $animateCss(element, { event: 'enter', structural: true });

            let failed, passed;
            animator.start().then(() => {
              passed = true;
            }, () => {
              failed = true;
            });

            triggerAnimationStartFrame();
            $timeout.flush(15000);
            $animate.flush();
            $rootScope.$digest();
            expect(passed).toBe(true);
          }));

        it('should close all stacked animations after the last timeout runs on the same element',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout, $animate) => {

            let now = 0;
            jest.spyOn(Date, 'now').mockImplementation(() => {
              return now;
            });

            const cancelSpy = jest.spyOn($timeout, 'cancel');
            const doneSpy = jest.fn();

            ss.addPossiblyPrefixedRule('.elm', 'transition:1s linear all;');
            ss.addRule('.elm.red', 'background:red;');
            ss.addPossiblyPrefixedRule('.elm.blue', 'transition:2s linear all; background:blue;');
            ss.addRule('.elm.green', 'background:green;');

            const element = angular.element('<div class="elm"></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            // timeout will be at 1500s
            animate(element, 'red', doneSpy);
            expect(doneSpy).not.toHaveBeenCalled();

            fastForwardClock(500); //1000s left to go

            // timeout will not be at 500 + 3000s = 3500s
            animate(element, 'blue', doneSpy);
            expect(doneSpy).not.toHaveBeenCalled();
            expect(cancelSpy).toHaveBeenCalled();

            cancelSpy.mockClear();

            // timeout will not be set again since the former animation is longer
            animate(element, 'green', doneSpy);
            expect(doneSpy).not.toHaveBeenCalled();
            expect(cancelSpy).not.toHaveBeenCalled();

            // this will close the animations fully
            fastForwardClock(3500);
            $animate.flush();

            expect(doneSpy).toHaveBeenCalled();
            expect(doneSpy).toHaveBeenCalledTimes(3);

            function fastForwardClock(time) {
              now += time;
              $timeout.flush(time);
            }

            function animate(element, klass, onDone) {
              const animator = $animateCss(element, { addClass: klass }).start();
              animator.done(onDone);
              triggerAnimationStartFrame();
              return animator;
            }
          }));

        it('should not throw an error any pending timeout requests resolve after the element has already been removed',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout, $animate) => {

            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            ss.addPossiblyPrefixedRule('.red', 'transition:1s linear all;');

            $animateCss(element, { addClass: 'red' }).start();
            triggerAnimationStartFrame();
            element.remove();

            expect(() => {
              $timeout.flush();
            }).not.toThrow();
          }));


        it('should cancel the timeout when the animation is ended normally',
          angular.mock.inject(($animateCss, $document, $rootElement, $timeout) => {

            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            const animator = $animateCss(element, { event: 'enter', structural: true });
            animator.start();
            triggerAnimationStartFrame();

            expect(element).toHaveClass('ng-enter');
            expect(element).toHaveClass('ng-enter-active');

            animator.end();

            expect(element.data(ngInternals.ANIMATE_TIMER_KEY)).toBeUndefined();
            $timeout.verifyNoPendingTasks();
          }));

      });

      describe('getComputedStyle', () => {
        let count;
        const acceptableTimingsData = {
          transitionDuration: '10s'
        };

        beforeEach(angular.mock.module($provide => {
          count = {};
          $provide.value('$window', angular.extend({}, window, {
            document: angular.element(window.document),
            getComputedStyle: function (node) {
              const key = node.className.indexOf('stagger') >= 0
                ? 'stagger' : 'normal';
              count[key] = count[key] || 0;
              count[key]++;
              return acceptableTimingsData;
            }
          }));

          return ($document, $rootElement) => {
            angular.element($document[0].body).append($rootElement);
          };
        }));

        it('should cache frequent calls to getComputedStyle before the next animation frame kicks in',
          angular.mock.inject(($animateCss, $document, $rootElement) => {

            let i, elm, animator;
            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              $rootElement.append(elm);
              animator = $animateCss(elm, { event: 'enter', structural: true });
              const runner = animator.start();
            }

            expect(count.normal).toBe(1);

            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              $rootElement.append(elm);
              animator = $animateCss(elm, { event: 'enter', structural: true });
              animator.start();
            }

            expect(count.normal).toBe(1);
            triggerAnimationStartFrame();

            expect(count.normal).toBe(2);

            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              $rootElement.append(elm);
              animator = $animateCss(elm, { event: 'enter', structural: true });
              animator.start();
            }

            expect(count.normal).toBe(3);
          }));

        it('should cache frequent calls to getComputedStyle for stagger animations before the next animation frame kicks in',
          angular.mock.inject(($animateCss, $document, $rootElement, $$rAF) => {

            const element = angular.element('<div></div>');
            $rootElement.append(element);
            let animator = $animateCss(element, { event: 'enter', structural: true });
            animator.start();
            triggerAnimationStartFrame();

            expect(count.stagger).toBeUndefined();

            let i, elm;
            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              $rootElement.append(elm);
              animator = $animateCss(elm, { event: 'enter', structural: true });
              animator.start();
            }

            expect(count.stagger).toBe(1);

            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              $rootElement.append(elm);
              animator = $animateCss(elm, { event: 'enter', structural: true });
              animator.start();
            }

            expect(count.stagger).toBe(1);
            $$rAF.flush();

            for (i = 0; i < 5; i++) {
              elm = angular.element('<div></div>');
              $rootElement.append(elm);
              animator = $animateCss(elm, { event: 'enter', structural: true });
              animator.start();
            }

            triggerAnimationStartFrame();
            expect(count.stagger).toBe(2);
          }));
      });

      describe('transitionend/animationend event listeners', () => {
        let element, elementOnSpy, elementOffSpy, progress;

        function setStyles(event) {
          switch (event) {
            case ngInternals.TRANSITIONEND_EVENT:
              ss.addPossiblyPrefixedRule('.ng-enter', 'transition: 10s linear all;');
              progress = transitionProgress;
              break;
            case ngInternals.ANIMATIONEND_EVENT:
              ss.addPossiblyPrefixedRule('.ng-enter', 'animation: animation 10s;');
              progress = keyframeProgress;
              break;
          }
        }

      });
    });

    it('should apply a custom temporary class when a non-structural animation is used',
      angular.mock.inject(($animateCss, $rootElement, $document) => {

        const element = angular.element('<div></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $animateCss(element, {
          event: 'super',
          duration: 1000,
          to: fakeStyle
        }).start();
        expect(element).toHaveClass('super');

        triggerAnimationStartFrame();
        expect(element).toHaveClass('super-active');
      }));

    describe('structural animations', () => {
      they('should decorate the element with the ng-$prop CSS class',
        ['enter', 'leave', 'move'], event => {
          angular.mock.inject(($animateCss, $rootElement, $document) => {
            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            $animateCss(element, {
              event: event,
              structural: true,
              duration: 1000,
              to: fakeStyle
            });
            expect(element).toHaveClass('ng-' + event);
          });
        });

      they('should decorate the element with the ng-$prop-active CSS class',
        ['enter', 'leave', 'move'], event => {
          angular.mock.inject(($animateCss, $rootElement, $document) => {
            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            const animator = $animateCss(element, {
              event: event,
              structural: true,
              duration: 1000,
              to: fakeStyle
            });

            animator.start();
            triggerAnimationStartFrame();

            expect(element).toHaveClass('ng-' + event + '-active');
          });
        });


      they('should allow additional CSS classes to be added and removed alongside the $prop animation',
        ['enter', 'leave', 'move'], event => {
          angular.mock.inject(($animateCss, $rootElement) => {
            const element = angular.element('<div class="green"></div>');
            $rootElement.append(element);
            const animator = $animateCss(element, {
              event: event,
              structural: true,
              duration: 1,
              to: fakeStyle,
              addClass: 'red',
              removeClass: 'green'
            });

            animator.start();
            triggerAnimationStartFrame();

            expect(element).toHaveClass('ng-' + event);
            expect(element).toHaveClass('ng-' + event + '-active');

            expect(element).toHaveClass('red');
            expect(element).toHaveClass('red-add');
            expect(element).toHaveClass('red-add-active');

            expect(element).not.toHaveClass('green');
            expect(element).toHaveClass('green-remove');
            expect(element).toHaveClass('green-remove-active');
          });
        });

    });

    describe('class-based animations', () => {
      they('should decorate the element with the class-$prop CSS class',
        ['add', 'remove'], event => {
          angular.mock.inject(($animateCss, $rootElement) => {
            const element = angular.element('<div></div>');
            $rootElement.append(element);

            const options = {};
            options[event + 'Class'] = 'class';
            options.duration = 1000;
            options.to = fakeStyle;
            $animateCss(element, options);
            expect(element).toHaveClass('class-' + event);
          });
        });

      they('should decorate the element with the class-$prop-active CSS class',
        ['add', 'remove'], event => {
          angular.mock.inject(($animateCss, $rootElement) => {
            const element = angular.element('<div></div>');
            $rootElement.append(element);

            const options = {};
            options[event + 'Class'] = 'class';
            options.duration = 1000;
            options.to = fakeStyle;
            const animator = $animateCss(element, options);
            animator.start();
            triggerAnimationStartFrame();


            expect(element).toHaveClass('class-' + event + '-active');
          });
        });

      they('should remove the class-$prop-add and class-$prop-active CSS classes from the element once the animation is done',
        ['enter', 'leave', 'move'], event => {
          angular.mock.inject(($animateCss, $rootElement, $document) => {
            const element = angular.element('<div></div>');
            $rootElement.append(element);
            angular.element($document[0].body).append($rootElement);

            const options = {};
            options.event = event;
            options.duration = 10;
            options.to = fakeStyle;

            const animator = $animateCss(element, options);
            animator.start();
            triggerAnimationStartFrame();


            browserTrigger(element, 'transitionend',
              { timeStamp: Date.now() + 1000, elapsedTime: 10 });

            expect(element).not.toHaveClass('ng-' + event);
            expect(element).not.toHaveClass('ng-' + event + '-active');
          });
        });

    });

    describe('options', () => {
      let element;
      beforeEach(angular.mock.module(() => {
        return ($rootElement, $document) => {
          angular.element($document[0].body).append($rootElement);

          element = angular.element('<div></div>');
          $rootElement.append(element);
        };
      }));

      it('should not alter the provided options input in any way throughout the animation', angular.mock.inject($animateCss => {
        const initialOptions = {
          from: { height: '50px' },
          to: { width: '50px' },
          addClass: 'one',
          removeClass: 'two',
          duration: 10,
          delay: 10,
          structural: true,
          keyframeStyle: '1s rotate',
          transitionStyle: '1s linear',
          stagger: 0.5,
          staggerIndex: 3
        };

        const copiedOptions = angular.copy(initialOptions);
        expect(copiedOptions).toEqual(initialOptions);

        const animator = $animateCss(element, copiedOptions);
        expect(copiedOptions).toEqual(initialOptions);

        const runner = animator.start();
        expect(copiedOptions).toEqual(initialOptions);

        triggerAnimationStartFrame();
        expect(copiedOptions).toEqual(initialOptions);

        runner.end();
        expect(copiedOptions).toEqual(initialOptions);
      }));

      it('should not create a copy of the provided options if they have already been prepared earlier',
        angular.mock.inject(($animate, $animateCss) => {

          const options = {
            from: { height: '50px' },
            to: { width: '50px' },
            addClass: 'one',
            removeClass: 'two'
          };

          options.$$prepared = true;
          const runner = $animateCss(element, options).start();
          runner.end();

          $animate.flush();

          expect(options.addClass).toBeFalsy();
          expect(options.removeClass).toBeFalsy();
          expect(options.to).toBeFalsy();
          expect(options.from).toBeFalsy();
        }));

      describe('[$$skipPreparationClasses]', () => {
        it('should not apply and remove the preparation classes to the element when true',
          angular.mock.inject($animateCss => {

            const options = {
              duration: 3000,
              to: fakeStyle,
              event: 'event',
              structural: true,
              addClass: 'klass',
              $$skipPreparationClasses: true
            };

            const animator = $animateCss(element, options);

            expect(element).not.toHaveClass('klass-add');
            expect(element).not.toHaveClass('ng-event');

            const runner = animator.start();
            triggerAnimationStartFrame();

            expect(element).not.toHaveClass('klass-add');
            expect(element).not.toHaveClass('ng-event');

            expect(element).toHaveClass('klass-add-active');
            expect(element).toHaveClass('ng-event-active');

            element.addClass('klass-add ng-event');

            runner.end();

            expect(element).toHaveClass('klass-add');
            expect(element).toHaveClass('ng-event');

            expect(element).not.toHaveClass('klass-add-active');
            expect(element).not.toHaveClass('ng-event-active');
          }));
      });

      describe('[duration]', () => {
        it('should be applied for a transition directly', angular.mock.inject(($animateCss, $rootElement) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {
            duration: 3000,
            to: fakeStyle,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(style).toContain('3000s');
          expect(style).toContain('linear');
        }));


        it('should not prepare the animation at all if a duration of zero is provided',
          angular.mock.inject(($animateCss, $rootElement) => {

            ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;');

            const options = {
              duration: 0,
              event: 'enter',
              structural: true
            };

            const animator = $animateCss(element, options);

            expect(animator.$$willAnimate).toBeFalsy();
          }));

      });

      describe('[from] and [to]', () => {
        it('should apply from styles to an element during the preparation phase',
          angular.mock.inject(($animateCss, $rootElement) => {

            const options = {
              duration: 2.5,
              event: 'enter',
              structural: true,
              from: { width: '50px' },
              to: { width: '100px' }
            };

            const animator = $animateCss(element, options);
            expect(element.attr('style')).toMatch(/width:\s*50px/);
          }));

        it('should apply to styles to an element during the animation phase',
          angular.mock.inject(($animateCss, $rootElement) => {

            const options = {
              duration: 2.5,
              event: 'enter',
              structural: true,
              from: { width: '15px' },
              to: { width: '25px' }
            };

            const animator = $animateCss(element, options);
            const runner = animator.start();
            triggerAnimationStartFrame();
            runner.end();

            expect(element.css('width')).toBe('25px');
          }));

        it('should always apply the from styles before the start function is called even if no transition is detected when started',
          angular.mock.inject(($animateCss, $rootElement) => {

            ss.addPossiblyPrefixedRule('.my-class', 'transition: 0s linear color');

            const options = {
              addClass: 'my-class',
              from: { height: '26px' },
              to: { height: '500px' }
            };

            const animator = $animateCss(element, options);
            expect(element.css('height')).toBe('26px');

            animator.start();
            triggerAnimationStartFrame();

            expect(element.css('height')).toBe('500px');
          }));

        it('should retain existing styles when an inline styled animation completes',
          angular.mock.inject(($animateCss, $rootElement) => {

            const options = {
              event: 'enter',
              structural: true,
              duration: 2.5
            };

            element.css('font-size', '20px');
            element.css('opacity', '0.5');

            const animator = $animateCss(element, options);
            animator.start();
            triggerAnimationStartFrame();

            let style = element.attr('style');
            expect(style).toContain('transition');
            animator.end();

            style = element.attr('style');
            expect(element.attr('style')).not.toContain('transition');
            expect(element.css('opacity')).toEqual('0.5');
          }));

        it('should not apply an inline transition if only [from] styles and a duration are provided',
          angular.mock.inject(($animateCss, $rootElement) => {

            const options = {
              duration: 3,
              from: { background: 'blue' }
            };

            const animator = $animateCss(element, options);
            expect(animator.$$willAnimate).toBeFalsy();
          }));

        it('should apply a transition if [from] styles are provided with a class that is added',
          angular.mock.inject(($animateCss, $rootElement) => {

            const options = {
              addClass: 'superb',
              from: { background: 'blue' }
            };

            const animator = $animateCss(element, options);
            expect(angular.isFunction(animator.start)).toBe(true);
          }));

        it('should apply an inline transition if only [from] styles, but classes are added or removed and a duration is provided',
          angular.mock.inject(($animateCss, $rootElement) => {

            const options = {
              duration: 3,
              addClass: 'sugar',
              from: { background: 'yellow' }
            };

            const animator = $animateCss(element, options);
            expect(animator.$$willAnimate).toBeTruthy();
          }));

        it('should not apply an inline transition if no styles are provided',
          angular.mock.inject(($animateCss, $rootElement) => {

            const emptyObject = {};
            const options = {
              duration: 3,
              to: emptyObject,
              from: emptyObject
            };

            const animator = $animateCss(element, options);
            expect(animator.$$willAnimate).toBeFalsy();
          }));

      });


      describe('SVG', () => {

        it('should properly remove classes from SVG elements', angular.mock.inject($animateCss => {
          const element = angular.element('<svg width="500" height="500">' +
            '<rect class="class-of-doom"></rect>' +
            '</svg>');
          const child = element.find('rect');

          const animator = $animateCss(child, {
            removeClass: 'class-of-doom',
            duration: 0
          });
          animator.start();

          const className = child[0].getAttribute('class');
          expect(className).toBe('');
        }));
      });
    });
  });
});
