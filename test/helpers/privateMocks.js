'use strict';

/* globals xit */
const assertCompareNodes = (a, b, not) => {
  const nodeA = a && a[0] ? a[0] : a;
  const nodeB = b && b[0] ? b[0] : b;
  expect(nodeA === nodeB).toBe(!not);
};

const baseThey = (msg, vals, spec, itFn) => {
  const valsIsArray = angular.isArray(vals);

  angular.forEach(vals, (val, key) => {
    const m = msg.split('$prop').join(angular.toJson(valsIsArray ? val : key));
    itFn(m, function () {
      spec.call(this, val);
    });
  });
};

const they = (msg, vals, spec) => baseThey(msg, vals, spec, it);
const fthey = (msg, vals, spec) => baseThey(msg, vals, spec, fit);
const xthey = (msg, vals, spec) => baseThey(msg, vals, spec, xit);

const createMockStyleSheet = (doc) => {
  const documentRef = doc && doc[0] ? doc[0] : window.document;

  const node = documentRef.createElement('style');
  const head = documentRef.getElementsByTagName('head')[0];
  head.appendChild(node);

  const ss = documentRef.styleSheets[documentRef.styleSheets.length - 1];

  const addRule = (selector, styles) => {
    try {
      ss.insertRule(`${selector}{ ${styles}}`, 0);
    } catch (e) {
      try {
        ss.addRule(selector, styles);
      } catch (e2) {
        /* empty */
      }
    }
  };

  const addPossiblyPrefixedRule = (selector, styles) => {
    // Support: Android <5, Blackberry Browser 10, default Chrome in Android 4.4.x
    // Mentioned browsers need a -webkit- prefix for transitions & animations.
    const prefixedStyles = styles
      .split(/\s*;\s*/g)
      .filter((style) => style && /^(?:transition|animation)\b/.test(style))
      .map((style) => `-webkit-${style}`)
      .join('; ');

    addRule(selector, prefixedStyles);
    addRule(selector, styles);
  };

  const destroy = () => {
    head.removeChild(node);
  };

  return {
    addRule,
    addPossiblyPrefixedRule,
    destroy,
  };
};

window.assertCompareNodes = assertCompareNodes;
window.createMockStyleSheet = createMockStyleSheet;
window.they = they;
