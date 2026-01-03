'use strict';

/* eslint-disable no-script-url */

describe('ngSrc', () => {
  let element;

  afterEach(() => {
    dealoc(element);
  });

  describe('img[ng-src]', () => {
    it('should not result empty string in img src', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.image = {};
      element = $compile('<img ng-src="{{image.url}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('src')).not.toBe('');
      expect(element.attr('src')).toBeUndefined();
    }));

    it('should sanitize interpolated url', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'javascript:alert(1);';
      element = $compile('<img ng-src="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('src')).toBe('unsafe:javascript:alert(1);');
    }));

    it('should sanitize non-interpolated url', angular.mock.inject(($rootScope, $compile) => {
      element = $compile('<img ng-src="javascript:alert(1);">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('src')).toBe('unsafe:javascript:alert(1);');
    }));

    it('should interpolate the expression and bind to src with raw same-domain value', angular.mock.inject(($compile, $rootScope) => {
      element = $compile('<img ng-src="{{id}}"></img>')($rootScope);

      $rootScope.$digest();
      expect(element.attr('src')).toBeUndefined();

      $rootScope.$apply(() => {
        $rootScope.id = '/somewhere/here';
      });
      expect(element.attr('src')).toEqual('/somewhere/here');
    }));

    it('should interpolate a multi-part expression for img src attribute (which requires the MEDIA_URL context)', angular.mock.inject(($compile, $rootScope) => {
      element = $compile('<img ng-src="some/{{id}}"></img>')($rootScope);
      expect(element.attr('src')).toBe(undefined);  // URL concatenations are all-or-nothing
      $rootScope.$apply(() => {
        $rootScope.id = 1;
      });
      expect(element.attr('src')).toEqual('some/1');
    }));

    it('should work with `src` attribute on the same element', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'dynamic';
      element = $compile('<img ng-src="{{imageUrl}}" src="static">')($rootScope);
      expect(element.attr('src')).toBe('static');
      $rootScope.$digest();
      expect(element.attr('src')).toBe('dynamic');
      dealoc(element);

      element = $compile('<img src="static" ng-src="{{imageUrl}}">')($rootScope);
      expect(element.attr('src')).toBe('static');
      $rootScope.$digest();
      expect(element.attr('src')).toBe('dynamic');
    }));
  });

  describe('iframe[ng-src]', () => {
    it('should pass through src attributes for the same domain', angular.mock.inject(($compile, $rootScope) => {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('src')).toEqual('different_page');
    }));

    it('should error on src attributes for a different domain', angular.mock.inject(($compile, $rootScope) => {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'http://a.different.domain.example.com');
    }));

    it('should error on JS src attributes', angular.mock.inject(($compile, $rootScope) => {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'javascript:alert(1);');
    }));

    it('should error on non-resource_url src attributes', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'javascript:doTrustedStuff()');
    }));

    it('should pass through $sce.trustAs() values in src attributes', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = $compile('<iframe ng-src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('src')).toEqual('javascript:doTrustedStuff()');
    }));

    it('should interpolate the expression and bind to src with a trusted value', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = $compile('<iframe ng-src="{{id}}"></iframe>')($rootScope);

      $rootScope.$digest();
      expect(element.attr('src')).toBeUndefined();

      $rootScope.$apply(() => {
        $rootScope.id = $sce.trustAsResourceUrl('http://somewhere');
      });
      expect(element.attr('src')).toEqual('http://somewhere');
    }));


    it('should NOT interpolate a multi-part expression in a `src` attribute that requires a non-MEDIA_URL context', angular.mock.inject(($compile, $rootScope) => {
      expect(() => {
        element = $compile('<iframe ng-src="some/{{id}}"></iframe>')($rootScope);
        $rootScope.$apply(() => {
          $rootScope.id = 1;
        });
      }).toThrowMinErr(
        '$interpolate', 'noconcat', 'Error while interpolating: some/{{id}}\nStrict ' +
        'Contextual Escaping disallows interpolations that concatenate multiple expressions ' +
      'when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce');
    }));


    it('should NOT interpolate a wrongly typed expression', angular.mock.inject(($compile, $rootScope, $sce) => {
      expect(() => {
        element = $compile('<iframe ng-src="{{id}}"></iframe>')($rootScope);
        $rootScope.$apply(() => {
          $rootScope.id = $sce.trustAsUrl('http://somewhere');
        });
        element.attr('src');
      }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{id}}\nError: [$sce:insecurl] Blocked ' +
      'loading resource from url not allowed by $sceDelegate policy.  URL: http://somewhere');
    }));
  });
});
