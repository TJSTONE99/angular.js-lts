'use strict';

describe('$interval', () => {
  /* global ngInternals.$IntervalProvider: false */

  beforeEach(angular.mock.module($provide => {
    const repeatFns = [];
    let nextRepeatId = 0;
    let now = 0;
    let $window;

    $window = {
      setInterval: function (fn, delay, count) {
        repeatFns.push({
          nextTime: (now + delay),
          delay: delay,
          fn: fn,
          id: nextRepeatId
        });
        repeatFns.sort((a, b) => { return a.nextTime - b.nextTime; });

        return nextRepeatId++;
      },

      clearInterval: function (id) {
        let fnIndex;

        angular.forEach(repeatFns, (fn, index) => {
          if (fn.id === id) fnIndex = index;
        });

        if (angular.isDefined(fnIndex)) {
          repeatFns.splice(fnIndex, 1);
          return true;
        }

        return false;
      },

      flush: function (millis) {
        now += millis;
        while (repeatFns.length && repeatFns[0].nextTime <= now) {
          const task = repeatFns[0];
          task.fn();
          task.nextTime += task.delay;
          repeatFns.sort((a, b) => { return a.nextTime - b.nextTime; });
        }
        return millis;
      }
    };

    $provide.provider('$interval', ngInternals.$IntervalProvider);
    $provide.value('$window', $window);
  }));

  it('should run tasks repeatedly', angular.mock.inject(($interval, $window) => {
    let counter = 0;
    $interval(() => { counter++; }, 1000);

    expect(counter).toBe(0);

    $window.flush(1000);
    expect(counter).toBe(1);

    $window.flush(1000);

    expect(counter).toBe(2);
  }));

  it('should call $apply after each task is executed',
    angular.mock.inject(($interval, $rootScope, $window) => {
      const applySpy = jest.spyOn($rootScope, '$apply');

      $interval(angular.noop, 1000);
      expect(applySpy).not.toHaveBeenCalled();

      $window.flush(1000);
      expect(applySpy).toHaveBeenCalledTimes(1);

      applySpy.mockClear();

      $interval(angular.noop, 1000);
      $interval(angular.noop, 1000);
      $window.flush(1000);
      expect(applySpy).toHaveBeenCalledTimes(3);
    }));


  it('should NOT call $apply if invokeApply is set to false',
    angular.mock.inject(($interval, $rootScope, $window) => {
      const applySpy = jest.spyOn($rootScope, '$apply');

      $interval(angular.noop, 1000, 0, false);
      expect(applySpy).not.toHaveBeenCalled();

      $window.flush(2000);
      expect(applySpy).not.toHaveBeenCalled();
    }));


  it('should NOT call $evalAsync or $digest if invokeApply is set to false',
    angular.mock.inject(($interval, $rootScope, $window, $timeout) => {
      const evalAsyncSpy = jest.spyOn($rootScope, '$evalAsync');
      const digestSpy = jest.spyOn($rootScope, '$digest');
      const notifySpy = jest.fn();

      $interval(notifySpy, 1000, 1, false);

      $window.flush(2000);
      $timeout.flush(); // flush $browser.defer() timeout

      expect(notifySpy).toHaveBeenCalledTimes(1);
      expect(evalAsyncSpy).not.toHaveBeenCalled();
      expect(digestSpy).not.toHaveBeenCalled();
    }));


  it('should not depend on `notify` to trigger the callback call', () => {
    angular.mock.module($provide => {
      $provide.decorator('$q', $delegate => {
        function replacement() { }
        replacement.defer = () => {
          const result = $delegate.defer();
          result.notify = angular.noop;
          return result;
        };
        return replacement;
      });
    });

    angular.mock.inject(($interval, $window) => {
      let counter = 0;
      $interval(() => { counter++; }, 1000);

      expect(counter).toBe(0);

      $window.flush(1000);
      expect(counter).toBe(1);

      $window.flush(1000);

      expect(counter).toBe(2);
    });
  });


  it('should allow you to specify the delay time', angular.mock.inject(($interval, $window) => {
    let counter = 0;
    $interval(() => { counter++; }, 123);

    expect(counter).toBe(0);

    $window.flush(122);
    expect(counter).toBe(0);

    $window.flush(1);
    expect(counter).toBe(1);
  }));


  it('should allow you to specify a number of iterations', angular.mock.inject(($interval, $window) => {
    let counter = 0;
    $interval(() => { counter++; }, 1000, 2);

    $window.flush(1000);
    expect(counter).toBe(1);
    $window.flush(1000);
    expect(counter).toBe(2);
    $window.flush(1000);
    expect(counter).toBe(2);
  }));


  it('should allow you to specify a number of arguments', angular.mock.inject(($interval, $window) => {
    const task1 = jest.fn(), task2 = jest.fn(), task3 = jest.fn();
    $interval(task1, 1000, 2, true, 'Task1');
    $interval(task2, 1000, 2, true, 'Task2');
    $interval(task3, 1000, 2, true, 'I', 'am', 'a', 'Task3', 'spy');

    $window.flush(1000);
    expect(task1).toHaveBeenCalledWith('Task1');
    expect(task2).toHaveBeenCalledWith('Task2');
    expect(task3).toHaveBeenCalledWith('I', 'am', 'a', 'Task3', 'spy');

    task1.mockClear();
    task2.mockClear();
    task3.mockClear();

    $window.flush(1000);
    expect(task1).toHaveBeenCalledWith('Task1');
    expect(task2).toHaveBeenCalledWith('Task2');
    expect(task3).toHaveBeenCalledWith('I', 'am', 'a', 'Task3', 'spy');

  }));


  it('should return a promise which will be updated with the count on each iteration',
    angular.mock.inject(($interval, $window) => {
      const log = [], promise = $interval(() => { log.push('tick'); }, 1000);

      promise.then(value => { log.push('promise success: ' + value); },
        err => { log.push('promise error: ' + err); },
        note => { log.push('promise update: ' + note); });
      expect(log).toEqual([]);

      $window.flush(1000);
      expect(log).toEqual(['tick', 'promise update: 0']);

      $window.flush(1000);
      expect(log).toEqual(['tick', 'promise update: 0', 'tick', 'promise update: 1']);
    }));


  it('should return a promise which will be resolved after the specified number of iterations',
    angular.mock.inject(($interval, $window) => {
      const log = [], promise = $interval(() => { log.push('tick'); }, 1000, 2);

      promise.then(value => { log.push('promise success: ' + value); },
        err => { log.push('promise error: ' + err); },
        note => { log.push('promise update: ' + note); });
      expect(log).toEqual([]);

      $window.flush(1000);
      expect(log).toEqual(['tick', 'promise update: 0']);
      $window.flush(1000);

      expect(log).toEqual([
        'tick', 'promise update: 0', 'tick', 'promise update: 1', 'promise success: 2'
      ]);

    }));


  describe('exception handling', () => {
    beforeEach(angular.mock.module($exceptionHandlerProvider => {
      $exceptionHandlerProvider.mode('log');
    }));


    it('should delegate exception to the $exceptionHandler service', angular.mock.inject(
      ($interval, $exceptionHandler, $window) => {
        $interval(() => { throw 'Test Error'; }, 1000);
        expect($exceptionHandler.errors).toEqual([]);

        $window.flush(1000);
        expect($exceptionHandler.errors).toEqual(['Test Error']);

        $window.flush(1000);
        expect($exceptionHandler.errors).toEqual(['Test Error', 'Test Error']);
      }));


    it('should call $apply even if an exception is thrown in callback', angular.mock.inject(
      ($interval, $rootScope, $window) => {
        const applySpy = jest.spyOn($rootScope, '$apply');

        $interval(() => { throw 'Test Error'; }, 1000);
        expect(applySpy).not.toHaveBeenCalled();

        $window.flush(1000);
        expect(applySpy).toHaveBeenCalled();
      }));


    it('should still update the interval promise when an exception is thrown',
      angular.mock.inject(($interval, $window) => {
        const log = [], promise = $interval(() => { throw 'Some Error'; }, 1000);

        promise.then(value => { log.push('promise success: ' + value); },
          err => { log.push('promise error: ' + err); },
          note => { log.push('promise update: ' + note); });
        $window.flush(1000);

        expect(log).toEqual(['promise update: 0']);
      }));
  });


  describe('cancel', () => {
    it('should cancel tasks', angular.mock.inject(($interval, $window) => {
      const task1 = jest.fn();
      const task2 = jest.fn();
      const task3 = jest.fn();
      let promise1;
      let promise3;

      promise1 = $interval(task1, 200);
      $interval(task2, 1000);
      promise3 = $interval(task3, 333);

      $interval.cancel(promise3);
      $interval.cancel(promise1);
      $window.flush(1000);

      expect(task1).not.toHaveBeenCalled();
      expect(task2).toHaveBeenCalledTimes(1);
      expect(task3).not.toHaveBeenCalled();
    }));


    it('should cancel the promise', angular.mock.inject(($interval, $rootScope, $window) => {
      const promise = $interval(angular.noop, 1000), log = [];
      promise.then(value => { log.push('promise success: ' + value); },
        err => { log.push('promise error: ' + err); },
        note => { log.push('promise update: ' + note); });
      expect(log).toEqual([]);

      $window.flush(1000);
      $interval.cancel(promise);
      $window.flush(1000);
      $rootScope.$apply(); // For resolving the promise -
      // necessary since q uses $rootScope.evalAsync.

      expect(log).toEqual(['promise update: 0', 'promise error: canceled']);
    }));


    it('should return true if a task was successfully canceled',
      angular.mock.inject(($interval, $window) => {
        const task1 = jest.fn();
        const task2 = jest.fn();
        let promise1;
        let promise2;

        promise1 = $interval(task1, 1000, 1);
        $window.flush(1000);
        promise2 = $interval(task2, 1000, 1);

        expect($interval.cancel(promise1)).toBe(false);
        expect($interval.cancel(promise2)).toBe(true);
      }));


    it('should not throw an error when given an undefined promise', angular.mock.inject($interval => {
      expect($interval.cancel()).toBe(false);
    }));


    it('should throw an error when given a non-$interval promise', angular.mock.inject($interval => {
      const promise = $interval(angular.noop).then(angular.noop);
      expect(() => { $interval.cancel(promise); }).toThrowMinErr('$interval', 'badprom');
    }));


    it('should not trigger digest when cancelled', angular.mock.inject(($interval, $rootScope, $browser) => {
      const watchSpy = jest.fn();
      $rootScope.$watch(watchSpy);

      const t = $interval();
      $interval.cancel(t);
      expect(() => { $browser.defer.flush(); }).toThrowError('No deferred tasks to be flushed');
      expect(watchSpy).not.toHaveBeenCalled();
    }));
  });

  describe('$window delegation', () => {
    it('should use $window.setInterval instead of the global function', angular.mock.inject(($interval, $window) => {
      const setIntervalSpy = jest.spyOn($window, 'setInterval');

      $interval(angular.noop, 1000);
      expect(setIntervalSpy).toHaveBeenCalled();
    }));

    it('should use $window.clearInterval instead of the global function', angular.mock.inject(($interval, $window) => {
      const clearIntervalSpy = jest.spyOn($window, 'clearInterval');

      $interval(angular.noop, 1000, 1);
      $window.flush(1000);
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockClear();
      $interval.cancel($interval(angular.noop, 1000));
      expect(clearIntervalSpy).toHaveBeenCalled();
    }));
  });
});
