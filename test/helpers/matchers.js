'use strict';

beforeEach(() => {
  const cssMatcher = (presentClasses, absentClasses) => (actual) => {
    const element = angular.element(actual);

    let present = true;
    let absent = false;

    angular.forEach(presentClasses.split(' '), (className) => {
      present = present && element.hasClass(className);
    });

    angular.forEach(absentClasses.split(' '), (className) => {
      absent = absent || element.hasClass(className);
    });

    const className = element[0].className;
    const passed = present && !absent;

    if (passed) {
      return {
        message: () => `Expected element not to have ${presentClasses}, but had ${className}`,
        pass: passed,
      };
    }

    return {
      message: absentClasses
        ? () => `Expected element to have ${presentClasses} and not ${absentClasses}, but had ${className}`
        : () => `Expected element to have ${presentClasses}, but had ${className}`,
      pass: passed,
    };
  };

  const DOMTester = (a, b) => {
    if (a && b && a.nodeType > 0 && b.nodeType > 0) return a === b;
    return undefined;
  };

  const isNgElementHidden = (element) => {
    // we need to check element.getAttribute for SVG nodes
    let hidden = true;
    angular.forEach(angular.element(element), (el) => {
      const klass = el.getAttribute ? (el.getAttribute('class') || '') : '';
      if (` ${klass} `.indexOf(' ng-hide ') === -1) hidden = false;
    });
    return hidden;
  };

  const escapeRegexp = (str) =>
    // This function escapes all special regex characters.
    // We use it to create matching regex from arbitrary strings.
    // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

  class MinErrMatcher {
    constructor(namespace, code, content, wording) {
      this.namespace = namespace;
      this.code = code;
      this.wording = wording;

      this.codeRegex = new RegExp(`^${escapeRegexp(`[${namespace}:${code}]`)}`);

      this.contentRegex =
        angular.isUndefined(content) || content instanceof RegExp
          ? content
          : new RegExp(escapeRegexp(content));
    }

    test = (exception) => {
      const exceptionMessage = (exception && exception.message) || exception || '';

      const codeMatches = this.codeRegex.test(exceptionMessage);
      const contentMatches =
        angular.isUndefined(this.contentRegex) || this.contentRegex.test(exceptionMessage);

      const passed = codeMatches && contentMatches;
      const isNot = passed;

      const message = () =>
        `Expected ${this.wording.inputType}${isNot ? ' not' : ''} to ${this.wording.expectedAction} ` +
        `${this.namespace}MinErr('${this.code}')` +
        (this.contentRegex ? ` matching ${this.contentRegex.toString()}` : '') +
        (!exception ? '.' : `, but it ${this.wording.actualAction}: ${exceptionMessage}`);

      return { message, pass: passed };
    };
  }

  const hasClass = (element, selector) => {
    if (!element.getAttribute) return false;
    return (
      ` ${(element.getAttribute('class') || '')} `
        .replace(/[\n\t]/g, ' ')
        .indexOf(` ${selector} `) > -1
    );
  };

  expect.extend({
    toBeEmpty: cssMatcher('ng-empty', 'ng-not-empty'),
    toBeNotEmpty: cssMatcher('ng-not-empty', 'ng-empty'),
    toBeInvalid: cssMatcher('ng-invalid', 'ng-valid'),
    toBeValid: cssMatcher('ng-valid', 'ng-invalid'),
    toBeDirty: cssMatcher('ng-dirty', 'ng-pristine'),
    toBePristine: cssMatcher('ng-pristine', 'ng-dirty'),
    toBeUntouched: cssMatcher('ng-untouched', 'ng-touched'),
    toBeTouched: cssMatcher('ng-touched', 'ng-untouched'),

    toBeAPromise(actual) {
      const passed =
        actual &&
        typeof actual.then === 'function' &&
        typeof actual.catch === 'function' &&
        typeof actual.finally === 'function';

      return {
        message: passed
          ? () => 'Expected object not to be a promise'
          : () => 'Expected object to be a promise',
        pass: passed,
      };
    },

    toBeShown(actual) {
      const passed = !isNgElementHidden(actual);
      return {
        message: passed
          ? () => 'Expected element to have the ng-hide class'
          : () => 'Expected element not to have the ng-hide class',
        pass: passed,
      };
    },

    toBeHidden(actual) {
      const passed = isNgElementHidden(actual);
      return {
        message: passed
          ? () => 'Expected element not to have the ng-hide class'
          : () => 'Expected element to have the ng-hide class',
        pass: passed,
      };
    },

    toEqual(actual, expected) {
      let normalizedActual = actual;
      if (normalizedActual && normalizedActual.$$log) {
        normalizedActual =
          typeof expected === 'string' ? normalizedActual.toString() : normalizedActual.toArray();
      }

      const passed = this.equals(normalizedActual, expected, [DOMTester]);

      return {
        message: passed
          ? () =>
            `Expected ${this.utils.stringify(normalizedActual)} not to equal ${this.utils.stringify(expected)}`
          : () =>
            `Expected ${this.utils.stringify(normalizedActual)} to equal ${this.utils.stringify(expected)}`,
        pass: passed,
      };
    },

    toEqualOneOf(actual, ...expectedArgs) {
      const passed = expectedArgs.some((expected) => this.equals(actual, expected, [DOMTester]));
      return {
        message: passed
          ? () =>
            `Expected ${this.utils.stringify(actual)} not  to equal an item within ${this.utils.stringify(expectedArgs)}`
          : () =>
            `Expected ${this.utils.stringify(actual)} to equal any items within ${this.utils.stringify(expectedArgs)}`,
        pass: passed,
      };
    },

    toEqualData(actual, expected) {
      const passed = angular.equals(actual, expected);
      return {
        message: passed
          ? `Expected the data within ${this.utils.stringify(actual)} not to equal ${this.utils.stringify(expected)}`
          : `Expected the data within ${this.utils.stringify(actual)} to equal ${this.utils.stringify(expected)}`,
        pass: passed,
      };
    },

    toHaveBeenCalledOnceWith(actual, ...expectedArgs) {
      if (!jest.isMockFunction(actual)) {
        throw new Error(`Expected a spy, but got ${this.utils.stringify(actual)}.`);
      }

      const actualCount = actual.mock.calls.length;
      const actualArgs = actualCount && actual.mock.calls[0];

      const passed = actualCount === 1 && this.equals(actualArgs, expectedArgs);
      const isNot = passed;

      const message = () => {
        let msg =
          `Expected spy${isNot ? ' not ' : ' '}to have been called once with ` +
          `${this.utils.stringify(expectedArgs)}, but `;

        if (isNot) {
          msg += 'it was.';
          return msg;
        }

        switch (actualCount) {
          case 0:
            msg += 'it was never called.';
            break;
          case 1:
            msg += `it was called with ${this.utils.stringify(actualArgs)}.`;
            break;
          default:
            msg += `it was called ${actualCount} times.`;
            break;
        }

        return msg;
      };

      return { message, pass: passed };
    },

    toBeOneOf(actual, ...expectedArgs) {
      const passed = expectedArgs.includes(actual);
      return {
        message: passed
          ? () =>
            `Expected ${this.utils.stringify(actual)} not to be an item within ${this.utils.stringify(expectedArgs)}`
          : () => `Expected ${this.utils.stringify(actual)} to be within ${this.utils.stringify(expectedArgs)}`,
        pass: passed,
      };
    },

    toHaveClass(actual, className) {
      let passed = false;
      const classes = className.trim().split(/\s+/);

      for (let i = 0; i < classes.length; i += 1) {
        if (hasClass(actual[0], classes[i])) {
          passed = true;
          break;
        }
      }

      const isNot = passed;
      return {
        message: () =>
          `Expected '${angular.mock.dump(actual)}'${isNot ? ' not ' : ' '}to have class '${className}'.`,
        pass: passed,
      };
    },

    toEqualMinErr(actual, namespace, code, content) {
      const matcher = new MinErrMatcher(namespace, code, content, {
        inputType: 'error',
        expectedAction: 'equal',
        actualAction: 'was',
      });

      return matcher.test(actual);
    },

    toThrowMinErr(actual, namespace, code, content) {
      let exception;

      if (!angular.isFunction(actual)) {
        throw new Error('Actual is not a function');
      }

      try {
        actual();
      } catch (e) {
        exception = e;
      }

      const matcher = new MinErrMatcher(namespace, code, content, {
        inputType: 'function',
        expectedAction: 'throw',
        actualAction: 'threw',
      });

      return matcher.test(exception);
    },

    toBeMarkedAsSelected(actual) {
      const isSelected = actual.selected;
      const hasAttribute = actual.hasAttribute('selected');
      const passed = isSelected && hasAttribute;

      return {
        message: passed
          ? () =>
            isSelected
              ? 'Expected option property selected to be falsy'
              : "Expected option to not have a 'selected' attribute applied"
          : () =>
            !isSelected
              ? 'Expected option property selected to be truthy'
              : "Expected option to have the 'selected' attribute applied",
        pass: passed,
      };
    },

    toEqualSelect(actual, ...expectedValues) {
      const actualValues = [];

      angular.forEach(actual.find('option'), (option) => {
        actualValues.push(option.selected ? [option.value] : option.value);
      });

      const passed = angular.equals(expectedValues, actualValues);

      return {
        message: passed
          ? () => `Expected ${angular.toJson(actualValues)} not to equal ${angular.toJson(expectedValues)}.`
          : () => `Expected ${angular.toJson(actualValues)} to equal ${angular.toJson(expectedValues)}.`,
        pass: passed,
      };
    },
  });
});

