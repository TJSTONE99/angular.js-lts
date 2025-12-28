/* global jQuery: true, uid: true, jqCache: true */
'use strict';

const toDealoc = [];
afterEach(() => {
  toDealoc.forEach((e) => dealoc(e));
  toDealoc.length = 0;
});

beforeEach(() => {
  // This resets global id counter;
  ngInternals.uid.current = 0;
  // Clear the cache to prevent memory leak failures from previous tests
  // breaking subsequent tests unnecessarily
  Object.keys(angular.element.cache).forEach((key) => {
    delete angular.element.cache[key];
  });

  angular.element(window.document.body).empty().removeData();
});

afterEach(function () {
  let count, cache;

  // These Nodes are persisted across tests.
  // They used to be assigned a `$$hashKey` when animated, which we needed to clear after each test
  // to avoid affecting other tests. This is no longer the case, so we are just ensuring that there
  // is indeed no `$$hashKey` on them.
  const doc = window.document;
  const html = doc.querySelector('html');
  const body = doc.body;
  expect(doc.$$hashKey).toBeFalsy();
  expect(html && html.$$hashKey).toBeFalsy();
  expect(body && body.$$hashKey).toBeFalsy();

  if (this.$injector) {
    const $rootScope = this.$injector.get('$rootScope');
    const $rootElement = this.$injector.get('$rootElement');
    const $log = this.$injector.get('$log');
    // release the injector
    dealoc($rootScope);
    dealoc($rootElement);

    // check $log mock
    if ($log.assertEmpty) {
      $log.assertEmpty();
    }
  }

  if (!window.disableCacheLeakCheck) {
    window.disableCacheLeakCheck = false;
    count = 0;

    cache = angular.element.cache;

    const testName = getCurrentTestName(this);

    const leaks = [];

    forEachSorted(cache, (expando, expandoKey) => {
      angular.forEach(expando.data, (value, dataKey) => {
        count++;

        leaks.push({
          test: testName,
          expandoKey,
          dataKey,
          id: value && value.$id,
          element: value && value.$element ? sortedHtml(value.$element) : null,
          value: value && !value.$element ? angular.toJson(value) : null
        });

        delete expando.data[dataKey];
      });
    });

    if (count) {
      // Print a readable list
      if (window.console && console.table) {
        console.table(leaks);
      } else {
        // Fallback for environments without console.table
        leaks.forEach((l) => dump('LEAK', `[${l.test}]`, l.expandoKey, l.dataKey, l.id, l.element || l.value));
      }
    }
  }

  // copied from Angular.js
  // we need this method here so that we can run module tests with wrapped angular.js
  function forEachSorted(obj, iterator, context) {
    const keys = Object.keys(obj).sort();
    for (let i = 0; i < keys.length; i++) {
      iterator.call(context, obj[keys[i]], keys[i]);
    }
    return keys;
  }
});

function getCurrentTestName(ctx) {
  // Jest (best if available)
  try {
    if (typeof expect !== 'undefined' && expect.getState) {
      const name = expect.getState().currentTestName;
      if (name) return name;
    }
  } catch (e) { }

  // Jasmine (Karma/Jasmine)
  try {
    if (typeof jasmine !== 'undefined' && jasmine.getEnv) {
      const env = jasmine.getEnv();

      // Jasmine 3+
      if (env.currentRunable) {
        const r = env.currentRunable();
        if (r && (r.fullName || r.description)) return r.fullName || r.description;
      }

      // Older Jasmine (not public API, but commonly works)
      if (env.currentSpec) {
        const s = env.currentSpec;
        if (s.getFullName) return s.getFullName();
        if (s.fullName) return s.fullName;
        if (s.description) return s.description;
      }
    }
  } catch (e) { }

  // Last-ditch: whatever the framework stuck on `this`
  return (ctx && (ctx.fullName || ctx.description)) || 'Unknown test';
}

function dealoc(obj) {
  const jqCache = angular.element.cache;
  if (obj) {
    if (angular.isElement(obj)) {
      cleanup(angular.element(obj));
    } else if (!window.jQuery) {
      // jQuery 2.x doesn't expose the cache storage.
      for (const key in jqCache) {
        const value = jqCache[key];
        if (value.data && value.data.$scope === obj) {
          delete jqCache[key];
        }
      }
    }
  }

  function cleanup(element) {
    angular.element.cleanData(element);

    // Note:  We aren't using element.contents() here.  Under jQuery, element.contents() can fail
    // for IFRAME elements.  jQuery explicitly uses (element.contentDocument ||
    // element.contentWindow.document) and both properties are null for IFRAMES that aren't attached
    // to a document.
    const children = element[0].childNodes || [];
    for (let i = 0; i < children.length; i++) {
      cleanup(angular.element(children[i]));
    }
  }
}

