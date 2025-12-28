'use strict';

const supportTests = {
  classes: '/^class\\b/.test((class C {}).toString())',
  fatArrows: 'a => a',
  shorthandMethods: '({ fn(x) { return; } })'
};

window.support = {};

Object.keys(supportTests).forEach((prop) => {
  try {
    window.support[prop] = !!eval(supportTests[prop]);
  } catch (e) {
    window.support[prop] = false;
  }
});