/**
 * Create jest.Spy on given method, but ignore calls without arguments
 * This is helpful when need to spy only setter methods and ignore getters
 */
const spyOnlyCallsWithArgs = (obj, method) => {
  const originalFn = obj[method];
  const spy = jest.spyOn(obj, method);

  // must be `function` to preserve `this` for spy/original method calls
  obj[method] = function (...args) {
    if (args.length) return spy.apply(this, args);
    return originalFn.apply(this);
  };

  return spy;
};

// Minimal implementation to mock what was removed from Jasmine 1.x
const createAsync = (doneFn) => {
  class Job {
    constructor() {
      this.next = [];
    }

    done() {
      return this.runs(doneFn);
    }

    runs(fn) {
      const newJob = new Job();
      this.next.push(() => {
        fn();
        newJob.start();
      });
      return newJob;
    }

    waitsFor(fn, error, timeout = 5000) {
      const newJob = new Job();

      this.next.push(() => {
        let counter = 0;

        const intervalId = window.setInterval(() => {
          if (fn()) {
            window.clearInterval(intervalId);
            newJob.start();
            return;
          }

          counter += 5;
          if (counter > timeout) {
            window.clearInterval(intervalId);
            throw new Error(error);
          }
        }, 5);
      });

      return newJob;
    }

    waits(timeout) {
      return this.waitsFor(() => true, undefined, timeout);
    }

    start() {
      for (let i = 0; i < this.next.length; i += 1) {
        this.next[i]();
      }
    }
  }

  return new Job();
};

window.createAsync = createAsync;
window.spyOnlyCallsWithArgs = spyOnlyCallsWithArgs;
