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

  it('should not throw an error if undefined', angular.mock.inject(($rootScope, $compile) => {
    element = $compile('<img ng-attr-srcset="{{undefined}}">')($rootScope);
    $rootScope.$digest();
  }));

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
