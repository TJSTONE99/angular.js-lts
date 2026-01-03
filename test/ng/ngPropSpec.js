'use strict';

/* eslint-disable no-script-url */

describe('ngProp*', () => {
  it('should bind boolean properties (input disabled)', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<button ng-prop-disabled="isDisabled">Button</button>')($rootScope);
    toDealoc.push(element);
    $rootScope.$digest();
    expect(element.prop('disabled')).toBe(false);
    $rootScope.isDisabled = true;
    $rootScope.$digest();
    expect(element.prop('disabled')).toBe(true);
    $rootScope.isDisabled = false;
    $rootScope.$digest();
    expect(element.prop('disabled')).toBe(false);
  }));

  it('should bind boolean properties (input checked)', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<input type="checkbox" ng-prop-checked="isChecked" />')($rootScope);
    toDealoc.push(element);
    expect(element.prop('checked')).toBe(false);
    $rootScope.isChecked = true;
    $rootScope.$digest();
    expect(element.prop('checked')).toBe(true);
    $rootScope.isChecked = false;
    $rootScope.$digest();
    expect(element.prop('checked')).toBe(false);
  }));

  it('should bind string properties (title)', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-title="title" />')($rootScope);
    toDealoc.push(element);
    $rootScope.title = 123;
    $rootScope.$digest();
    expect(element.prop('title')).toBe('123');
    $rootScope.title = 'foobar';
    $rootScope.$digest();
    expect(element.prop('title')).toBe('foobar');
  }));

  it('should bind variable type properties', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-asdf="asdf" />')($rootScope);
    toDealoc.push(element);
    $rootScope.asdf = 123;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(123);
    $rootScope.asdf = 'foobar';
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe('foobar');
    $rootScope.asdf = true;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(true);
  }));

  // https://github.com/angular/angular.js/issues/16797
  it('should support falsy property values', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-text="myText" />')($rootScope);
    toDealoc.push(element);
    // Initialize to truthy value
    $rootScope.myText = 'abc';
    $rootScope.$digest();
    expect(element.prop('text')).toBe('abc');

    // Assert various falsey values get assigned to the property
    $rootScope.myText = '';
    $rootScope.$digest();
    expect(element.prop('text')).toBe('');
    $rootScope.myText = 0;
    $rootScope.$digest();
    expect(element.prop('text')).toBe(0);
    $rootScope.myText = false;
    $rootScope.$digest();
    expect(element.prop('text')).toBe(false);
    $rootScope.myText = undefined;
    $rootScope.$digest();
    expect(element.prop('text')).toBeUndefined();
    $rootScope.myText = null;
    $rootScope.$digest();
    expect(element.prop('text')).toBe(null);
  }));

  it('should directly map special properties (class)', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-class="myText" />')($rootScope);
    toDealoc.push(element);
    $rootScope.myText = 'abc';
    $rootScope.$digest();
    expect(element[0].class).toBe('abc');
    expect(element).not.toHaveClass('abc');
  }));

  it('should not use jQuery .prop() to avoid jQuery propFix/hooks', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-class="myText" />')($rootScope);
    toDealoc.push(element);
    jest.spyOn(angular.element.prototype, 'prop');
    $rootScope.myText = 'abc';
    $rootScope.$digest();
    expect(angular.element.prototype.prop).not.toHaveBeenCalled();
  }));

  it('should support mixed case using underscore-separated names', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-a_bcd_e="value" />')($rootScope);
    toDealoc.push(element);
    $rootScope.value = 123;
    $rootScope.$digest();
    expect(element.prop('aBcdE')).toBe(123);
  }));

  it('should work with different prefixes', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.name = 'Misko';
    const element = $compile('<span ng:prop:test="name" ng-Prop-test2="name" ng_Prop_test3="name"></span>')($rootScope);
    toDealoc.push(element);
    expect(element.prop('test')).toBe('Misko');
    expect(element.prop('test2')).toBe('Misko');
    expect(element.prop('test3')).toBe('Misko');
  }));

  it('should work with the "href" property', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.value = 'test';
    const element = $compile('<a ng-prop-href="\'test/\' + value"></a>')($rootScope);
    toDealoc.push(element);
    $rootScope.$digest();
    expect(element.prop('href')).toMatch(/\/test\/test$/);
  }));

  it('should work if they are prefixed with x- or data- and different prefixes', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.name = 'Misko';
    const element = $compile('<span data-ng-prop-test2="name" x-ng-prop-test3="name" data-ng:prop-test4="name" ' +
      'x_ng-prop-test5="name" data:ng-prop-test6="name"></span>')($rootScope);
    toDealoc.push(element);
    expect(element.prop('test2')).toBe('Misko');
    expect(element.prop('test3')).toBe('Misko');
    expect(element.prop('test4')).toBe('Misko');
    expect(element.prop('test5')).toBe('Misko');
    expect(element.prop('test6')).toBe('Misko');
  }));

  it('should work independently of attributes with the same name', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-asdf="asdf" asdf="foo" />')($rootScope);
    toDealoc.push(element);
    $rootScope.asdf = 123;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(123);
    expect(element.attr('asdf')).toBe('foo');
  }));

  it('should work independently of (ng-)attributes with the same name', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-asdf="asdf" ng-attr-asdf="foo" />')($rootScope);
    toDealoc.push(element);
    $rootScope.asdf = 123;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(123);
    expect(element.attr('asdf')).toBe('foo');
  }));

  it('should use the full ng-prop-* attribute name in $attr mappings', () => {
    let attrs;
    angular.mock.module($compileProvider => {
      $compileProvider.directive('attrExposer', ngInternals.valueFn({
        link: function ($scope, $element, $attrs) {
          attrs = $attrs;
        }
      }));
    });
    angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<div attr-exposer ng-prop-title="12" ng-prop-super-title="34" ng-prop-my-camel_title="56">')($rootScope);
      toDealoc.push(element);

      expect(attrs.title).toBeUndefined();
      expect(attrs.$attr.title).toBeUndefined();
      expect(attrs.ngPropTitle).toBe('12');
      expect(attrs.$attr.ngPropTitle).toBe('ng-prop-title');

      expect(attrs.superTitle).toBeUndefined();
      expect(attrs.$attr.superTitle).toBeUndefined();
      expect(attrs.ngPropSuperTitle).toBe('34');
      expect(attrs.$attr.ngPropSuperTitle).toBe('ng-prop-super-title');

      expect(attrs.myCamelTitle).toBeUndefined();
      expect(attrs.$attr.myCamelTitle).toBeUndefined();
      expect(attrs.ngPropMyCamelTitle).toBe('56');
      expect(attrs.$attr.ngPropMyCamelTitle).toBe('ng-prop-my-camel_title');
    });
  });

  it('should not conflict with (ng-attr-)attribute mappings of the same name', () => {
    let attrs;
    angular.mock.module($compileProvider => {
      $compileProvider.directive('attrExposer', ngInternals.valueFn({
        link: function ($scope, $element, $attrs) {
          attrs = $attrs;
        }
      }));
    });
    angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<div attr-exposer ng-prop-title="42" ng-attr-title="foo" title="bar">')($rootScope);
      toDealoc.push(element);
      expect(attrs.title).toBe('foo');
      expect(attrs.$attr.title).toBe('title');
      expect(attrs.$attr.ngPropTitle).toBe('ng-prop-title');
    });
  });

  it('should disallow property binding to onclick', angular.mock.inject(($compile, $rootScope) => {
    // All event prop bindings are disallowed.
    expect(() => {
      $compile('<button ng-prop-onclick="onClickJs"></button>')($rootScope);
    }).toThrowMinErr(
      '$compile', 'nodomevents', 'Property bindings for HTML DOM event properties are disallowed');
    expect(() => {
      $compile('<button ng-prop-ONCLICK="onClickJs"></button>')($rootScope);
    }).toThrowMinErr(
      '$compile', 'nodomevents', 'Property bindings for HTML DOM event properties are disallowed');
  }));

  it('should process property bindings in pre-linking phase at priority 100', () => {
    angular.mock.module(provideLog);
    angular.mock.module($compileProvider => {
      $compileProvider.directive('propLog', (log, $rootScope) => {
        return {
          compile: function ($element, $attrs) {
            log('compile=' + $element.prop('myName'));

            return {
              pre: function ($scope, $element, $attrs) {
                log('preLinkP0=' + $element.prop('myName'));
                $rootScope.name = 'pre0';
              },
              post: function ($scope, $element, $attrs) {
                log('postLink=' + $element.prop('myName'));
                $rootScope.name = 'post0';
              }
            };
          }
        };
      });
    });
    angular.mock.module($compileProvider => {
      $compileProvider.directive('propLogHighPriority', (log, $rootScope) => {
        return {
          priority: 101,
          compile: function () {
            return {
              pre: function ($scope, $element, $attrs) {
                log('preLinkP101=' + $element.prop('myName'));
                $rootScope.name = 'pre101';
              }
            };
          }
        };
      });
    });
    angular.mock.inject(($rootScope, $compile, log) => {
      const element = $compile('<div prop-log-high-priority prop-log ng-prop-my_name="name"></div>')($rootScope);
      toDealoc.push(element);
      $rootScope.name = 'angular';
      $rootScope.$apply();
      log('digest=' + element.prop('myName'));
      expect(log).toEqual('compile=undefined; preLinkP101=undefined; preLinkP0=pre101; postLink=pre101; digest=angular');
    });
  });

  describe('img[src] sanitization', () => {

    it('should accept trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
      const element = $compile('<img ng-prop-src="testUrl"></img>')($rootScope);
      toDealoc.push(element);
      // Some browsers complain if you try to write `javascript:` into an `img[src]`
      // So for the test use something different
      $rootScope.testUrl = $sce.trustAsMediaUrl('someuntrustedthing:foo();');
      $rootScope.$digest();
      expect(element.prop('src')).toEqual('someuntrustedthing:foo();');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('someSanitizedUrl');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        const element = $compile('<img ng-prop-src="testUrl"></img>')($rootScope);
        toDealoc.push(element);
        $rootScope.testUrl = 'someUrl';

        $rootScope.$apply();
        expect(element.prop('src')).toMatch(/^http:\/\/.*\/someSanitizedUrl$/);
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
      });
    });

    it('should not use $$sanitizeUri with trusted values', () => {
      const $$sanitizeUri = jest.fn().mockImplementation(() => {
        throw new Error('Should not have been called')
      });
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope, $sce) => {
        const element = $compile('<img ng-prop-src="testUrl"></img>')($rootScope);
        toDealoc.push(element);
        // Assigning javascript:foo to src makes at least IE9-11 complain, so use another
        // protocol name.
        $rootScope.testUrl = $sce.trustAsMediaUrl('untrusted:foo();');
        $rootScope.$apply();
        expect(element.prop('src')).toBe('untrusted:foo();');
      });
    });
  });

  describe('a[href] sanitization', () => {
    it('should NOT require trusted values for trusted URI values', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.testUrl = 'http://example.com/image.png'; // `http` is trusted
      let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('http://example.com/image.png');

      element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('http://example.com/image.png');
    }));

    it('should accept trusted values for non-trusted URI values', angular.mock.inject(($rootScope, $compile, $sce) => {
      $rootScope.testUrl = $sce.trustAsUrl('javascript:foo()'); // `javascript` is not trusted
      let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('javascript:foo()');

      element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('javascript:foo()');
    }));

    it('should sanitize non-trusted values', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.testUrl = 'javascript:foo()'; // `javascript` is not trusted
      let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('unsafe:javascript:foo()');

      element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('unsafe:javascript:foo()');
    }));

    it('should not sanitize href on elements other than anchor', angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<div ng-prop-href="testUrl"></div>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.prop('href')).toBe('javascript:doEvilStuff()');
    }));

    it('should not sanitize properties other then those configured', angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<a ng-prop-title="testUrl"></a>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.prop('title')).toBe('javascript:doEvilStuff()');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('someSanitizedUrl');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
        toDealoc.push(element);
        $rootScope.testUrl = 'someUrl';
        $rootScope.$apply();
        expect(element.prop('href')).toMatch(/^http:\/\/.*\/someSanitizedUrl$/);
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);

        $$sanitizeUri.mockClear();

        element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
        toDealoc.push(element);
        $rootScope.$apply();
        expect(element.prop('href')).toMatch(/^http:\/\/.*\/someSanitizedUrl$/);
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    it('should not have endless digests when given arrays in concatenable context', angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<foo ng-prop-href="testUrl"></foo><foo ng-prop-href="::testUrl"></foo>' +
        '<foo ng-prop-href="\'http://example.com/\' + testUrl"></foo><foo ng-prop-href="::\'http://example.com/\' + testUrl"></foo>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = [1];
      $rootScope.$digest();

      $rootScope.testUrl = [];
      $rootScope.$digest();

      $rootScope.testUrl = { a: 'b' };
      $rootScope.$digest();

      $rootScope.testUrl = {};
      $rootScope.$digest();
    }));
  });

  describe('iframe[src]', () => {
    it('should pass through src properties for the same domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.prop('src')).toMatch(/\/different_page$/);
    }));

    it('should clear out src properties for a different domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: http://a.different.domain.example.com');
    }));

    it('should clear out JS src properties', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: javascript:alert(1);');
    }));

    it('should clear out non-resource_url src properties', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: javascript:doTrustedStuff()');
    }));

    it('should pass through $sce.trustAs() values in src properties', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.prop('src')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('base[href]', () => {
    it('should be a RESOURCE_URL context', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<base ng-prop-href="testUrl"/>')($rootScope);
      toDealoc.push(element);

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://example.com/');
      $rootScope.$apply();
      expect(element.prop('href')).toContain('https://example.com/');

      $rootScope.testUrl = 'https://not.example.com/';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: https://not.example.com/');
    }));
  });

  describe('form[action]', () => {
    it('should pass through action property for the same domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.prop('action')).toMatch(/\/different_page$/);
    }));

    it('should clear out action property for a different domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: http://a.different.domain.example.com');
    }));

    it('should clear out JS action property', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: javascript:alert(1);');
    }));

    it('should clear out non-resource_url action property', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: javascript:doTrustedStuff()');
    }));


    it('should pass through $sce.trustAsResourceUrl() values in action property', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.prop('action')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('link[href]', () => {
    it('should reject invalid RESOURCE_URLs', angular.mock.inject(($compile, $rootScope) => {
      const element = $compile('<link ng-prop-href="testUrl" rel="stylesheet" />')($rootScope);
      toDealoc.push(element);
      $rootScope.testUrl = 'https://evil.example.org/css.css';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
      '  URL: https://evil.example.org/css.css');
    }));

    it('should accept valid RESOURCE_URLs', angular.mock.inject(($compile, $rootScope, $sce) => {
      const element = $compile('<link ng-prop-href="testUrl" rel="stylesheet" />')($rootScope);
      toDealoc.push(element);

      $rootScope.testUrl = './css1.css';
      $rootScope.$apply();
      expect(element.prop('href')).toContain('css1.css');

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://elsewhere.example.org/css2.css');
      $rootScope.$apply();
      expect(element.prop('href')).toContain('https://elsewhere.example.org/css2.css');
    }));
  });

  describe('*[innerHTML]', () => {
    describe('SCE disabled', () => {
      beforeEach(() => {
        angular.mock.module($sceProvider => { $sceProvider.enabled(false); });
      });

      it('should set html', angular.mock.inject(($rootScope, $compile) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = '<div onclick="">hello</div>';
        $rootScope.$digest();
        expect((element.html()).toLowerCase()).toEqual('<div onclick="">hello</div>');
      }));

      it('should update html', angular.mock.inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = 'hello';
        $rootScope.$digest();
        expect((element.html()).toLowerCase()).toEqual('hello');
        $rootScope.html = 'goodbye';
        $rootScope.$digest();
        expect((element.html()).toLowerCase()).toEqual('goodbye');
      }));

      it('should one-time bind if the expression starts with two colons', angular.mock.inject(($rootScope, $compile) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="::html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = '<div onclick="">hello</div>';
        expect($rootScope.$$watchers.length).toEqual(1);
        $rootScope.$digest();
        expect(element.text()).toEqual('hello');
        expect($rootScope.$$watchers.length).toEqual(0);
        $rootScope.html = '<div onclick="">hello</div>';
        $rootScope.$digest();
        expect(element.text()).toEqual('hello');
      }));
    });


    describe('SCE enabled', () => {
      it('should NOT set html for untrusted values', angular.mock.inject(($rootScope, $compile) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = '<div onclick="">hello</div>';
        expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      }));

      it('should NOT set html for wrongly typed values', angular.mock.inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = $sce.trustAsCss('<div onclick="">hello</div>');
        expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      }));

      it('should set html for trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
        $rootScope.$digest();
        expect((element.html()).toLowerCase()).toEqual('<div onclick="">hello</div>');
      }));

      it('should update html', angular.mock.inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.html = $sce.trustAsHtml('hello');
        $rootScope.$digest();
        expect((element.html()).toLowerCase()).toEqual('hello');
        $rootScope.html = $sce.trustAsHtml('goodbye');
        $rootScope.$digest();
        expect((element.html()).toLowerCase()).toEqual('goodbye');
      }));

      it('should not cause infinite recursion for trustAsHtml object watches',
        angular.mock.inject(($rootScope, $compile, $sce) => {
          // Ref: https://github.com/angular/angular.js/issues/3932
          // If the binding is a function that creates a new value on every call via trustAs, we'll
          // trigger an infinite digest if we don't take care of it.
          const element = $compile('<div ng-prop-inner_h_t_m_l="getHtml()"></div>')($rootScope);
          toDealoc.push(element);
          $rootScope.getHtml = () => {
            return $sce.trustAsHtml('<div onclick="">hello</div>');
          };
          $rootScope.$digest();
          expect((element.html()).toLowerCase()).toEqual('<div onclick="">hello</div>');
        }));

      it('should handle custom $sce objects', () => {
        function MySafeHtml(val) { this.val = val; }

        angular.mock.module($provide => {
          $provide.decorator('$sce', $delegate => {
            $delegate.trustAsHtml = html => { return new MySafeHtml(html); };
            $delegate.getTrusted = (type, mySafeHtml) => { return mySafeHtml && mySafeHtml.val; };
            $delegate.valueOf = v => { return v instanceof MySafeHtml ? v.val : v; };
            return $delegate;
          });
        });

        angular.mock.inject(($rootScope, $compile, $sce) => {
          // Ref: https://github.com/angular/angular.js/issues/14526
          // Previous code used toString for change detection, which fails for custom objects
          // that don't override toString.
          const element = $compile('<div ng-prop-inner_h_t_m_l="getHtml()"></div>')($rootScope);
          toDealoc.push(element);
          let html = 'hello';
          $rootScope.getHtml = () => { return $sce.trustAsHtml(html); };
          $rootScope.$digest();
          expect((element.html()).toLowerCase()).toEqual('hello');
          html = 'goodbye';
          $rootScope.$digest();
          expect((element.html()).toLowerCase()).toEqual('goodbye');
        });
      });

      describe('when $sanitize is available', () => {
        beforeEach(() => { angular.mock.module('ngSanitize'); });

        it('should sanitize untrusted html', angular.mock.inject(($rootScope, $compile) => {
          const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
          toDealoc.push(element);
          $rootScope.html = '<div onclick="">hello</div>';
          $rootScope.$digest();
          expect((element.html()).toLowerCase()).toEqual('<div>hello</div>');
        }));
      });
    });

  });

  describe('*[style]', () => {
    // Support: IE9
    // Some browsers throw when assignging to HTMLElement.style
    function canAssignStyleProp() {
      try {
        window.document.createElement('div').style = 'margin-left: 10px';
        return true;
      } catch (e) {
        return false;
      }
    }

    it('should NOT set style for untrusted values', angular.mock.inject(($rootScope, $compile) => {
      const element = $compile('<div ng-prop-style="style"></div>')($rootScope);
      toDealoc.push(element);
      $rootScope.style = 'margin-left: 10px';
      expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    it('should NOT set style for wrongly typed values', angular.mock.inject(($rootScope, $compile, $sce) => {
      const element = $compile('<div ng-prop-style="style"></div>')($rootScope);
      toDealoc.push(element);
      $rootScope.style = $sce.trustAsHtml('margin-left: 10px');
      expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    if (canAssignStyleProp()) {
      it('should set style for trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-style="style"></div>')($rootScope);
        toDealoc.push(element);
        $rootScope.style = $sce.trustAsCss('margin-left: 10px');
        $rootScope.$digest();

        expect(element.css('margin-left')).toEqual('10px');
      }));
    }
  });
});
