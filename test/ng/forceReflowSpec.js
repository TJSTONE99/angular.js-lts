'use strict';

describe('$$forceReflow', () => {
  it('should issue a reflow by touching the `document.body.client` when no param is provided', () => {
    angular.mock.module($provide => {
      const doc = angular.element('<div></div>');
      doc[0].body = {};
      doc[0].body.offsetWidth = 10;
      $provide.value('$document', doc);
    });
    angular.mock.inject($$forceReflow => {
      const value = $$forceReflow();
      expect(value).toBe(11);
    });
  });

  it('should issue a reflow by touching the `domNode.offsetWidth` when a domNode param is provided',
    angular.mock.inject($$forceReflow => {

      const elm = {};
      elm.offsetWidth = 100;
      expect($$forceReflow(elm)).toBe(101);
    }));

  it('should issue a reflow by touching the `jqLiteNode[0].offsetWidth` when a jqLite node param is provided',
    angular.mock.inject($$forceReflow => {

      let elm = {};
      elm.offsetWidth = 200;
      elm = angular.element(elm);
      expect($$forceReflow(elm)).toBe(201);
    }));

  describe('$animate with ngAnimateMock', () => {
    beforeEach(angular.mock.module('ngAnimateMock'));

    it('should keep track of how many reflows have been issued',
      angular.mock.inject(($$forceReflow, $animate) => {

        const elm = {};
        elm.offsetWidth = 10;

        expect($animate.reflows).toBe(0);

        $$forceReflow(elm);
        $$forceReflow(elm);
        $$forceReflow(elm);

        expect($animate.reflows).toBe(3);
      }));
  });
});
