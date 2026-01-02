'use strict';

/* eslint-disable no-script-url */

describe('ngSrcset', () => {
  let element;

  afterEach(() => {
    dealoc(element);
  });

  it('should not result empty string in img srcset', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.image = {};
    element = $compile('<img ng-srcset="{{image.url}} 2x">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();
  }));

  it('should sanitize good urls', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, http://example.com/image2.png 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x, http://example.com/image2.png 2x');
  }));

  it('should sanitize evil url', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, javascript:doEvilStuff() 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x, unsafe:javascript:doEvilStuff() 2x');
  }));

  it('should enforce imgSrcSanitizationTrustedUrlList for ng-srcset', () => {
    angular.mock.module(function ($compileProvider) {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(function ($rootScope, $compile) {
      $rootScope.imageUrl = 'https://angularjs.org/logo.png 1x, https://evil.example/evil.png 2x';
      element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/logo.png 1x, unsafe:https://evil.example/evil.png 2x');
    });
  });

  it('should individually sanitize mixed allowed/disallowed URLs in ng-srcset', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'https://evil.example/a.png 1x, https://angularjs.org/b.png 2x, https://evil.example/c.png 3x';
      element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('unsafe:https://evil.example/a.png 1x, https://angularjs.org/b.png 2x, unsafe:https://evil.example/c.png 3x');
    });
  });

  it('should not throw an error if undefined', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<img ng-attr-srcset="{{undefined}}">')($rootScope);
    $rootScope.$digest();
  }));

  it('should enforce allowlist for ng-attr-srcset', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'https://angularjs.org/logo.png 1x, https://evil.example/evil.png 2x';
      element = $compile('<img ng-attr-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/logo.png 1x, unsafe:https://evil.example/evil.png 2x');
    });
  });

  it('should individually sanitize mixed URLs for ng-attr-srcset', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'https://evil.example/a.png 1x, https://angularjs.org/b.png 2x, https://evil.example/c.png 3x';
      element = $compile('<img ng-attr-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('unsafe:https://evil.example/a.png 1x, https://angularjs.org/b.png 2x, unsafe:https://evil.example/c.png 3x');
    });
  });

  it('should sanitize quoted candidates in ng-srcset', angular.mock.inject(($rootScope, $compile) => {
    // Expect per-candidate sanitization even with quotes around URLs
    $rootScope.imageUrl = '\'http://example.com/image1.png\' 1x, "javascript:doEvilStuff()" 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    // The malicious candidate must be prefixed with unsafe:
    expect(element.attr('srcset')).toContain('unsafe:javascript:doEvilStuff() 2x');
  }));

  it('should sanitize quoted candidates in ng-attr-srcset', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https?:\/\/example\.com\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = '"http://example.com/a.png" 1x, \'http://evil.example/b.png\' 2x';
      element = $compile('<img ng-attr-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toContain('unsafe:http://evil.example/b.png 2x');
    });
  });

  it('should sanitize candidates with no space before comma', angular.mock.inject(($rootScope, $compile) => {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x,javascript:doEvilStuff() 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x, unsafe:javascript:doEvilStuff() 2x');
  }));

  // CVE-2024-8372 reproductions matching the CodePen examples
  it('should not allow invalid descriptor to join candidates (ng-srcset)', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      // No space before comma, invalid descriptor `xyz`
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,https://angular.dev/favicon.ico';
      element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/favicon.ico xyz, unsafe:https://angular.dev/favicon.ico');
    });
  });

  it('should not allow data:image url via ng-srcset when allowlist is strict', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,data:image/svg+xml;base64,AAAA';
      element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/favicon.ico xyz, unsafe:data:image/svg+xml;base64,AAAA');
    });
  });

  it('should not allow invalid descriptor to join candidates (ng-attr-srcset)', () => {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,https://angular.dev/favicon.ico';
      element = $compile('<img ng-attr-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/favicon.ico xyz, unsafe:https://angular.dev/favicon.ico');
    });
  });

  it('should not allow data:image url via ng-attr-srcset when allowlist is strict', function () {
    angular.mock.module(($compileProvider) => {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/angularjs\.org\//);
    });
    angular.mock.inject(($rootScope, $compile) => {
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,data:image/svg+xml;base64,AAAA';
      element = $compile('<img ng-attr-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/favicon.ico xyz, unsafe:data:image/svg+xml;base64,AAAA');
    });
  });

  it('should interpolate the expression and bind to srcset', angular.mock.inject(($compile, $rootScope) => {
    const element = $compile('<img ng-srcset="some/{{id}} 2x"></div>')($rootScope);

    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();

    $rootScope.$apply(() => {
      $rootScope.id = 1;
    });
    expect(element.attr('srcset')).toEqual('some/1 2x');

    dealoc(element);
  }));


  it('should not be vulnerable to ReDoS attack (CVE-2024-21490)', inject(function ($compile, $rootScope) {
    // Test case that could cause catastrophic backtracking with the original regex
    var maliciousInput = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7 1x,' +
      ' '.repeat(50) + ' 2x,' +
      ' '.repeat(50) + ' 3x';

    $rootScope.imageUrl = maliciousInput;

    // This should complete in reasonable time (not hang due to ReDoS)
    var startTime = Date.now();
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    var endTime = Date.now();

    // Should complete in less than 1 second (usually much faster)
    expect(endTime - startTime).toBeLessThan(1000);

    // Should still process the srcset correctly
    expect(element.attr('srcset')).toBeDefined();

    dealoc(element);
  }));
});