const jqLiteCacheSize = () => Object.keys(angular.element.cache).length;

/**
 * @param {DOMElement} element
 * @param {boolean=} showNgClass
 */
function sortedHtml(element, showNgClass) {
  let html = '';
  angular.forEach(angular.element(element), function toString(node) {
    if (node.nodeName === '#text') {
      html += node.nodeValue
        .replace(/&(\w+[&;\W])?/g, (match, entity) => {
          return entity ? match : '&amp;';
        })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    } else if (node.nodeName === '#comment') {
      html += `<!--${node.nodeValue}-->`;
    } else {
      html += `<${(node.nodeName || '?NOT_A_NODE?').toLowerCase()}`;
      const attributes = node.attributes || [];
      const attrs = [];
      let className = node.className || '';
      if (!showNgClass) {
        className = className.replace(/ng-[\w-]+\s*/g, '');
      }
      className = ngInternals.trim(className);
      if (className) {
        attrs.push(` class="${className}"`);
      }
      for (let i = 0; i < attributes.length; i++) {
        if (i > 0 && attributes[i] === attributes[i - 1]) {
          continue; // IE9 creates dupes. Ignore them!
        }

        const attr = attributes[i];
        if (
          attr.name.match(/^ng[:-]/) ||
          (!/^ng\d+/.test(attr.name) &&
            (attr.value || attr.value === '') &&
            attr.value !== 'null' &&
            attr.value !== 'auto' &&
            attr.value !== 'false' &&
            attr.value !== 'inherit' &&
            (attr.value !== '0' || attr.name === 'value') &&
            attr.name !== 'loop' &&
            attr.name !== 'complete' &&
            attr.name !== 'maxLength' &&
            attr.name !== 'size' &&
            attr.name !== 'class' &&
            attr.name !== 'start' &&
            attr.name !== 'tabIndex' &&
            attr.name !== 'style' &&
            attr.name.substr(0, 6) !== 'jQuery')
        ) {
          attrs.push(` ${attr.name}="${attr.value}"`);
        }
      }
      attrs.sort();
      html += attrs.join('');
      if (node.style) {
        let style = [];
        if (node.style.cssText) {
          angular.forEach(node.style.cssText.split(';'), (value) => {
            value = ngInternals.trim(value);
            if (value) {
              style.push(value.toLowerCase());
            }
          });
        }
        for (const css in node.style) {
          const value = node.style[css];
          if (
            angular.isString(value) &&
            angular.isString(css) &&
            css !== 'cssText' &&
            value &&
            isNaN(Number(css))
          ) {
            const text = `${css}: ${value}`.toLowerCase();
            if (value !== 'false' && style.indexOf(text) === -1) {
              style.push(text);
            }
          }
        }
        style.sort();
        const tmp = style;
        style = [];
        angular.forEach(tmp, (value) => {
          if (!value.match(/^max[^-]/)) {
            style.push(value);
          }
        });
        if (style.length) {
          html += ` style="${style.join('; ')};"`;
        }
      }
      html += '>';
      const children = node.childNodes;
      for (let j = 0; j < children.length; j++) {
        toString(children[j]);
      }
      html += `</${node.nodeName.toLowerCase()}>`;
    }
  });
  return html;
}

const childrenTagsOf = (element) => {
  const tags = [];

  angular.forEach(angular.element(element).children(), (child) => {
    tags.push(child.nodeName.toLowerCase());
  });

  return tags;
};

// TODO(vojta): migrate these helpers into jasmine matchers
const isCssVisible = (node) => {
  const display = node.css('display');
  return !node.hasClass('ng-hide') && display !== 'none';
};

const assertHidden = (node) => {
  if (isCssVisible(node)) {
    throw new Error(`Node should be hidden but was visible: ${angular.mock.dump(node)}`);
  }
};

const assertVisible = (node) => {
  if (!isCssVisible(node)) {
    throw new Error(`Node should be visible but was hidden: ${angular.mock.dump(node)}`);
  }
};

function provideLog($provide) {
  $provide.factory('log', () => {
    let messages = [];

    function log(msg) {
      messages.push(msg);
      return msg;
    }

    log.toString = () => messages.join('; ');

    log.toArray = () => messages;

    log.reset = () => {
      messages = [];
    };

    log.empty = () => {
      const currentMessages = messages;
      messages = [];
      return currentMessages;
    };

    log.fn = (msg) => () => log(msg);

    log.$$log = true;

    return log;
  });
}

const pending = () => {
  window.dump('PENDING');
};

const trace = (name) => {
  window.dump(new Error(name).stack);
};

const karmaDump =
  window.dump ||
  function () {
    window.console.log.apply(window.console, arguments);
  };

window.dump = function () {
  karmaDump.apply(
    undefined,
    Array.prototype.map.call(arguments, (arg) =>
      angular.mock.dump(arg)
    )
  );
};

function generateInputCompilerHelper(helper) {
  let VALIDITY_STATE_PROPERTY;

  beforeEach(() => {

    // Initialize validation counter
    helper.validationCounter = {
      min: 0,
      max: 0,
      step: 0,
      required: 0
    };

    angular.mock.module($compileProvider => {
      $compileProvider.directive('attrCapture', () => {
        return (scope, element, $attrs) => {
          helper.attrs = $attrs;
        };
      });
    });
    angular.mock.inject(($compile, $rootScope, $sniffer) => {
      helper.compileInput = (inputHtml, mockValidity, scope) => {
        scope = helper.scope = scope || $rootScope;

        // Create the input element and dealoc when done
        helper.inputElm = angular.element(inputHtml);

        // Set up mock validation if necessary
        if (angular.isObject(mockValidity)) {
          VALIDITY_STATE_PROPERTY = 'ngMockValidity';
          helper.inputElm.prop(VALIDITY_STATE_PROPERTY, mockValidity);
        }

        // Create the form element and dealoc when done
        helper.formElm = angular.element('<form name="form"></form>');
        helper.formElm.append(helper.inputElm);

        // Compile the lot and return the input element
        compileForTest(helper.formElm, scope);

        jest.spyOn(scope.form, '$addControl');
        jest.spyOn(scope.form, '$$renameControl');

        scope.$digest();

        // Intercept validators to count calls
        const inputCtrl = helper.inputElm.controller('ngModel');
        if (inputCtrl && inputCtrl.$validators) {
          ['min', 'max', 'step', 'required'].forEach(validatorName => {
            if (inputCtrl.$validators[validatorName]) {
              const originalValidator = inputCtrl.$validators[validatorName];
              inputCtrl.$validators[validatorName] = function () {
                helper.validationCounter[validatorName]++;
                return originalValidator.apply(this, arguments);
              };
              // Call the validator once to simulate initial validation
              helper.validationCounter[validatorName] = 1;
            }
          });
        }

        return helper.inputElm;
      };

      helper.changeInputValueTo = value => {
        helper.changeGivenInputTo(helper.inputElm, value);
      };

      helper.changeGivenInputTo = (inputElm, value) => {
        inputElm.val(value);
        browserTrigger(inputElm, $sniffer.hasEvent('input') ? 'input' : 'change');
      };

      helper.dealoc = () => {
        dealoc(helper.inputElm);
        dealoc(helper.formElm);
      };
    });
  });

  afterEach(() => {
    helper.dealoc();
  });

  afterEach(() => {
    VALIDITY_STATE_PROPERTY = 'validity';
  });
}

function generateTestCompiler(elementLike) {
  let compile;

  angular.mock.inject(($compile) => {
    compile = $compile;
  });

  const compiler = compile(elementLike);

  return (providedScope, cloneConnectFn, options) => {
    const compiled = compiler(providedScope, cloneConnectFn, options);
    toDealoc.push(compiled);
    return compiled;
  };
}

function compileForTest(elementLike, providedScope, cloneConnectFn, options) {
  let scope = providedScope;

  angular.mock.inject(($rootScope) => {
    if (scope === undefined) {
      scope = $rootScope;
    }
  });

  return generateTestCompiler(elementLike)(scope, cloneConnectFn, options);
}

window.disableCacheLeakCheck = false;
window.dealoc = dealoc;
window.toDealoc = toDealoc;
window.compileForTest = compileForTest;
window.generateTestCompiler = generateTestCompiler;
window.generateInputCompilerHelper = generateInputCompilerHelper;
window.sortedHtml = sortedHtml;
window.assertVisible = assertVisible;
window.assertHidden = assertHidden;
window.provideLog = provideLog;
window.jqLiteCacheSize = jqLiteCacheSize;
window.childrenTagsOf = childrenTagsOf;
window._jqLiteMode = !window.jQuery;
