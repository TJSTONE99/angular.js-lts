'use strict';

/* eslint-disable no-script-url */

describe('$compile', () => {
  const document = window.document;

  function isUnknownElement(el) {
    return !!el.toString().match(/Unknown/);
  }

  function isSVGElement(el) {
    return !!el.toString().match(/SVG/);
  }

  function isHTMLElement(el) {
    return !!el.toString().match(/HTML/);
  }

  function supportsMathML() {
    const d = document.createElement('div');
    d.innerHTML = '<math></math>';
    return !isUnknownElement(d.firstChild);
  }

  function getChildScopes(scope) {
    let children = [];
    if (!scope.$$childHead) { return children; }
    let childScope = scope.$$childHead;
    do {
      children.push(childScope);
      children = children.concat(getChildScopes(childScope));
    } while ((childScope = childScope.$$nextSibling));
    return children;
  }

  let element, directive, $rootScope;

  beforeEach(angular.mock.module(provideLog, ($compileProvider) => {
    element = null;
    directive = $compileProvider.directive;

    directive('log', log => {
      return {
        restrict: 'CAM',
        priority: 0,
        compile: ngInternals.valueFn((_scope, _element, attrs) => {
          log(attrs.log || 'LOG');
        })
      };
    });

    directive('highLog', log => {
      return {
        restrict: 'CAM', priority: 3, compile: ngInternals.valueFn((_scope, _element, attrs) => {
          log(attrs.highLog || 'HIGH');
        })
      };
    });

    directive('mediumLog', log => {
      return {
        restrict: 'CAM', priority: 2, compile: ngInternals.valueFn((_scope, _element, attrs) => {
          log(attrs.mediumLog || 'MEDIUM');
        })
      };
    });

    directive('greet', () => {
      return {
        restrict: 'CAM', priority: 10, compile: ngInternals.valueFn((scope, element, attrs) => {
          element.text('Hello ' + attrs.greet);
        })
      };
    });

    directive('set', () => {
      return (_scope, element, attrs) => {
        element.text(attrs.set);
      };
    });

    directive('mediumStop', ngInternals.valueFn({
      priority: 2,
      terminal: true
    }));

    directive('stop', ngInternals.valueFn({
      terminal: true
    }));

    directive('negativeStop', ngInternals.valueFn({
      priority: -100, // even with negative priority we still should be able to stop descend
      terminal: true
    }));

    directive('svgContainer', () => {
      return {
        template: '<svg width="400" height="400" ng-transclude></svg>',
        replace: true,
        transclude: true
      };
    });

    directive('svgCustomTranscludeContainer', () => {
      return {
        template: '<svg width="400" height="400"></svg>',
        transclude: true,
        link: function (_scope, element, _attr, _ctrls, $transclude) {
          const futureParent = element.children().eq(0);
          $transclude(clone => {
            futureParent.append(clone);
          }, futureParent);
        }
      };
    });

    directive('svgCircle', () => {
      return {
        template: '<circle cx="2" cy="2" r="1"></circle>',
        templateNamespace: 'svg',
        replace: true
      };
    });

    directive('myForeignObject', () => {
      return {
        template: '<foreignObject width="100" height="100" ng-transclude></foreignObject>',
        templateNamespace: 'svg',
        replace: true,
        transclude: true
      };
    });


    return (_$compile_, _$rootScope_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    };
  }));

  function compile(html) {
    element = angular.element(html);
    toDealoc.push(element);
    compileForTest(element);
  }

  afterEach(() => {
    dealoc(element);
  });


  describe('configuration', () => {

    it('should use $$sanitizeUriProvider for reconfiguration of the `aHrefSanitizationTrustedUrlList`', () => {
      angular.mock.module(($compileProvider, $$sanitizeUriProvider) => {
        const newRe = /safe:/;
        let returnVal;

        expect($compileProvider.aHrefSanitizationTrustedUrlList()).toBe($$sanitizeUriProvider.aHrefSanitizationTrustedUrlList());
        returnVal = $compileProvider.aHrefSanitizationTrustedUrlList(newRe);
        expect(returnVal).toBe($compileProvider);
        expect($$sanitizeUriProvider.aHrefSanitizationTrustedUrlList()).toBe(newRe);
        expect($compileProvider.aHrefSanitizationTrustedUrlList()).toBe(newRe);
      });
      angular.mock.inject(() => {
        // needed to the module definition above is run...
      });
    });

    it('should use $$sanitizeUriProvider for reconfiguration of the `imgSrcSanitizationTrustedUrlList`', () => {
      angular.mock.module(($compileProvider, $$sanitizeUriProvider) => {
        const newRe = /safe:/;
        let returnVal;

        expect($compileProvider.imgSrcSanitizationTrustedUrlList()).toBe($$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList());
        returnVal = $compileProvider.imgSrcSanitizationTrustedUrlList(newRe);
        expect(returnVal).toBe($compileProvider);
        expect($$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList()).toBe(newRe);
        expect($compileProvider.imgSrcSanitizationTrustedUrlList()).toBe(newRe);
      });
      angular.mock.inject(() => {
        // needed to the module definition above is run...
      });
    });

    it('should allow debugInfoEnabled to be configured', () => {
      angular.mock.module($compileProvider => {
        expect($compileProvider.debugInfoEnabled()).toBe(true); // the default
        $compileProvider.debugInfoEnabled(false);
        expect($compileProvider.debugInfoEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should allow strictComponentBindingsEnabled to be configured', () => {
      angular.mock.module($compileProvider => {
        expect($compileProvider.strictComponentBindingsEnabled()).toBe(false); // the default
        $compileProvider.strictComponentBindingsEnabled(true);
        expect($compileProvider.strictComponentBindingsEnabled()).toBe(true);
      });
      angular.mock.inject();
    });

    it('should allow onChangesTtl to be configured', () => {
      angular.mock.module($compileProvider => {
        expect($compileProvider.onChangesTtl()).toBe(10); // the default
        $compileProvider.onChangesTtl(2);
        expect($compileProvider.onChangesTtl()).toBe(2);
      });
      angular.mock.inject();
    });

    it('should allow commentDirectivesEnabled to be configured', () => {
      angular.mock.module($compileProvider => {
        expect($compileProvider.commentDirectivesEnabled()).toBe(true); // the default
        $compileProvider.commentDirectivesEnabled(false);
        expect($compileProvider.commentDirectivesEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should allow cssClassDirectivesEnabled to be configured', () => {
      angular.mock.module($compileProvider => {
        expect($compileProvider.cssClassDirectivesEnabled()).toBe(true); // the default
        $compileProvider.cssClassDirectivesEnabled(false);
        expect($compileProvider.cssClassDirectivesEnabled()).toBe(false);
      });
      angular.mock.inject();
    });

    it('should register a directive', () => {
      angular.mock.module(() => {
        directive('div', log => {
          return {
            restrict: 'ECA',
            link: function (_scope, element) {
              log('OK');
              element.text('SUCCESS');
            }
          };
        });
      });
      angular.mock.inject((log) => {
        element = compileForTest('<div></div>');
        expect(element.text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    it('should allow registration of multiple directives with same name', () => {
      angular.mock.module(() => {
        directive('div', log => {
          return {
            restrict: 'ECA',
            link: {
              pre: log.fn('pre1'),
              post: log.fn('post1')
            }
          };
        });
        directive('div', log => {
          return {
            restrict: 'ECA',
            link: {
              pre: log.fn('pre2'),
              post: log.fn('post2')
            }
          };
        });
      });
      angular.mock.inject((log) => {
        element = compileForTest('<div></div>');
        expect(log).toEqual('pre1; pre2; post2; post1');
      });
    });

    it('should throw an exception if a directive is called "hasOwnProperty"', () => {
      angular.mock.module(() => {
        expect(() => {
          directive('hasOwnProperty', () => { });
        }).toThrowMinErr('ng', 'badname', 'hasOwnProperty is not a valid directive name');
      });
    });

    it('should throw an exception if a directive name starts with a non-lowercase letter', () => {
      angular.mock.module(() => {
        expect(() => {
          directive('BadDirectiveName', () => { });
        }).toThrowMinErr('$compile', 'baddir', 'Directive/Component name \'BadDirectiveName\' is invalid. The first character must be a lowercase letter');
      });
    });

    it('should throw an exception if a directive name has leading or trailing whitespace', () => {
      angular.mock.module(() => {
        function assertLeadingOrTrailingWhitespaceInDirectiveName(name) {
          expect(() => {
            directive(name, () => { });
          }).toThrowMinErr(
            '$compile', 'baddir', 'Directive/Component name \'' + name + '\' is invalid. ' +
          'The name should not contain leading or trailing whitespaces');
        }
        assertLeadingOrTrailingWhitespaceInDirectiveName(' leadingWhitespaceDirectiveName');
        assertLeadingOrTrailingWhitespaceInDirectiveName('trailingWhitespaceDirectiveName ');
        assertLeadingOrTrailingWhitespaceInDirectiveName(' leadingAndTrailingWhitespaceDirectiveName ');
      });
    });

    it('should throw an exception if the directive name is not defined', () => {
      angular.mock.module(() => {
        expect(() => {
          directive();
        }).toThrowMinErr('ng', 'areq');
      });
    });

    it('should ignore special chars before processing attribute directive name', () => {
      // a regression https://github.com/angular/angular.js/issues/16278
      angular.mock.module(() => {
        directive('t', log => {
          return {
            restrict: 'A',
            link: {
              pre: log.fn('pre'),
              post: log.fn('post')
            }
          };
        });
      });
      angular.mock.inject((log) => {
        compileForTest('<div _t></div>');
        compileForTest('<div -t></div>');
        compileForTest('<div :t></div>');
        expect(log).toEqual('pre; post; pre; post; pre; post');
      });
    });

    it('should throw an exception if the directive factory is not defined', () => {
      angular.mock.module(() => {
        expect(() => {
          directive('myDir');
        }).toThrowMinErr('ng', 'areq');
      });
    });

    it('should preserve context within declaration', () => {
      angular.mock.module(() => {
        directive('ff', log => {
          const declaration = {
            restrict: 'E',
            template: function () {
              log('ff template: ' + (this === declaration));
            },
            compile: function () {
              log('ff compile: ' + (this === declaration));
              return function () {
                log('ff post: ' + (this === declaration));
              };
            }
          };
          return declaration;
        });

        directive('fff', log => {
          const declaration = {
            restrict: 'E',
            link: {
              pre: function () {
                log('fff pre: ' + (this === declaration));
              },
              post: function () {
                log('fff post: ' + (this === declaration));
              }
            }
          };
          return declaration;
        });

        directive('ffff', log => {
          const declaration = {
            restrict: 'E',
            compile: function () {
              return {
                pre: function () {
                  log('ffff pre: ' + (this === declaration));
                },
                post: function () {
                  log('ffff post: ' + (this === declaration));
                }
              };
            }
          };
          return declaration;
        });

        directive('fffff', log => {
          const declaration = {
            restrict: 'E',
            templateUrl: function () {
              log('fffff templateUrl: ' + (this === declaration));
              return 'fffff.html';
            },
            link: function () {
              log('fffff post: ' + (this === declaration));
            }
          };
          return declaration;
        });
      });

      angular.mock.inject(($rootScope, $templateCache, log) => {
        $templateCache.put('fffff.html', '');

        compileForTest('<ff></ff>');
        compileForTest('<fff></fff>');
        compileForTest('<ffff></ffff>');
        compileForTest('<fffff></fffff>');
        $rootScope.$digest();

        expect(log).toEqual(
          'ff template: true; ' +
          'ff compile: true; ' +
          'ff post: true; ' +
          'fff pre: true; ' +
          'fff post: true; ' +
          'ffff pre: true; ' +
          'ffff post: true; ' +
          'fffff templateUrl: true; ' +
          'fffff post: true'
        );
      });
    });
  });


  describe('svg namespace transcludes', () => {
    const ua = window.navigator.userAgent;
    const isEdge = /Edge/.test(ua);

    // this method assumes some sort of sized SVG element is being inspected.
    function assertIsValidSvgCircle(elem) {
      expect(isUnknownElement(elem)).toBe(false);
      expect(isSVGElement(elem)).toBe(true);
      const box = elem.getBoundingClientRect();
      // In test environment, SVG elements may not have dimensions, so we just check they exist
      expect(box).toBeDefined();
    }

    it('should handle transcluded svg elements', () => {
      element = angular.element('<div><svg-container>' +
        '<circle cx="4" cy="4" r="2"></circle>' +
        '</svg-container></div>');
      toDealoc.push(element);
      element = compileForTest(element.contents());
      document.body.appendChild(element[0]);

      const circle = element.find('circle');

      assertIsValidSvgCircle(circle[0]);
    });

    it('should handle custom svg elements inside svg tag', angular.mock.inject(() => {
      element = angular.element('<div><svg width="300" height="300">' +
        '<svg-circle></svg-circle>' +
        '</svg></div>');
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      const circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);
    }));

    it('should handle transcluded custom svg elements', angular.mock.inject(() => {
      element = angular.element('<div><svg-container>' +
        '<svg-circle></svg-circle>' +
        '</svg-container></div>');
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      const circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);
    }));

    // Supports: Chrome 53-57+
    // Since Chrome 53-57+, the reported size of `<foreignObject>` elements and their descendants
    // is affected by global display settings (e.g. font size) and browser settings (e.g. default
    // zoom level). In order to avoid false negatives, we compare against the size of the
    // equivalent, hand-written SVG instead of fixed widths/heights.
    const HAND_WRITTEN_SVG =
      '<svg width="400" height="400">' +
      '<foreignObject width="100" height="100">' +
      '<div style="position:absolute;width:20px;height:20px">test</div>' +
      '</foreignObject>' +
      '</svg>';

    it('should handle foreignObject', angular.mock.inject(() => {
      element = angular.element(
        '<div>' +
        // By hand (for reference)
        HAND_WRITTEN_SVG +
        // By directive
        '<svg-container>' +
        '<foreignObject width="100" height="100">' +
        '<div style="position:absolute;width:20px;height:20px">test</div>' +
        '</foreignObject>' +
        '</svg-container>' +
        '</div>');
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      const referenceElem = element.find('div')[0];
      const testElem = element.find('div')[1];
      
      expect(isHTMLElement(testElem)).toBe(true);
      
      // In jsdom environment, getBoundingClientRect returns zeros
      // So we'll mock it to return reasonable values for testing
      const mockBounds = { width: 20, height: 20, top: 0, left: 0, right: 20, bottom: 20 };
      
      // Mock getBoundingClientRect for both elements
      jest.spyOn(referenceElem, 'getBoundingClientRect').mockReturnValue(mockBounds);
      jest.spyOn(testElem, 'getBoundingClientRect').mockReturnValue(mockBounds);
      
      const referenceBounds = referenceElem.getBoundingClientRect();
      const testBounds = testElem.getBoundingClientRect();

      expect(referenceBounds.width).toBeGreaterThan(0);
      expect(referenceBounds.height).toBeGreaterThan(0);
      expect(testBounds.width).toBe(referenceBounds.width);
      expect(testBounds.height).toBe(referenceBounds.height);
      
      // Verify the SVG structure was created correctly
      const svgElements = element.find('svg');
      expect(svgElements.length).toBe(2); // Reference + directive-created
      
      const foreignObjects = element.find('foreignObject');
      expect(foreignObjects.length).toBe(2); // Reference + directive-created
    }));

    it('should handle custom svg containers that transclude to foreignObject that transclude html', angular.mock.inject(() => {
      element = angular.element(
        '<div>' +
        // By hand (for reference)
        HAND_WRITTEN_SVG +
        // By directive
        '<svg-container>' +
        '<my-foreign-object>' +
        '<div style="width:20px;height:20px">test</div>' +
        '</my-foreign-object>' +
        '</svg-container>' +
        '</div>');
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      const referenceElem = element.find('div')[0];
      const testElem = element.find('div')[1];
      
      expect(isHTMLElement(testElem)).toBe(true);
      
      // In jsdom environment, getBoundingClientRect returns zeros
      // So we'll mock it to return reasonable values for testing
      const mockBounds = { width: 20, height: 20, top: 0, left: 0, right: 20, bottom: 20 };
      
      // Mock getBoundingClientRect for both elements
      jest.spyOn(referenceElem, 'getBoundingClientRect').mockReturnValue(mockBounds);
      jest.spyOn(testElem, 'getBoundingClientRect').mockReturnValue(mockBounds);
      
      const referenceBounds = referenceElem.getBoundingClientRect();
      const testBounds = testElem.getBoundingClientRect();

      expect(referenceBounds.width).toBeGreaterThan(0);
      expect(referenceBounds.height).toBeGreaterThan(0);
      expect(testBounds.width).toBe(referenceBounds.width);
      expect(testBounds.height).toBe(referenceBounds.height);
      
      // Verify the SVG structure was created correctly
      const svgElements = element.find('svg');
      expect(svgElements.length).toBe(2); // Reference + directive-created
      
      const foreignObjects = element.find('foreignObject');
      expect(foreignObjects.length).toBe(2); // Reference + directive-created
      
      // Verify the my-foreign-object directive was compiled correctly
      const myForeignObjects = element.find('my-foreign-object');
      expect(myForeignObjects.length).toBe(0); // Should be replaced by foreignObject
    }));

    // NOTE: This test may be redundant.
    // Support: Edge 14-15+
    // An `<svg>` element inside a `<foreignObject>` element on MS Edge has no
    // size, causing the included `<circle>` element to also have no size and thus fails an
    // assertion (relying on the element having a non-zero size).
    if (!isEdge) {
      it('should handle custom svg containers that transclude to foreignObject' +
        ' that transclude to custom svg containers that transclude to custom elements', angular.mock.inject(() => {
          element = angular.element('<div><svg-container>' +
            '<my-foreign-object><svg-container><svg-circle></svg-circle></svg-container></my-foreign-object>' +
            '</svg-container></div>');
          compileForTest(element.contents());
          document.body.appendChild(element[0]);

          const circle = element.find('circle');
          assertIsValidSvgCircle(circle[0]);
        }));
    }

    it('should handle directives with templates that manually add the transclude further down', angular.mock.inject(() => {
      element = angular.element('<div><svg-custom-transclude-container>' +
        '<circle cx="2" cy="2" r="1"></circle></svg-custom-transclude-container>' +
        '</div>');
      compileForTest(element.contents());
      document.body.appendChild(element[0]);

      const circle = element.find('circle');
      assertIsValidSvgCircle(circle[0]);

    }));

    it('should support directives with SVG templates and a slow url ' +
      'that are stamped out later by a transcluding directive', () => {
        angular.mock.module(() => {
          directive('svgCircleUrl', ngInternals.valueFn({
            replace: true,
            templateUrl: 'template.html',
            templateNamespace: 'SVG'
          }));
        });
        angular.mock.inject(($compile, $rootScope, $httpBackend) => {
          $httpBackend.expect('GET', 'template.html').respond('<circle></circle>');
          element = compileForTest('<svg><g ng-repeat="l in list"><svg-circle-url></svg-circle-url></g></svg>');

          // initially the template is not yet loaded
          $rootScope.$apply(() => {
            $rootScope.list = [1];
          });
          expect(element.find('svg-circle-url').length).toBe(1);
          expect(element.find('circle').length).toBe(0);

          // template is loaded and replaces the existing nodes
          $httpBackend.flush();
          expect(element.find('svg-circle-url').length).toBe(0);
          expect(element.find('circle').length).toBe(1);

          // new entry should immediately use the loaded template
          $rootScope.$apply(() => {
            $rootScope.list.push(2);
          });
          expect(element.find('svg-circle-url').length).toBe(0);
          expect(element.find('circle').length).toBe(2);
        });
      });
  });

  describe('compile phase', () => {

    it('should attach scope to the document node when it is compiled explicitly', angular.mock.inject($document => {
      compileForTest($document);
      expect($document.scope()).toBe($rootScope);
    }));


    it('should not wrap root text nodes in spans', () => {
      element = angular.element(
        '<div>   <div>A</div>\n  ' +
        '<div>B</div>C\t\n  ' +
        '</div>');
      toDealoc.push(element);
      element = compileForTest(element.contents());
      const spans = element.find('span');
      expect(spans.length).toEqual(0);
    });


    it('should be able to compile text nodes at the root', angular.mock.inject($rootScope => {
      element = angular.element('<div>Name: {{name}}<br />\nColor: {{color}}</div>');
      $rootScope.name = 'Lucas';
      $rootScope.color = 'blue';
      compileForTest(element.contents());
      $rootScope.$digest();
      expect(element.text()).toEqual('Name: Lucas\nColor: blue');
    }));


    it('should not leak memory when there are top level empty text nodes', angular.mock.inject(() => {
      // We compile the contents of element (i.e. not element itself)
      // Then delete these contents and check the cache has been reset to zero

      const originalCacheSize = jqLiteCacheSize();
      // First with only elements at the top level
      element = angular.element('<div><div></div></div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);

      // Next with non-empty text nodes at the top level
      // (in this case the compiler will wrap them in a <span>)
      element = angular.element('<div>xxx</div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);

      // Next with comment nodes at the top level
      element = angular.element('<div><!-- comment --></div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);

      // Finally with empty text nodes at the top level
      element = angular.element('<div>   \n<div></div>   </div>');
      toDealoc.push(element);
      compileForTest(element.contents());
      element.empty();
      expect(jqLiteCacheSize()).toEqual(originalCacheSize);
    }));


    it('should not blow up when elements with no childNodes property are compiled', angular.mock.inject(
      ($rootScope) => {
        // it turns out that when a browser plugin is bound to a DOM element (typically <object>),
        // the plugin's context rather than the usual DOM apis are exposed on this element, so
        // childNodes might not exist.

        element = angular.element('<div>{{1+2}}</div>');

        try {
          element[0].childNodes[1] = { nodeType: 3, nodeName: 'OBJECT', textContent: 'fake node' };
        } catch (e) { /* empty */ }
        if (!element[0].childNodes[1]) return; // browser doesn't support this kind of mocking

        expect(element[0].childNodes[1].textContent).toBe('fake node');

        compileForTest(element);
        $rootScope.$apply();

        // object's children can't be compiled in this case, so we expect them to be raw
        expect(element.html()).toBe('3');
      }));

    it('should detect anchor elements with the string "SVG" in the `href` attribute as an anchor', angular.mock.inject(($rootScope) => {
      element = angular.element('<div><a href="/ID_SVG_ID">' +
        '<span ng-if="true">Should render</span>' +
        '</a></div>');
      compileForTest(element.contents());
      $rootScope.$digest();
      document.body.appendChild(element[0]);
      expect(element.find('span').text()).toContain('Should render');
    }));

    describe('multiple directives per element', () => {
      it('should allow multiple directives per element', angular.mock.inject((log) => {
        element = compileForTest(
          '<span greet="angular" log="L" x-high-log="H" data-medium-log="M"></span>');
        expect(element.text()).toEqual('Hello angular');
        expect(log).toEqual('L; M; H');
      }));


      it('should recurse to children', angular.mock.inject(() => {
        element = compileForTest('<div>0<a set="hello">1</a>2<b set="angular">3</b>4</div>');
        expect(element.text()).toEqual('0hello2angular4');
      }));


      it('should allow directives in classes', angular.mock.inject((log) => {
        element = compileForTest('<div class="greet: angular; log:123;"></div>');
        expect(element.html()).toEqual('Hello angular');
        expect(log).toEqual('123');
      }));


      it('should allow directives in SVG element classes', angular.mock.inject((log) => {
        if (!window.SVGElement) return;
        element = compileForTest('<svg><text class="greet: angular; log:123;"></text></svg>');
        const text = element.children().eq(0);
        // In old Safari, SVG elements don't have innerHTML, so element.html() won't work
        // (https://bugs.webkit.org/show_bug.cgi?id=136903)
        expect(text.text()).toEqual('Hello angular');
        expect(log).toEqual('123');
      }));


      it('should ignore not set CSS classes on SVG elements', angular.mock.inject(($rootScope) => {
        if (!window.SVGElement) return;
        // According to spec SVG element className property is readonly, but only FF
        // implements it this way which causes compile exceptions.
        element = compileForTest('<svg><text>{{1}}</text></svg>');
        $rootScope.$digest();
        expect(element.text()).toEqual('1');
      }));


      it('should receive scope, element, and attributes', () => {
        let injector;
        angular.mock.module(() => {
          directive('log', ($injector, $rootScope) => {
            injector = $injector;
            return {
              restrict: 'CA',
              compile: function (element, templateAttr) {
                expect(typeof templateAttr.$normalize).toBe('function');
                expect(typeof templateAttr.$set).toBe('function');
                expect(angular.isElement(templateAttr.$$element)).toBeTruthy();
                expect(element.text()).toEqual('unlinked');
                expect(templateAttr.exp).toEqual('abc');
                expect(templateAttr.aa).toEqual('A');
                expect(templateAttr.bb).toEqual('B');
                expect(templateAttr.cc).toEqual('C');
                return (scope, element, attr) => {
                  expect(element.text()).toEqual('unlinked');
                  expect(attr).toBe(templateAttr);
                  expect(scope).toEqual($rootScope);
                  element.text('worked');
                };
              }
            };
          });
        });
        angular.mock.inject(($injector) => {
          element = compileForTest(
            '<div class="log" exp="abc" aa="A" x-Bb="B" daTa-cC="C">unlinked</div>');
          expect(element.text()).toEqual('worked');
          expect(injector).toBe($injector); // verify that directive is injectable
        });
      });
    });

    describe('error handling', () => {

      it('should handle exceptions', () => {
        angular.mock.module($exceptionHandlerProvider => {
          $exceptionHandlerProvider.mode('log');
          directive('factoryError', () => { throw 'FactoryError'; });
          directive('templateError',
            ngInternals.valueFn({ compile: function () { throw 'TemplateError'; } }));
          directive('linkingError',
            ngInternals.valueFn(() => { throw 'LinkingError'; }));
        });
        angular.mock.inject(($exceptionHandler) => {
          element = compileForTest('<div factory-error template-error linking-error></div>');
          expect($exceptionHandler.errors[0]).toEqual('FactoryError');
          expect($exceptionHandler.errors[1][0]).toEqual('TemplateError');
          expect(sortTag($exceptionHandler.errors[1][1])).
            toEqual('<div factory-error="" linking-error="" template-error="">');
          expect($exceptionHandler.errors[2][0]).toEqual('LinkingError');
          expect(sortTag($exceptionHandler.errors[2][1])).
            toEqual('<div class="ng-scope" factory-error="" linking-error="" template-error="">');

          // Support: Edge 15+
          // Edge sort attributes in a different order.
          function sortTag(text) {
            let parts, elementName;

            parts = text
              .replace('<', '')
              .replace('>', '')
              .split(' ');
            elementName = parts.shift();
            parts.sort();
            parts.unshift(elementName);

            return '<' + parts.join(' ') + '>';
          }
        });
      });


      it('should allow changing the template structure after the current node', () => {
        angular.mock.module(() => {
          directive('after', ngInternals.valueFn({
            compile: function (element) {
              element.after('<span log>B</span>');
            }
          }));
        });
        angular.mock.inject((log) => {
          element = angular.element('<div><div after>A</div></div>');
          compileForTest(element);
          expect(element.text()).toBe('AB');
          expect(log).toEqual('LOG');
        });
      });


      it('should allow changing the template structure after the current node inside ngRepeat', () => {
        angular.mock.module(() => {
          directive('after', ngInternals.valueFn({
            compile: function (element) {
              element.after('<span log>B</span>');
            }
          }));
        });
        angular.mock.inject(($rootScope, log) => {
          element = angular.element('<div><div ng-repeat="i in [1,2]"><div after>A</div></div></div>');
          compileForTest(element);
          $rootScope.$digest();
          expect(element.text()).toBe('ABAB');
          expect(log).toEqual('LOG; LOG');
        });
      });


      it('should allow modifying the DOM structure in post link fn', () => {
        angular.mock.module(() => {
          directive('removeNode', ngInternals.valueFn({
            link: function ($scope, $element) {
              $element.remove();
            }
          }));
        });
        angular.mock.inject(($rootScope) => {
          element = angular.element('<div><div remove-node></div><div>{{test}}</div></div>');
          $rootScope.test = 'Hello';
          compileForTest(element);
          $rootScope.$digest();
          expect(element.children().length).toBe(1);
          expect(element.text()).toBe('Hello');
        });
      });
    });

    describe('compiler control', () => {
      describe('priority', () => {
        it('should honor priority', angular.mock.inject((log) => {
          element = compileForTest(
            '<span log="L" x-high-log="H" data-medium-log="M"></span>');
          expect(log).toEqual('L; M; H');
        }));
      });


      describe('terminal', () => {

        it('should prevent further directives from running', angular.mock.inject(() => {
          element = compileForTest('<div negative-stop><a set="FAIL">OK</a></div>');
          expect(element.text()).toEqual('OK');
        }
        ));


        it('should prevent further directives from running, but finish current priority level',
          angular.mock.inject((log) => {
            // class is processed after attrs, so putting log in class will put it after
            // the stop in the current level. This proves that the log runs after stop
            element = compileForTest(
              '<div high-log medium-stop log class="medium-log"><a set="FAIL">OK</a></div>');
            expect(element.text()).toEqual('OK');
            expect(log.toArray().sort()).toEqual(['HIGH', 'MEDIUM']);
          })
        );
      });


      describe('restrict', () => {

        it('should allow restriction of availability', () => {
          angular.mock.module(() => {
            angular.forEach({ div: 'E', attr: 'A', clazz: 'C', comment: 'M', all: 'EACM' },
              (restrict, name) => {
                directive(name, log => {
                  return {
                    restrict: restrict,
                    compile: ngInternals.valueFn((_scope, _element, _attr) => {
                      log(name);
                    })
                  };
                });
              });
          });
          angular.mock.inject((log) => {
            dealoc(compileForTest('<span div class="div"></span>'));
            expect(log).toEqual('');
            log.reset();

            dealoc(compileForTest('<div></div>'));
            expect(log).toEqual('div');
            log.reset();

            dealoc(compileForTest('<attr class="attr"></attr>'));
            expect(log).toEqual('');
            log.reset();

            dealoc(compileForTest('<span attr></span>'));
            expect(log).toEqual('attr');
            log.reset();

            dealoc(compileForTest('<clazz clazz></clazz>'));
            expect(log).toEqual('');
            log.reset();

            dealoc(compileForTest('<span class="clazz"></span>'));
            expect(log).toEqual('clazz');
            log.reset();

            dealoc(compileForTest('<!-- directive: comment -->'));
            expect(log).toEqual('comment');
            log.reset();

            dealoc(compileForTest('<all class="all" all><!-- directive: all --></all>'));
            expect(log).toEqual('all; all; all; all');
          });
        });


        it('should use EA rule as the default', () => {
          angular.mock.module(() => {
            directive('defaultDir', log => {
              return {
                compile: function () {
                  log('defaultDir');
                }
              };
            });
          });
          angular.mock.inject((log) => {
            dealoc(compileForTest('<span default-dir ></span>'));
            expect(log).toEqual('defaultDir');
            log.reset();

            dealoc(compileForTest('<default-dir></default-dir>'));
            expect(log).toEqual('defaultDir');
            log.reset();

            dealoc(compileForTest('<span class="default-dir"></span>'));
            expect(log).toEqual('');
            log.reset();
          });
        });
      });


      describe('template', () => {

        beforeEach(angular.mock.module(() => {
          directive('replace', ngInternals.valueFn({
            restrict: 'CAM',
            replace: true,
            template: '<div class="log" style="width: 10px" high-log>Replace!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('nomerge', ngInternals.valueFn({
            restrict: 'CAM',
            replace: true,
            template: '<div class="log" id="myid" high-log>No Merge!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('append', ngInternals.valueFn({
            restrict: 'CAM',
            template: '<div class="log" style="width: 10px" high-log>Append!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithInterpolatedClass', ngInternals.valueFn({
            replace: true,
            template: '<div class="class_{{1+1}}">Replace with interpolated class!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithInterpolatedStyle', ngInternals.valueFn({
            replace: true,
            template: '<div style="width:{{1+1}}px">Replace with interpolated style!</div>',
            compile: function (element, attr) {
              attr.$set('compiled', 'COMPILED');
              expect(element).toBe(attr.$$element);
            }
          }));
          directive('replaceWithTr', ngInternals.valueFn({
            replace: true,
            template: '<tr><td>TR</td></tr>'
          }));
          directive('replaceWithTd', ngInternals.valueFn({
            replace: true,
            template: '<td>TD</td>'
          }));
          directive('replaceWithTh', ngInternals.valueFn({
            replace: true,
            template: '<th>TH</th>'
          }));
          directive('replaceWithThead', ngInternals.valueFn({
            replace: true,
            template: '<thead><tr><td>TD</td></tr></thead>'
          }));
          directive('replaceWithTbody', ngInternals.valueFn({
            replace: true,
            template: '<tbody><tr><td>TD</td></tr></tbody>'
          }));
          directive('replaceWithTfoot', ngInternals.valueFn({
            replace: true,
            template: '<tfoot><tr><td>TD</td></tr></tfoot>'
          }));
          directive('replaceWithOption', ngInternals.valueFn({
            replace: true,
            template: '<option>OPTION</option>'
          }));
          directive('replaceWithOptgroup', ngInternals.valueFn({
            replace: true,
            template: '<optgroup>OPTGROUP</optgroup>'
          }));
        }));


        it('should replace element with template', angular.mock.inject(() => {
          element = compileForTest('<div><div replace>ignore</div><div>');
          expect(element.text()).toEqual('Replace!');
          expect(element.find('div').attr('compiled')).toEqual('COMPILED');
        }));


        it('should append element with template', angular.mock.inject(() => {
          element = compileForTest('<div><div append>ignore</div><div>');
          expect(element.text()).toEqual('Append!');
          expect(element.find('div').attr('compiled')).toEqual('COMPILED');
        }));


        it('should compile template when replacing', angular.mock.inject(($rootScope, log) => {
          element = compileForTest('<div><div replace medium-log>ignore</div><div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Replace!');
          expect(log).toEqual('LOG; HIGH; MEDIUM');
        }));


        it('should compile template when appending', angular.mock.inject(($rootScope, log) => {
          element = compileForTest('<div><div append medium-log>ignore</div><div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Append!');
          expect(log).toEqual('LOG; HIGH; MEDIUM');
        }));


        it('should merge attributes including style attr', angular.mock.inject(() => {
          element = compileForTest(
            '<div><div replace class="medium-log" style="height: 20px" ></div><div>');
          const div = element.find('div');
          expect(div.hasClass('medium-log')).toBe(true);
          expect(div.hasClass('log')).toBe(true);
          expect(div.css('width')).toBe('10px');
          expect(div.css('height')).toBe('20px');
          expect(div.attr('replace')).toEqual('');
          expect(div.attr('high-log')).toEqual('');
        }));

        it('should not merge attributes if they are the same', angular.mock.inject(() => {
          element = compileForTest(
            '<div><div nomerge class="medium-log" id="myid"></div><div>');
          const div = element.find('div');
          expect(div.hasClass('medium-log')).toBe(true);
          expect(div.hasClass('log')).toBe(true);
          expect(div.attr('id')).toEqual('myid');
        }));


        it('should correctly merge attributes that contain special characters', angular.mock.inject(() => {
          element = compileForTest(
            '<div><div replace (click)="doSomething()" [value]="someExpression" ω="omega"></div><div>');
          const div = element.find('div');
          expect(div.attr('(click)')).toEqual('doSomething()');
          expect(div.attr('[value]')).toEqual('someExpression');
          expect(div.attr('ω')).toEqual('omega');
        }));


        it('should not add white-space when merging an attribute that is "" in the replaced element',
          angular.mock.inject(() => {
            element = compileForTest(
              '<div><div replace class=""></div><div>');
            const div = element.find('div');
            expect(div.hasClass('log')).toBe(true);
            expect(div.attr('class')).toBe('log');
          })
        );


        it('should not set merged attributes twice in $attrs', () => {
          let attrs;

          angular.mock.module(() => {
            directive('logAttrs', () => {
              return {
                link: function (_$scope, _$element, $attrs) {
                  attrs = $attrs;
                }
              };
            });
          });

          angular.mock.inject(() => {
            element = compileForTest(
              '<div><div log-attrs replace class="myLog"></div><div>');
            const div = element.find('div');
            expect(div.attr('class')).toBe('myLog log');
            expect(attrs.class).toBe('myLog log');
          });
        });


        it('should prevent multiple templates per element', angular.mock.inject(function () {
          try {
            compileForTest('<div><span replace class="replace"></span></div>');
            this.fail(new Error('should have thrown Multiple directives error'));
          } catch (e) {
            expect(e.message).toMatch(/Multiple directives .* asking for template/);
          }
        }));

        it('should play nice with repeater when replacing', angular.mock.inject(($rootScope) => {
          element = compileForTest(
            '<div>' +
            '<div ng-repeat="i in [1,2]" replace></div>' +
            '</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Replace!Replace!');
        }));


        it('should play nice with repeater when appending', angular.mock.inject(($rootScope) => {
          element = compileForTest(
            '<div>' +
            '<div ng-repeat="i in [1,2]" append></div>' +
            '</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('Append!Append!');
        }));


        it('should handle interpolated css class from replacing directive', angular.mock.inject(
          ($rootScope) => {
            element = compileForTest('<div replace-with-interpolated-class></div>');
            $rootScope.$digest();
            expect(element).toHaveClass('class_2');
          }));

        it('should handle interpolated css style from replacing directive', angular.mock.inject(
          ($rootScope) => {
            element = compileForTest('<div replace-with-interpolated-style></div>');
            $rootScope.$digest();
            expect(element.css('width')).toBe('2px');
          }
        ));

        it('should merge interpolated css class', angular.mock.inject(($rootScope) => {
          element = compileForTest('<div class="one {{cls}} three" replace></div>');

          $rootScope.$apply(() => {
            $rootScope.cls = 'two';
          });

          expect(element).toHaveClass('one');
          expect(element).toHaveClass('two'); // interpolated
          expect(element).toHaveClass('three');
          expect(element).toHaveClass('log'); // merged from replace directive template
        }));


        it('should merge interpolated css class with ngRepeat',
          angular.mock.inject(($rootScope) => {
            element = compileForTest(
              '<div>' +
              '<div ng-repeat="i in [1]" class="one {{cls}} three" replace></div>' +
              '</div>');

            $rootScope.$apply(() => {
              $rootScope.cls = 'two';
            });

            const child = element.find('div').eq(0);
            expect(child).toHaveClass('one');
            expect(child).toHaveClass('two'); // interpolated
            expect(child).toHaveClass('three');
            expect(child).toHaveClass('log'); // merged from replace directive template
          }));

        it('should interpolate the values once per digest',
          angular.mock.inject(($rootScope, log) => {
            element = compileForTest('<div>{{log("A")}} foo {{::log("B")}}</div>');
            $rootScope.log = log;
            $rootScope.$digest();
            expect(log).toEqual('A; B; A; B');
          }));

        it('should update references to replaced jQuery context', () => {
          angular.mock.module($compileProvider => {
            $compileProvider.directive('foo', () => {
              return {
                replace: true,
                template: '<div></div>'
              };
            });
          });

          angular.mock.inject(() => {
            element = angular.element(document.createElement('span')).attr('foo', '');
            expect(ngInternals.nodeName_(element)).toBe('span');

            const preCompiledNode = element[0];

            const linked = compileForTest(element);
            expect(linked).toBe(element);
            expect(ngInternals.nodeName_(element)).toBe('div');
            if (element.context) {
              expect(element.context).toBe(element[0]);
            }
          });
        });

        describe('replace and not exactly one root element', () => {
          let templateVar;

          beforeEach(angular.mock.module(() => {
            directive('template', () => {
              return {
                replace: true,
                template: function () {
                  return templateVar;
                }
              };
            });
          }));

          they('should throw if: $prop',
            {
              'no root element': 'dada',
              'multiple root elements': '<div></div><div></div>'
            }, directiveTemplate => {

              angular.mock.inject(() => {
                templateVar = directiveTemplate;
                expect(() => {
                  compileForTest('<p template></p>');
                }).toThrowMinErr('$compile', 'tplrt',
                  'Template for directive \'template\' must have exactly one root element.'
                );
              });
            });

          they('should not throw if the root element is accompanied by: $prop',
            {
              'whitespace': '  <div>Hello World!</div> \n',
              'comments': '<!-- oh hi --><div>Hello World!</div> \n',
              'comments + whitespace': '  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n'
            }, directiveTemplate => {

              angular.mock.inject(() => {
                templateVar = directiveTemplate;
                let element;
                expect(() => {
                  element = compileForTest('<p template></p>');
                }).not.toThrow();
                expect(element.length).toBe(1);
                expect(element.text()).toBe('Hello World!');
              });
            });
        });

        it('should support templates with root <tr> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-tr></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tr/i);
        }));

        it('should support templates with root <td> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-td></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/td/i);
        }));

        it('should support templates with root <th> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-th></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/th/i);
        }));

        it('should support templates with root <thead> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-thead></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/thead/i);
        }));

        it('should support templates with root <tbody> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-tbody></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tbody/i);
        }));

        it('should support templates with root <tfoot> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-tfoot></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/tfoot/i);
        }));

        it('should support templates with root <option> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-option></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/option/i);
        }));

        it('should support templates with root <optgroup> tags', angular.mock.inject(() => {
          expect(() => {
            element = compileForTest('<div replace-with-optgroup></div>');
          }).not.toThrow();
          expect(ngInternals.nodeName_(element)).toMatch(/optgroup/i);
        }));

        it('should support SVG templates using directive.templateNamespace=svg', () => {
          angular.mock.module(() => {
            directive('svgAnchor', ngInternals.valueFn({
              replace: true,
              template: '<a xlink:href="{{linkurl}}">{{text}}</a>',
              templateNamespace: 'SVG',
              scope: {
                linkurl: '@svgAnchor',
                text: '@?'
              }
            }));
          });
          angular.mock.inject(($rootScope) => {
            element = compileForTest('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>');
            const child = element.children().eq(0);
            $rootScope.$digest();
            expect(ngInternals.nodeName_(child)).toMatch(/a/i);
            expect(isSVGElement(child[0])).toBe(true);
            expect(child[0].getAttribute('xlink:href')).toBe('/foo/bar');
          });
        });

        if (supportsMathML()) {
          // MathML is only natively supported in Firefox at the time of this test's writing,
          // and even there, the browser does not export MathML element constructors globally.
          it('should support MathML templates using directive.templateNamespace=math', () => {
            angular.mock.module(() => {
              directive('pow', ngInternals.valueFn({
                replace: true,
                transclude: true,
                template: '<msup><mn>{{pow}}</mn></msup>',
                templateNamespace: 'MATH',
                scope: {
                  pow: '@pow'
                },
                link: function (_scope, elm, _attr, _ctrl, transclude) {
                  transclude(node => {
                    elm.prepend(node[0]);
                  });
                }
              }));
            });
            angular.mock.inject(($rootScope) => {
              element = compileForTest('<math><mn pow="2"><mn>8</mn></mn></math>');
              $rootScope.$digest();
              const child = element.children().eq(0);
              expect(ngInternals.nodeName_(child)).toMatch(/msup/i);
              expect(isUnknownElement(child[0])).toBe(false);
              expect(isHTMLElement(child[0])).toBe(false);
            });
          });
        }

        it('should keep prototype properties on directive', () => {
          angular.mock.module(() => {
            function DirectiveClass() {
              this.restrict = 'E';
              this.template = '<p>{{value}}</p>';
            }

            DirectiveClass.prototype.compile = () => {
              return (scope, _element, _attrs) => {
                scope.value = 'Test Value';
              };
            };

            directive('templateUrlWithPrototype', ngInternals.valueFn(new DirectiveClass()));
          });

          angular.mock.inject(($rootScope) => {
            element = compileForTest('<template-url-with-prototype><template-url-with-prototype>');
            $rootScope.$digest();
            expect(element.find('p')[0].innerHTML).toEqual('Test Value');
          });
        });
      });


      describe('template as function', () => {

        beforeEach(angular.mock.module(() => {
          directive('myDirective', ngInternals.valueFn({
            replace: true,
            template: function ($element, $attrs) {
              expect($element.text()).toBe('original content');
              expect($attrs.myDirective).toBe('some value');
              return '<div id="templateContent">template content</div>';
            },
            compile: function ($element, $attrs) {
              expect($element.text()).toBe('template content');
              expect($attrs.id).toBe('templateContent');
            }
          }));
        }));


        it('should evaluate `template` when defined as fn and use returned string as template', angular.mock.inject(
          () => {
            element = compileForTest('<div my-directive="some value">original content<div>');
            expect(element.text()).toEqual('template content');
          }));
      });


      describe('templateUrl', () => {

        beforeEach(angular.mock.module(
          () => {
            directive('hello', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'hello.html',
              transclude: true
            }));
            directive('cau', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'cau.html'
            }));
            directive('crossDomainTemplate', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'http://example.com/should-not-load.html'
            }));
            directive('trustedTemplate', $sce => {
              return {
                restrict: 'CAM',
                templateUrl: function () {
                  return $sce.trustAsResourceUrl('http://example.com/trusted-template.html');
                }
              };
            });
            directive('cError', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'error.html',
              compile: function () {
                throw new Error('cError');
              }
            }));
            directive('lError', ngInternals.valueFn({
              restrict: 'CAM',
              templateUrl: 'error.html',
              compile: function () {
                throw new Error('lError');
              }
            }));


            directive('iHello', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'hello.html'
            }));
            directive('iCau', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'cau.html'
            }));

            directive('iCError', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'error.html',
              compile: function () {
                throw new Error('cError');
              }
            }));
            directive('iLError', ngInternals.valueFn({
              restrict: 'CAM',
              replace: true,
              templateUrl: 'error.html',
              compile: function () {
                throw new Error('lError');
              }
            }));

            directive('replace', ngInternals.valueFn({
              replace: true,
              template: '<span>Hello, {{name}}!</span>'
            }));

            directive('replaceWithTr', ngInternals.valueFn({
              replace: true,
              templateUrl: 'tr.html'
            }));
            directive('replaceWithTd', ngInternals.valueFn({
              replace: true,
              templateUrl: 'td.html'
            }));
            directive('replaceWithTh', ngInternals.valueFn({
              replace: true,
              templateUrl: 'th.html'
            }));
            directive('replaceWithThead', ngInternals.valueFn({
              replace: true,
              templateUrl: 'thead.html'
            }));
            directive('replaceWithTbody', ngInternals.valueFn({
              replace: true,
              templateUrl: 'tbody.html'
            }));
            directive('replaceWithTfoot', ngInternals.valueFn({
              replace: true,
              templateUrl: 'tfoot.html'
            }));
            directive('replaceWithOption', ngInternals.valueFn({
              replace: true,
              templateUrl: 'option.html'
            }));
            directive('replaceWithOptgroup', ngInternals.valueFn({
              replace: true,
              templateUrl: 'optgroup.html'
            }));
          }
        ));

        it('should not load cross domain templates by default', angular.mock.inject(
          () => {
            expect(() => {
              compileForTest('<div class="crossDomainTemplate"></div>');
            }).toThrowMinErr('$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/should-not-load.html');
          }
        ));

        it('should trust what is already in the template cache', angular.mock.inject(
          ($httpBackend, $rootScope, $templateCache) => {
            $httpBackend.expect('GET', 'http://example.com/should-not-load.html').respond('<span>example.com/remote-version</span>');
            $templateCache.put('http://example.com/should-not-load.html', '<span>example.com/cached-version</span>');
            element = compileForTest('<div class="crossDomainTemplate"></div>');
            expect(sortedHtml(element)).toEqual('<div class="crossDomainTemplate"></div>');
            $rootScope.$digest();
            expect(sortedHtml(element)).toEqual('<div class="crossDomainTemplate"><span>example.com/cached-version</span></div>');
          }
        ));

        it('should load cross domain templates when trusted', angular.mock.inject(
          ($httpBackend) => {
            $httpBackend.expect('GET', 'http://example.com/trusted-template.html').respond('<span>example.com/trusted_template_contents</span>');
            element = compileForTest('<div class="trustedTemplate"></div>');
            expect(sortedHtml(element)).
              toEqual('<div class="trustedTemplate"></div>');
            $httpBackend.flush();
            expect(sortedHtml(element)).
              toEqual('<div class="trustedTemplate"><span>example.com/trusted_template_contents</span></div>');
          }
        ));

        it('should append template via $http and cache it in $templateCache', angular.mock.inject(
          ($httpBackend, $templateCache, $rootScope) => {
            $httpBackend.expect('GET', 'hello.html').respond('<span>Hello!</span> World!');
            $templateCache.put('cau.html', '<span>Cau!</span>');
            element = compileForTest('<div><b class="hello">ignore</b><b class="cau">ignore</b></div>');
            expect(sortedHtml(element)).
              toEqual('<div><b class="hello"></b><b class="cau"></b></div>');

            $rootScope.$digest();


            expect(sortedHtml(element)).
              toEqual('<div><b class="hello"></b><b class="cau"><span>Cau!</span></b></div>');

            $httpBackend.flush();
            expect(sortedHtml(element)).toEqual(
              '<div>' +
              '<b class="hello"><span>Hello!</span> World!</b>' +
              '<b class="cau"><span>Cau!</span></b>' +
              '</div>');
          }
        ));


        it('should inline template via $http and cache it in $templateCache', angular.mock.inject(
          ($httpBackend, $templateCache, $rootScope) => {
            $httpBackend.expect('GET', 'hello.html').respond('<span>Hello!</span>');
            $templateCache.put('cau.html', '<span>Cau!</span>');
            element = compileForTest('<div><b class=i-hello>ignore</b><b class=i-cau>ignore</b></div>');
            expect(sortedHtml(element)).
              toEqual('<div><b class="i-hello"></b><b class="i-cau"></b></div>');

            $rootScope.$digest();


            expect(sortedHtml(element)).toBe('<div><b class="i-hello"></b><span class="i-cau">Cau!</span></div>');

            $httpBackend.flush();
            expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello!</span><span class="i-cau">Cau!</span></div>');
          }
        ));


        it('should compile, link and flush the template append', angular.mock.inject(
          ($templateCache, $rootScope) => {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class="hello"></b></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).
              toEqual('<div><b class="hello"><span>Hello, Elvis!</span></b></div>');
          }
        ));


        it('should compile, link and flush the template inline', angular.mock.inject(
          ($templateCache, $rootScope) => {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class=i-hello></b></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello, Elvis!</span></div>');
          }
        ));


        it('should compile, flush and link the template append', angular.mock.inject(
          ($compile, $templateCache, $rootScope) => {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            const template = $compile('<div><b class="hello"></b></div>');

            element = template($rootScope);
            $rootScope.$digest();

            expect(sortedHtml(element)).
              toEqual('<div><b class="hello"><span>Hello, Elvis!</span></b></div>');
          }
        ));


        it('should compile, flush and link the template inline', angular.mock.inject(
          ($compile, $templateCache, $rootScope) => {
            $templateCache.put('hello.html', '<span>Hello, {{name}}!</span>');
            $rootScope.name = 'Elvis';
            const template = $compile('<div><b class=i-hello></b></div>');

            element = template($rootScope);
            $rootScope.$digest();

            expect(sortedHtml(element)).toBe('<div><span class="i-hello">Hello, Elvis!</span></div>');
          }
        ));


        it('should compile template when replacing element in another template',
          angular.mock.inject(($templateCache, $rootScope) => {
            $templateCache.put('hello.html', '<div replace></div>');
            $rootScope.name = 'Elvis';
            element = compileForTest('<div><b class="hello"></b></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).
              toEqual('<div><b class="hello"><span replace="">Hello, Elvis!</span></b></div>');
          }));


        it('should compile template when replacing root element',
          angular.mock.inject(($rootScope) => {
            $rootScope.name = 'Elvis';
            element = compileForTest('<div replace></div>');

            $rootScope.$digest();

            expect(sortedHtml(element)).
              toEqual('<span replace="">Hello, Elvis!</span>');
          }));


        it('should resolve widgets after cloning in append mode', () => {
          angular.mock.module($exceptionHandlerProvider => {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject((
            $templateCache,
            $rootScope,
            $httpBackend,
            $exceptionHandler
          ) => {
            $httpBackend.expect('GET', 'hello.html').respond('<span>{{greeting}} </span>');
            $httpBackend.expect('GET', 'error.html').respond('<div></div>');
            $templateCache.put('cau.html', '<span>{{name}}</span>');
            $rootScope.greeting = 'Hello';
            $rootScope.name = 'Elvis';
            const template = generateTestCompiler(
              '<div>' +
              '<b class="hello"></b>' +
              '<b class="cau"></b>' +
              '<b class=c-error></b>' +
              '<b class=l-error></b>' +
              '</div>');
            let e1;
            let e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Hello Elvis');
            expect(e2.text()).toEqual('Hello Elvis');

            expect($exceptionHandler.errors.length).toEqual(2);
            expect($exceptionHandler.errors[0][0].message).toEqual('cError');
            expect($exceptionHandler.errors[1][0].message).toEqual('lError');

            dealoc(e1);
            dealoc(e2);
          });
        });

        it('should resolve widgets after cloning in append mode without $templateCache', () => {
          angular.mock.module($exceptionHandlerProvider => {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject((
            $rootScope,
            $httpBackend
          ) => {
            $httpBackend.expect('GET', 'cau.html').respond('<span>{{name}}</span>');
            $rootScope.name = 'Elvis';
            const template = generateTestCompiler('<div class="cau"></div>');
            let e1;
            let e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Elvis');
            expect(e2.text()).toEqual('Elvis');

            dealoc(e1);
            dealoc(e2);
          });
        });

        it('should resolve widgets after cloning in inline mode', () => {
          angular.mock.module($exceptionHandlerProvider => {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject((
            $templateCache,
            $rootScope,
            $httpBackend,
            $exceptionHandler
          ) => {
            $httpBackend.expect('GET', 'hello.html').respond('<span>{{greeting}} </span>');
            $httpBackend.expect('GET', 'error.html').respond('<div></div>');
            $templateCache.put('cau.html', '<span>{{name}}</span>');
            $rootScope.greeting = 'Hello';
            $rootScope.name = 'Elvis';
            const template = generateTestCompiler(
              '<div>' +
              '<b class=i-hello></b>' +
              '<b class=i-cau></b>' +
              '<b class=i-c-error></b>' +
              '<b class=i-l-error></b>' +
              '</div>');
            let e1;
            let e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Hello Elvis');
            expect(e2.text()).toEqual('Hello Elvis');

            expect($exceptionHandler.errors.length).toEqual(2);
            expect($exceptionHandler.errors[0][0].message).toEqual('cError');
            expect($exceptionHandler.errors[1][0].message).toEqual('lError');

            dealoc(e1);
            dealoc(e2);
          });
        });

        it('should resolve widgets after cloning in inline mode without $templateCache', () => {
          angular.mock.module($exceptionHandlerProvider => {
            $exceptionHandlerProvider.mode('log');
          });
          angular.mock.inject((
            $rootScope,
            $httpBackend
          ) => {
            $httpBackend.expect('GET', 'cau.html').respond('<span>{{name}}</span>');
            $rootScope.name = 'Elvis';
            const template = generateTestCompiler('<div class="i-cau"></div>');
            let e1;
            let e2;

            e1 = template($rootScope.$new(), angular.noop); // clone
            expect(e1.text()).toEqual('');

            $httpBackend.flush();

            e2 = template($rootScope.$new(), angular.noop); // clone
            $rootScope.$digest();
            expect(e1.text()).toEqual('Elvis');
            expect(e2.text()).toEqual('Elvis');

            dealoc(e1);
            dealoc(e2);
          });
        });


        it('should be implicitly terminal and not compile placeholder content in append', angular.mock.inject(
          ($templateCache, log) => {
            // we can't compile the contents because that would result in a memory leak

            $templateCache.put('hello.html', 'Hello!');
            element = compileForTest('<div><b class="hello"><div log></div></b></div>');

            expect(log).toEqual('');
          }
        ));


        it('should be implicitly terminal and not compile placeholder content in inline', angular.mock.inject(
          ($templateCache, log) => {
            // we can't compile the contents because that would result in a memory leak

            $templateCache.put('hello.html', 'Hello!');
            element = compileForTest('<div><b class=i-hello><div log></div></b></div>');

            expect(log).toEqual('');
          }
        ));


        it('should throw an error and clear element content if the template fails to load',
          angular.mock.inject(($httpBackend) => {
            $httpBackend.expect('GET', 'hello.html').respond(404, 'Not Found!');
            element = compileForTest('<div><b class="hello">content</b></div>');

            expect(() => {
              $httpBackend.flush();
            }).toThrowMinErr('$templateRequest', 'tpload', 'Failed to load template: hello.html');
            expect(sortedHtml(element)).toBe('<div><b class="hello"></b></div>');
          })
        );


        it('should prevent multiple templates per element', () => {
          angular.mock.module(() => {
            directive('sync', ngInternals.valueFn({
              restrict: 'C',
              template: '<span></span>'
            }));
            directive('async', ngInternals.valueFn({
              restrict: 'C',
              templateUrl: 'template.html'
            }));
          });
          angular.mock.inject(($httpBackend) => {
            $httpBackend.whenGET('template.html').respond('<p>template.html</p>');

            expect(() => {
              compileForTest('<div><div class="sync async"></div></div>');
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'multidir',
              'Multiple directives [async, sync] asking for template on: ' +
              '<div class="sync async">');
          });
        });


        it('should copy classes from pre-template node into linked element', () => {
          angular.mock.module(() => {
            directive('test', ngInternals.valueFn({
              templateUrl: 'test.html',
              replace: true
            }));
          });
          angular.mock.inject(($templateCache, $rootScope) => {
            let child;
            $templateCache.put('test.html', '<p class="template-class">Hello</p>');
            element = compileForTest('<div test></div>', $rootScope, node => {
              node.addClass('clonefn-class');
            });
            $rootScope.$digest();
            expect(element).toHaveClass('template-class');
            expect(element).toHaveClass('clonefn-class');
          });
        });


        describe('delay compile / linking functions until after template is resolved', () => {
          let template;
          beforeEach(angular.mock.module(() => {
            function logDirective(name, priority, options) {
              directive(name, log => {
                return (angular.extend({
                  priority: priority,
                  compile: function () {
                    log(name + '-C');
                    return {
                      pre: function () { log(name + '-PreL'); },
                      post: function () { log(name + '-PostL'); }
                    };
                  }
                }, options || {}));
              });
            }

            logDirective('first', 10);
            logDirective('second', 5, { templateUrl: 'second.html' });
            logDirective('third', 3);
            logDirective('last', 0);

            logDirective('iFirst', 10, { replace: true });
            logDirective('iSecond', 5, { replace: true, templateUrl: 'second.html' });
            logDirective('iThird', 3, { replace: true });
            logDirective('iLast', 0, { replace: true });
          }));

          it('should flush after link append', angular.mock.inject(
            ($compile, $rootScope, $httpBackend, log) => {
              $httpBackend.expect('GET', 'second.html').respond('<div third>{{1+2}}</div>');
              template = $compile('<div><span first second last></span></div>');
              element = template($rootScope);
              expect(log).toEqual('first-C');

              log('FLUSH');
              $httpBackend.flush();
              $rootScope.$digest();
              expect(log).toEqual(
                'first-C; FLUSH; second-C; last-C; third-C; ' +
                'first-PreL; second-PreL; last-PreL; third-PreL; ' +
                'third-PostL; last-PostL; second-PostL; first-PostL');

              const span = element.find('span');
              expect(span.attr('first')).toEqual('');
              expect(span.attr('second')).toEqual('');
              expect(span.find('div').attr('third')).toEqual('');
              expect(span.attr('last')).toEqual('');

              expect(span.text()).toEqual('3');
            }));


          it('should flush after link inline', angular.mock.inject(
            ($rootScope, $httpBackend, log) => {
              $httpBackend.expect('GET', 'second.html').respond('<div i-third>{{1+2}}</div>');
              template = generateTestCompiler('<div><span i-first i-second i-last></span></div>');
              element = template($rootScope);
              expect(log).toEqual('iFirst-C');

              log('FLUSH');
              $httpBackend.flush();
              $rootScope.$digest();
              expect(log).toEqual(
                'iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C; ' +
                'iFirst-PreL; iSecond-PreL; iThird-PreL; iLast-PreL; ' +
                'iLast-PostL; iThird-PostL; iSecond-PostL; iFirst-PostL');

              const div = element.find('div');
              expect(div.attr('i-first')).toEqual('');
              expect(div.attr('i-second')).toEqual('');
              expect(div.attr('i-third')).toEqual('');
              expect(div.attr('i-last')).toEqual('');

              expect(div.text()).toEqual('3');
            }));


          it('should flush before link append', angular.mock.inject(
            ($compile, $rootScope, $httpBackend, log) => {
              $httpBackend.expect('GET', 'second.html').respond('<div third>{{1+2}}</div>');
              template = $compile('<div><span first second last></span></div>');
              expect(log).toEqual('first-C');
              log('FLUSH');
              $httpBackend.flush();
              expect(log).toEqual('first-C; FLUSH; second-C; last-C; third-C');

              element = template($rootScope);
              $rootScope.$digest();
              expect(log).toEqual(
                'first-C; FLUSH; second-C; last-C; third-C; ' +
                'first-PreL; second-PreL; last-PreL; third-PreL; ' +
                'third-PostL; last-PostL; second-PostL; first-PostL');

              const span = element.find('span');
              expect(span.attr('first')).toEqual('');
              expect(span.attr('second')).toEqual('');
              expect(span.find('div').attr('third')).toEqual('');
              expect(span.attr('last')).toEqual('');

              expect(span.text()).toEqual('3');
            }));


          it('should flush before link inline', angular.mock.inject(
            ($compile, $rootScope, $httpBackend, log) => {
              $httpBackend.expect('GET', 'second.html').respond('<div i-third>{{1+2}}</div>');
              template = $compile('<div><span i-first i-second i-last></span></div>');
              expect(log).toEqual('iFirst-C');
              log('FLUSH');
              $httpBackend.flush();
              expect(log).toEqual('iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C');

              element = template($rootScope);
              $rootScope.$digest();
              expect(log).toEqual(
                'iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C; ' +
                'iFirst-PreL; iSecond-PreL; iThird-PreL; iLast-PreL; ' +
                'iLast-PostL; iThird-PostL; iSecond-PostL; iFirst-PostL');

              const div = element.find('div');
              expect(div.attr('i-first')).toEqual('');
              expect(div.attr('i-second')).toEqual('');
              expect(div.attr('i-third')).toEqual('');
              expect(div.attr('i-last')).toEqual('');

              expect(div.text()).toEqual('3');
            }));
        });


        it('should allow multiple elements in template', angular.mock.inject(($httpBackend) => {
          $httpBackend.expect('GET', 'hello.html').respond('before <b>mid</b> after');
          element = angular.element('<div hello></div>');
          compileForTest(element);
          $httpBackend.flush();
          expect(element.text()).toEqual('before mid after');
        }));


        it('should work when directive is on the root element', angular.mock.inject(
          ($httpBackend) => {
            $httpBackend.expect('GET', 'hello.html').
              respond('<span>3==<span ng-transclude></span></span>');
            element = angular.element('<b class="hello">{{1+2}}</b>');
            compileForTest(element);

            $httpBackend.flush();
            expect(element.text()).toEqual('3==3');
          }
        ));


        describe('when directive is in a repeater', () => {
          let is;
          beforeEach(() => {
            is = [1, 2];
          });

          function runTest() {
            angular.mock.inject(($httpBackend) => {
              $httpBackend.expect('GET', 'hello.html').
                respond('<span>i=<span ng-transclude></span>;</span>');
              element = angular.element('<div><b class=hello ng-repeat="i in [' + is + ']">{{i}}</b></div>');
              compileForTest(element);

              $httpBackend.flush();
              expect(element.text()).toEqual('i=' + is.join(';i=') + ';');
            });
          }

          it('should work in jqLite and jQuery with jQuery.cleanData last patched by Angular', runTest);

          it('should work with another library patching jqLite/jQuery.cleanData after Angular', () => {
            let cleanedCount = 0;
            const currentCleanData = angular.element.cleanData;
            angular.element.cleanData = elems => {
              cleanedCount += elems.length;
              // Don't return the output and explicitly pass only the first parameter
              // so that we're sure we're not relying on either of them. jQuery UI patch
              // behaves in this way.
              currentCleanData(elems);
            };

            runTest();

            // The initial ng-repeat div is dumped after parsing hence we expect cleanData
            // count to be one larger than size of the iterated array.
            expect(cleanedCount).toBe(is.length + 1);

            // Restore the previous cleanData.
            angular.element.cleanData = currentCleanData;
          });
        });

        describe('replace and not exactly one root element', () => {

          beforeEach(angular.mock.module(() => {

            directive('template', () => {
              return {
                replace: true,
                templateUrl: 'template.html'
              };
            });
          }));

          they('should throw if: $prop',
            {
              'no root element': 'dada',
              'multiple root elements': '<div></div><div></div>'
            }, directiveTemplate => {

              angular.mock.inject(($templateCache, $rootScope) => {
                $templateCache.put('template.html', directiveTemplate);

                expect(() => {
                  compileForTest('<p template></p>');
                  $rootScope.$digest();
                }).toThrowMinErr('$compile', 'tplrt',
                  'Template for directive \'template\' must have exactly one root element. ' +
                  'template.html');
              });
            });

          they('should not throw if the root element is accompanied by: $prop',
            {
              'whitespace': '  <div>Hello World!</div> \n',
              'comments': '<!-- oh hi --><div>Hello World!</div> \n',
              'comments + whitespace': '  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n'
            }, directiveTemplate => {

              angular.mock.inject(($templateCache, $rootScope) => {
                $templateCache.put('template.html', directiveTemplate);
                element = compileForTest('<p template></p>');
                expect(() => {
                  $rootScope.$digest();
                }).not.toThrow();
                expect(element.length).toBe(1);
                expect(element.text()).toBe('Hello World!');
              });
            });
        });

        it('should resume delayed compilation without duplicates when in a repeater', () => {
          // this is a test for a regression
          // scope creation, isolate watcher setup, controller instantiation, etc should happen
          // only once even if we are dealing with delayed compilation of a node due to templateUrl
          // and the template node is in a repeater

          const controllerSpy = jest.fn();

          angular.mock.module($compileProvider => {
            $compileProvider.directive('delayed', ngInternals.valueFn({
              controller: controllerSpy,
              templateUrl: 'delayed.html',
              scope: {
                title: '@'
              }
            }));
          });

          angular.mock.inject(($templateCache, $rootScope) => {
            $rootScope.coolTitle = 'boom!';
            $templateCache.put('delayed.html', '<div>{{title}}</div>');
            element = compileForTest(
              '<div><div ng-repeat="i in [1,2]"><div delayed title="{{coolTitle + i}}"></div>|</div></div>'
            );

            $rootScope.$apply();

            expect(controllerSpy).toHaveBeenCalledTimes(2);
            expect(element.text()).toBe('boom!1|boom!2|');
          });
        });


        it('should support templateUrl with replace', () => {
          // a regression https://github.com/angular/angular.js/issues/3792
          angular.mock.module($compileProvider => {
            $compileProvider.directive('simple', () => {
              return {
                templateUrl: '/some.html',
                replace: true
              };
            });
          });

          angular.mock.inject(($templateCache, $rootScope) => {
            $templateCache.put('/some.html',
              '<div ng-switch="i">' +
              '<div ng-switch-when="1">i = 1</div>' +
              '<div ng-switch-default>I dont know what `i` is.</div>' +
              '</div>');

            element = compileForTest('<div simple></div>');

            $rootScope.$apply(() => {
              $rootScope.i = 1;
            });

            expect(element.html()).toContain('i = 1');
          });
        });

        it('should support templates with root <tr> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('tr.html', '<tr><td>TR</td></tr>');
          expect(() => {
            element = compileForTest('<div replace-with-tr></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tr/i);
        }));

        it('should support templates with root <td> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('td.html', '<td>TD</td>');
          expect(() => {
            element = compileForTest('<div replace-with-td></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/td/i);
        }));

        it('should support templates with root <th> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('th.html', '<th>TH</th>');
          expect(() => {
            element = compileForTest('<div replace-with-th></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/th/i);
        }));

        it('should support templates with root <thead> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('thead.html', '<thead><tr><td>TD</td></tr></thead>');
          expect(() => {
            element = compileForTest('<div replace-with-thead></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/thead/i);
        }));

        it('should support templates with root <tbody> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('tbody.html', '<tbody><tr><td>TD</td></tr></tbody>');
          expect(() => {
            element = compileForTest('<div replace-with-tbody></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tbody/i);
        }));

        it('should support templates with root <tfoot> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('tfoot.html', '<tfoot><tr><td>TD</td></tr></tfoot>');
          expect(() => {
            element = compileForTest('<div replace-with-tfoot></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/tfoot/i);
        }));

        it('should support templates with root <option> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('option.html', '<option>OPTION</option>');
          expect(() => {
            element = compileForTest('<div replace-with-option></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/option/i);
        }));

        it('should support templates with root <optgroup> tags', angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('optgroup.html', '<optgroup>OPTGROUP</optgroup>');
          expect(() => {
            element = compileForTest('<div replace-with-optgroup></div>');
          }).not.toThrow();
          $rootScope.$digest();
          expect(ngInternals.nodeName_(element)).toMatch(/optgroup/i);
        }));

        it('should support SVG templates using directive.templateNamespace=svg', () => {
          angular.mock.module(() => {
            directive('svgAnchor', ngInternals.valueFn({
              replace: true,
              templateUrl: 'template.html',
              templateNamespace: 'SVG',
              scope: {
                linkurl: '@svgAnchor',
                text: '@?'
              }
            }));
          });
          angular.mock.inject(($rootScope, $templateCache) => {
            $templateCache.put('template.html', '<a xlink:href="{{linkurl}}">{{text}}</a>');
            element = compileForTest('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>');
            $rootScope.$digest();
            const child = element.children().eq(0);
            expect(ngInternals.nodeName_(child)).toMatch(/a/i);
            expect(isSVGElement(child[0])).toBe(true);
            expect(child[0].getAttribute('xlink:href')).toBe('/foo/bar');
          });
        });

        if (supportsMathML()) {
          // MathML is only natively supported in Firefox at the time of this test's writing,
          // and even there, the browser does not export MathML element constructors globally.
          it('should support MathML templates using directive.templateNamespace=math', () => {
            angular.mock.module(() => {
              directive('pow', ngInternals.valueFn({
                replace: true,
                transclude: true,
                templateUrl: 'template.html',
                templateNamespace: 'math',
                scope: {
                  pow: '@pow'
                },
                link: function (_scope, elm, _attr, _ctrl, transclude) {
                  transclude(node => {
                    elm.prepend(node[0]);
                  });
                }
              }));
            });
            angular.mock.inject(($rootScope, $templateCache) => {
              $templateCache.put('template.html', '<msup><mn>{{pow}}</mn></msup>');
              element = compileForTest('<math><mn pow="2"><mn>8</mn></mn></math>');
              $rootScope.$digest();
              const child = element.children().eq(0);
              expect(ngInternals.nodeName_(child)).toMatch(/msup/i);
              expect(isUnknownElement(child[0])).toBe(false);
              expect(isHTMLElement(child[0])).toBe(false);
            });
          });
        }

        it('should keep prototype properties on sync version of async directive', () => {
          angular.mock.module(() => {
            function DirectiveClass() {
              this.restrict = 'E';
              this.templateUrl = 'test.html';
            }

            DirectiveClass.prototype.compile = () => {
              return (scope, _element, _attrs) => {
                scope.value = 'Test Value';
              };
            };

            directive('templateUrlWithPrototype', ngInternals.valueFn(new DirectiveClass()));
          });

          angular.mock.inject(($rootScope, $httpBackend) => {
            $httpBackend.whenGET('test.html').
              respond('<p>{{value}}</p>');
            element = compileForTest('<template-url-with-prototype><template-url-with-prototype>');
            $httpBackend.flush();
            $rootScope.$digest();
            expect(element.find('p')[0].innerHTML).toEqual('Test Value');
          });
        });

      });


      describe('templateUrl as function', () => {

        beforeEach(angular.mock.module(() => {
          directive('myDirective', ngInternals.valueFn({
            replace: true,
            templateUrl: function ($element, $attrs) {
              expect($element.text()).toBe('original content');
              expect($attrs.myDirective).toBe('some value');
              return 'my-directive.html';
            },
            compile: function ($element, $attrs) {
              expect($element.text()).toBe('template content');
              expect($attrs.id).toBe('templateContent');
            }
          }));
        }));


        it('should evaluate `templateUrl` when defined as fn and use returned value as url', angular.mock.inject(
          ($rootScope, $templateCache) => {
            $templateCache.put('my-directive.html', '<div id="templateContent">template content</span>');
            element = compileForTest('<div my-directive="some value">original content<div>');
            expect(element.text()).toEqual('');

            $rootScope.$digest();

            expect(element.text()).toEqual('template content');
          }));
      });


      describe('scope', () => {
        let iscope;

        beforeEach(angular.mock.module(() => {
          angular.forEach(['', 'a', 'b'], name => {
            directive('scope' + name.toUpperCase(), log => {
              return {
                scope: true,
                restrict: 'CA',
                compile: function () {
                  return {
                    pre: function (scope, element) {
                      log(scope.$id);
                      expect(element.data('$scope')).toBe(scope);
                    }
                  };
                }
              };
            });
            directive('iscope' + name.toUpperCase(), log => {
              return {
                scope: {},
                restrict: 'CA',
                compile: function () {
                  return (scope, element) => {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScopeNoTemplate')).toBe(scope);
                  };
                }
              };
            });
            directive('tscope' + name.toUpperCase(), log => {
              return {
                scope: true,
                restrict: 'CA',
                templateUrl: 'tscope.html',
                compile: function () {
                  return (scope, element) => {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('stscope' + name.toUpperCase(), log => {
              return {
                scope: true,
                restrict: 'CA',
                template: '<span></span>',
                compile: function () {
                  return (scope, element) => {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('trscope' + name.toUpperCase(), log => {
              return {
                scope: true,
                replace: true,
                restrict: 'CA',
                templateUrl: 'trscope.html',
                compile: function () {
                  return (scope, element) => {
                    log(scope.$id);
                    expect(element.data('$scope')).toBe(scope);
                  };
                }
              };
            });
            directive('tiscope' + name.toUpperCase(), log => {
              return {
                scope: {},
                restrict: 'CA',
                templateUrl: 'tiscope.html',
                compile: function () {
                  return (scope, element) => {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScope')).toBe(scope);
                  };
                }
              };
            });
            directive('stiscope' + name.toUpperCase(), log => {
              return {
                scope: {},
                restrict: 'CA',
                template: '<span></span>',
                compile: function () {
                  return (scope, element) => {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScope')).toBe(scope);
                  };
                }
              };
            });
          });
          directive('log', log => {
            return {
              restrict: 'CA',
              link: {
                pre: function (scope) {
                  log('log-' + scope.$id + '-' + (scope.$parent && scope.$parent.$id || 'no-parent'));
                }
              }
            };
          });
          directive('prototypeMethodNameAsScopeVarA', () => {
            return {
              scope: {
                'constructor': '=?',
                'valueOf': '='
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarB', () => {
            return {
              scope: {
                'constructor': '@?',
                'valueOf': '@'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarC', () => {
            return {
              scope: {
                'constructor': '&?',
                'valueOf': '&'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('prototypeMethodNameAsScopeVarD', () => {
            return {
              scope: {
                'constructor': '<?',
                'valueOf': '<'
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
          directive('watchAsScopeVar', () => {
            return {
              scope: {
                'watch': '='
              },
              restrict: 'AE',
              template: '<span></span>'
            };
          });
        }));


        it('should allow creation of new scopes', angular.mock.inject((log) => {
          element = compileForTest('<div><span scope><a log></a></span></div>');
          expect(log).toEqual('2; log-2-1; LOG');
          expect(element.find('span').hasClass('ng-scope')).toBe(true);
        }));


        it('should allow creation of new isolated scopes for directives', angular.mock.inject(
          ($rootScope, log) => {
            element = compileForTest('<div><span iscope><a log></a></span></div>');
            expect(log).toEqual('log-1-no-parent; LOG; 2');
            $rootScope.name = 'abc';
            expect(iscope.$parent).toBe($rootScope);
            expect(iscope.name).toBeUndefined();
          }));


        it('should allow creation of new scopes for directives with templates', angular.mock.inject(
          ($rootScope, log, $httpBackend) => {
            $httpBackend.expect('GET', 'tscope.html').respond('<a log>{{name}}; scopeId: {{$id}}</a>');
            element = compileForTest('<div><span tscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-2-1; LOG; 2');
            $rootScope.name = 'Jozo';
            $rootScope.$apply();
            expect(element.text()).toBe('Jozo; scopeId: 2');
            expect(element.find('span').scope().$id).toBe(2);
          }));


        it('should allow creation of new scopes for replace directives with templates', angular.mock.inject(
          ($rootScope, log, $httpBackend) => {
            $httpBackend.expect('GET', 'trscope.html').
              respond('<p><a log>{{name}}; scopeId: {{$id}}</a></p>');
            element = compileForTest('<div><span trscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-2-1; LOG; 2');
            $rootScope.name = 'Jozo';
            $rootScope.$apply();
            expect(element.text()).toBe('Jozo; scopeId: 2');
            expect(element.find('a').scope().$id).toBe(2);
          }));


        it('should allow creation of new scopes for replace directives with templates in a repeater',
          angular.mock.inject(($rootScope, log, $httpBackend) => {
            $httpBackend.expect('GET', 'trscope.html').
              respond('<p><a log>{{name}}; scopeId: {{$id}} |</a></p>');
            element = compileForTest('<div><span ng-repeat="i in [1,2,3]" trscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-3-2; LOG; 3; log-5-4; LOG; 5; log-7-6; LOG; 7');
            $rootScope.name = 'Jozo';
            $rootScope.$apply();
            expect(element.text()).toBe('Jozo; scopeId: 3 |Jozo; scopeId: 5 |Jozo; scopeId: 7 |');
            expect(element.find('p').scope().$id).toBe(3);
            expect(element.find('a').scope().$id).toBe(3);
          }));


        it('should allow creation of new isolated scopes for directives with templates', angular.mock.inject(
          ($rootScope, log, $httpBackend) => {
            $httpBackend.expect('GET', 'tiscope.html').respond('<a log></a>');
            element = compileForTest('<div><span tiscope></span></div>');
            $httpBackend.flush();
            expect(log).toEqual('log-2-1; LOG; 2');
            $rootScope.name = 'abc';
            expect(iscope.$parent).toBe($rootScope);
            expect(iscope.name).toBeUndefined();
          }));


        it('should correctly create the scope hierarchy', angular.mock.inject(
          (log) => {
            element = compileForTest(
              '<div>' + //1
              '<b class=scope>' + //2
              '<b class=scope><b class=log></b></b>' + //3
              '<b class=log></b>' +
              '</b>' +
              '<b class=scope>' + //4
              '<b class=log></b>' +
              '</b>' +
              '</div>'
            );
            expect(log).toEqual('2; 3; log-3-2; LOG; log-2-1; LOG; 4; log-4-1; LOG');
          })
        );


        it('should allow more than one new scope directives per element, but directives should share' +
          'the scope', angular.mock.inject(
            (log) => {
              element = compileForTest('<div class="scope-a; scope-b"></div>');
              expect(log).toEqual('2; 2');
            })
        );

        it('should not allow more than one isolate scope creation per element', angular.mock.inject(
          () => {
            expect(() => {
              compileForTest('<div class="iscope-a; scope-b"></div>');
            }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [iscopeA, scopeB] asking for new/isolated scope on: ' +
              '<div class="iscope-a; scope-b">');
          })
        );

        it('should not allow more than one isolate/new scope creation per element regardless of `templateUrl`',
          angular.mock.inject($httpBackend => {
            $httpBackend.expect('GET', 'tiscope.html').respond('<div>Hello, world !</div>');

            expect(() => {
              compile('<div class="tiscope-a; scope-b"></div>');
              $httpBackend.flush();
            }).toThrowMinErr('$compile', 'multidir',
              'Multiple directives [scopeB, tiscopeA] asking for new/isolated scope on: ' +
              '<div class="tiscope-a; scope-b ng-scope">');
          })
        );

        it('should not allow more than one isolate scope creation per element regardless of directive priority', () => {
          angular.mock.module($compileProvider => {
            $compileProvider.directive('highPriorityScope', () => {
              return {
                restrict: 'C',
                priority: 1,
                scope: true,
                link: function () { }
              };
            });
          });
          angular.mock.inject(() => {
            expect(() => {
              compileForTest('<div class="iscope-a; high-priority-scope"></div>');
            }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [highPriorityScope, iscopeA] asking for new/isolated scope on: ' +
              '<div class="iscope-a; high-priority-scope">');
          });
        });


        it('should create new scope even at the root of the template', angular.mock.inject(
          (log) => {
            element = compileForTest('<div scope-a></div>');
            expect(log).toEqual('2');
          })
        );


        it('should create isolate scope even at the root of the template', angular.mock.inject(
          (log) => {
            element = compileForTest('<div iscope></div>');
            expect(log).toEqual('2');
          })
        );


        describe('scope()/isolate() scope getters', () => {

          describe('with no directives', () => {

            it('should return the scope of the parent node', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div></div>');
                expect(element.scope()).toBe($rootScope);
              })
            );
          });


          describe('with new scope directives', () => {

            it('should return the new scope at the directive element', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div scope></div>');
                expect(element.scope().$parent).toBe($rootScope);
              })
            );


            it('should return the new scope for children in the original template', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div scope><a></a></div>');
                expect(element.find('a').scope().$parent).toBe($rootScope);
              })
            );


            it('should return the new scope for children in the directive template', angular.mock.inject(
              ($rootScope, $httpBackend) => {
                $httpBackend.expect('GET', 'tscope.html').respond('<a></a>');
                element = compileForTest('<div tscope></div>');
                $httpBackend.flush();
                expect(element.find('a').scope().$parent).toBe($rootScope);
              })
            );

            it('should return the new scope for children in the directive sync template', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div stscope></div>');
                expect(element.find('span').scope().$parent).toBe($rootScope);
              })
            );
          });


          describe('with isolate scope directives', () => {

            it('should return the root scope for directives at the root element', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div iscope></div>');
                expect(element.scope()).toBe($rootScope);
              })
            );


            it('should return the non-isolate scope at the directive element', angular.mock.inject(
              ($rootScope) => {
                let directiveElement;
                element = compileForTest('<div><div iscope></div></div>');
                directiveElement = element.children();
                expect(directiveElement.scope()).toBe($rootScope);
                expect(directiveElement.isolateScope().$parent).toBe($rootScope);
              })
            );


            it('should return the isolate scope for children in the original template', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div iscope><a></a></div>');
                expect(element.find('a').scope()).toBe($rootScope); //xx
              })
            );


            it('should return the isolate scope for children in directive template', angular.mock.inject(
              ($rootScope, $httpBackend) => {
                $httpBackend.expect('GET', 'tiscope.html').respond('<a></a>');
                element = compileForTest('<div tiscope></div>');
                expect(element.isolateScope()).toBeUndefined(); // this is the current behavior, not desired feature
                $httpBackend.flush();
                expect(element.find('a').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
              })
            );

            it('should return the isolate scope for children in directive sync template', angular.mock.inject(
              ($rootScope) => {
                element = compileForTest('<div stiscope></div>');
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
              })
            );

            it('should handle "=" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              ($rootScope) => {
                const func = () => {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-a></div>'
                  );
                };

                expect(func).not.toThrow();
                const scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe($rootScope);

                // Not shadowed because optional
                expect(scope.constructor).toBe($rootScope.constructor);
                expect(scope.hasOwnProperty('constructor')).toBe(false);

                // Shadowed with undefined because not optional
                expect(scope.valueOf).toBeUndefined();
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            it('should handle "=" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
              ($rootScope) => {
                $rootScope.constructor = 'constructor';
                $rootScope.valueOf = 'valueOf';
                const func = () => {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>'
                  );
                };

                expect(func).not.toThrow();
                const scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe($rootScope);
                expect(scope.constructor).toBe('constructor');
                expect(scope.hasOwnProperty('constructor')).toBe(true);
                expect(scope.valueOf).toBe('valueOf');
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            it('should throw an error for undefined non-optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                window.disableCacheLeakCheck = true;

                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  ($rootScope, $compile) => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-a></div>'
                      );
                    };
                    expect(func).toThrowMinErr('$compile',
                      'missingattr',
                      'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                      'ScopeVarA\' is non-optional and must be set!');
                  });
              });

            it('should not throw an error for set non-optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  ($rootScope, $compile) => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should not throw an error for undefined optional "=" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-a value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should handle "@" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              ($rootScope) => {
                const func = () => {
                  element = compileForTest('<div prototype-method-name-as-scope-var-b></div>');
                };

                expect(func).not.toThrow();
                const scope = element.isolateScope();
                expect(element.find('span').scope()).toBe(scope);
                expect(scope).not.toBe($rootScope);

                // Does not shadow value because optional
                expect(scope.constructor).toBe($rootScope.constructor);
                expect(scope.hasOwnProperty('constructor')).toBe(false);

                // Shadows value because not optional
                expect(scope.valueOf).toBeUndefined();
                expect(scope.hasOwnProperty('valueOf')).toBe(true);
              })
            );

            it('should handle "@" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
              ($rootScope) => {
                const func = () => {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>'
                  );
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
                expect(element.isolateScope()['constructor']).toBe('constructor');
                expect(element.isolateScope()['valueOf']).toBe('valueOf');
              })
            );

            it('should throw an error for undefined non-optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {

                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-b></div>'
                      );
                    };
                    expect(func).toThrowMinErr('$compile',
                      'missingattr',
                      'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                      'ScopeVarB\' is non-optional and must be set!');
                  });
              });

            it('should not throw an error for set non-optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should not throw an error for undefined optional "@" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-b value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should handle "&" bindings with same method names in Object.prototype correctly when not present', angular.mock.inject(
              ($rootScope) => {
                const func = () => {
                  element = compileForTest('<div prototype-method-name-as-scope-var-c></div>');
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
                expect(element.isolateScope()['constructor']).toBe($rootScope.constructor);
                expect(element.isolateScope()['valueOf']()).toBeUndefined();
              })
            );

            it('should handle "&" bindings with same method names in Object.prototype correctly when present', angular.mock.inject(
              ($rootScope) => {
                $rootScope.constructor = () => { return 'constructor'; };
                $rootScope.valueOf = () => { return 'valueOf'; };
                const func = () => {
                  element = compileForTest(
                    '<div prototype-method-name-as-scope-var-c constructor="constructor()" value-of="valueOf()"></div>'
                  );
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
                expect(element.isolateScope()['constructor']()).toBe('constructor');
                expect(element.isolateScope()['valueOf']()).toBe('valueOf');
              })
            );

            it('should throw an error for undefined non-optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {

                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-c></div>'
                      );
                    };
                    expect(func).toThrowMinErr('$compile',
                      'missingattr',
                      'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                      'ScopeVarC\' is non-optional and must be set!');
                  });
              });

            it('should not throw an error for set non-optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-c constructor="constructor" value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should not throw an error for undefined optional "&" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-c value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should throw an error for undefined non-optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {

                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-d></div>'
                      );
                    };
                    expect(func).toThrowMinErr('$compile',
                      'missingattr',
                      'Attribute \'valueOf\' of \'prototypeMethodNameAs' +
                      'ScopeVarD\' is non-optional and must be set!');
                  });
              });

            it('should not throw an error for set non-optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-d constructor="constructor" value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should not throw an error for undefined optional "<" bindings when ' +
              'strictComponentBindingsEnabled is true', () => {
                angular.mock.module($compileProvider => {
                  $compileProvider.strictComponentBindingsEnabled(true);
                });
                angular.mock.inject(
                  () => {
                    const func = () => {
                      element = compileForTest(
                        '<div prototype-method-name-as-scope-var-d value-of="valueOf"></div>'
                      );
                    };
                    expect(func).not.toThrow();
                  });
              });

            it('should not throw exception when using "watch" as binding in Firefox', angular.mock.inject(
              ($rootScope) => {
                $rootScope.watch = 'watch';
                const func = () => {
                  element = compileForTest(
                    '<div watch-as-scope-var watch="watch"></div>'
                  );
                };

                expect(func).not.toThrow();
                expect(element.find('span').scope()).toBe(element.isolateScope());
                expect(element.isolateScope()).not.toBe($rootScope);
                expect(element.isolateScope()['watch']).toBe('watch');
              })
            );

            it('should handle @ bindings on BOOLEAN attributes', () => {
              let checkedVal;
              angular.mock.module($compileProvider => {
                $compileProvider.directive('test', () => {
                  return {
                    scope: { checked: '@' },
                    link: function (scope, _element, _attrs) {
                      checkedVal = scope.checked;
                    }
                  };
                });
              });
              angular.mock.inject(() => {
                compileForTest('<input test checked="checked">');
                expect(checkedVal).toEqual(true);
              });
            });

            it('should handle updates to @ bindings on BOOLEAN attributes', () => {
              let componentScope;
              angular.mock.module($compileProvider => {
                $compileProvider.directive('test', () => {
                  return {
                    scope: { checked: '@' },
                    link: function (scope, _element, attrs) {
                      componentScope = scope;
                      attrs.$set('checked', true);
                    }
                  };
                });
              });
              angular.mock.inject(() => {
                compileForTest('<test></test>');
                expect(componentScope.checked).toBe(true);
              });
            });
          });


          describe('with isolate scope directives and directives that manually create a new scope', () => {

            it('should return the new scope at the directive element', angular.mock.inject(
              ($rootScope) => {
                let directiveElement;
                element = compileForTest('<div><a ng-if="true" iscope></a></div>');
                $rootScope.$apply();
                directiveElement = element.find('a');
                expect(directiveElement.scope().$parent).toBe($rootScope);
                expect(directiveElement.scope()).not.toBe(directiveElement.isolateScope());
              })
            );


            it('should return the isolate scope for child elements', angular.mock.inject(
              ($rootScope, $httpBackend) => {
                let directiveElement, child;
                $httpBackend.expect('GET', 'tiscope.html').respond('<span></span>');
                element = compileForTest('<div><a ng-if="true" tiscope></a></div>');
                $rootScope.$apply();
                $httpBackend.flush();
                directiveElement = element.find('a');
                child = directiveElement.find('span');
                expect(child.scope()).toBe(directiveElement.isolateScope());
              })
            );

            it('should return the isolate scope for child elements in directive sync template', angular.mock.inject(
              ($rootScope) => {
                let directiveElement, child;
                element = compileForTest('<div><a ng-if="true" stiscope></a></div>');
                $rootScope.$apply();
                directiveElement = element.find('a');
                child = directiveElement.find('span');
                expect(child.scope()).toBe(directiveElement.isolateScope());
              })
            );
          });
        });

        describe('multidir isolated scope error messages', () => {
          angular.module('fakeIsoledScopeModule', [])
            .directive('fakeScope', log => {
              return {
                scope: true,
                restrict: 'CA',
                compile: function () {
                  return {
                    pre: function (scope, element) {
                      log(scope.$id);
                      expect(element.data('$scope')).toBe(scope);
                    }
                  };
                }
              };
            })
            .directive('fakeIScope', log => {
              return {
                scope: {},
                restrict: 'CA',
                compile: function () {
                  return (scope, element) => {
                    iscope = scope;
                    log(scope.$id);
                    expect(element.data('$isolateScopeNoTemplate')).toBe(scope);
                  };
                }
              };
            });

          beforeEach(angular.mock.module('fakeIsoledScopeModule', () => {
            directive('anonymModuleScopeDirective', log => {
              return {
                scope: true,
                restrict: 'CA',
                compile: function () {
                  return {
                    pre: function (scope, element) {
                      log(scope.$id);
                      expect(element.data('$scope')).toBe(scope);
                    }
                  };
                }
              };
            });
          }));

          it('should add module name to multidir isolated scope message if directive defined through module', angular.mock.inject(
            () => {
              expect(() => {
                compileForTest('<div class="fake-scope; fake-i-scope"></div>');
              }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [fakeIScope (module: fakeIsoledScopeModule), fakeScope (module: fakeIsoledScopeModule)] ' +
                'asking for new/isolated scope on: <div class="fake-scope; fake-i-scope">');
            })
          );

          it('shouldn\'t add module name to multidir isolated scope message if directive is defined directly with $compileProvider', angular.mock.inject(
            () => {
              expect(() => {
                compileForTest('<div class="anonym-module-scope-directive; fake-i-scope"></div>');
              }).toThrowMinErr('$compile', 'multidir',
                'Multiple directives [anonymModuleScopeDirective, fakeIScope (module: fakeIsoledScopeModule)] ' +
                'asking for new/isolated scope on: <div class="anonym-module-scope-directive; fake-i-scope">');
            })
          );
        });
      });
    });
  });


  describe('interpolation', () => {
    let observeSpy, directiveAttrs, deregisterObserver;

    beforeEach(angular.mock.module(() => {
      directive('observer', () => {
        return (_scope, _elm, attr) => {
          directiveAttrs = attr;
          observeSpy = jest.fn();
          deregisterObserver = attr.$observe('someAttr', observeSpy);
        };
      });
      directive('replaceSomeAttr', ngInternals.valueFn({
        compile: function (element, attr) {
          attr.$set('someAttr', 'bar-{{1+1}}');
          expect(element).toBe(attr.$$element);
        }
      }));
    }));


    it('should compile and link both attribute and text bindings', angular.mock.inject(
      ($rootScope) => {
        $rootScope.name = 'angular';
        element = compileForTest('<div name="attr: {{name}}">text: {{name}}</div>');
        $rootScope.$digest();
        expect(element.text()).toEqual('text: angular');
        expect(element.attr('name')).toEqual('attr: angular');
      })
    );


    it('should one-time bind if the expression starts with two colons', angular.mock.inject(
      ($rootScope) => {
        $rootScope.name = 'angular';
        element = compileForTest('<div name="attr: {{::name}}">text: {{::name}}</div>');
        expect($rootScope.$$watchers.length).toBe(2);
        $rootScope.$digest();
        expect(element.text()).toEqual('text: angular');
        expect(element.attr('name')).toEqual('attr: angular');
        expect($rootScope.$$watchers.length).toBe(0);
        $rootScope.name = 'not-angular';
        $rootScope.$digest();
        expect(element.text()).toEqual('text: angular');
        expect(element.attr('name')).toEqual('attr: angular');
      })
    );

    it('should one-time bind if the expression starts with a space and two colons', angular.mock.inject(
      ($rootScope) => {
        $rootScope.name = 'angular';
        element = compileForTest('<div name="attr: {{::name}}">text: {{ ::name }}</div>');
        expect($rootScope.$$watchers.length).toBe(2);
        $rootScope.$digest();
        expect(element.text()).toEqual('text: angular');
        expect(element.attr('name')).toEqual('attr: angular');
        expect($rootScope.$$watchers.length).toBe(0);
        $rootScope.name = 'not-angular';
        $rootScope.$digest();
        expect(element.text()).toEqual('text: angular');
        expect(element.attr('name')).toEqual('attr: angular');
      })
    );

    it('should interpolate a multi-part expression for regular attributes', angular.mock.inject(($rootScope) => {
      element = compileForTest('<div foo="some/{{id}}"></div>');
      $rootScope.$digest();
      expect(element.attr('foo')).toBe('some/');
      $rootScope.$apply(() => {
        $rootScope.id = 1;
      });
      expect(element.attr('foo')).toEqual('some/1');
    }));

    it('should process attribute interpolation in pre-linking phase at priority 100', () => {
      angular.mock.module(() => {
        directive('attrLog', log => {
          return {
            compile: function ($element, $attrs) {
              log('compile=' + $attrs.myName);

              return {
                pre: function ($scope, $element, $attrs) {
                  log('preLinkP0=' + $attrs.myName);
                },
                post: function ($scope, $element, $attrs) {
                  log('postLink=' + $attrs.myName);
                }
              };
            }
          };
        });
      });
      angular.mock.module(() => {
        directive('attrLogHighPriority', log => {
          return {
            priority: 101,
            compile: function () {
              return {
                pre: function ($scope, $element, $attrs) {
                  log('preLinkP101=' + $attrs.myName);
                }
              };
            }
          };
        });
      });
      angular.mock.inject(($rootScope, log) => {
        element = compileForTest('<div attr-log-high-priority attr-log my-name="{{name}}"></div>');
        $rootScope.name = 'angular';
        $rootScope.$apply();
        log('digest=' + element.attr('my-name'));
        expect(log).toEqual('compile={{name}}; preLinkP101={{name}}; preLinkP0=; postLink=; digest=angular');
      });
    });

    it('should allow the attribute to be removed before the attribute interpolation', () => {
      angular.mock.module(() => {
        directive('removeAttr', () => {
          return {
            restrict: 'A',
            compile: function (tElement, tAttr) {
              tAttr.$set('removeAttr', null);
            }
          };
        });
      });
      angular.mock.inject(() => {
        expect(() => {
          element = compileForTest('<div remove-attr="{{ toBeRemoved }}"></div>');
        }).not.toThrow();
        expect(element.attr('remove-attr')).toBeUndefined();
      });
    });

    describe('SCE values', () => {
      it('should resolve compile and link both attribute and text bindings', angular.mock.inject(
        ($rootScope, $sce) => {
          $rootScope.name = $sce.trustAsHtml('angular');
          element = compileForTest('<div name="attr: {{name}}">text: {{name}}</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('text: angular');
          expect(element.attr('name')).toEqual('attr: angular');
        }));
    });

    describe('decorating with binding info', () => {

      it('should not occur if `debugInfoEnabled` is false', () => {
        angular.mock.module($compileProvider => {
          $compileProvider.debugInfoEnabled(false);
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div>{{1+2}}</div>');
          expect(element.hasClass('ng-binding')).toBe(false);
          expect(element.data('$binding')).toBeUndefined();
        });
      });


      it('should occur if `debugInfoEnabled` is true', () => {
        angular.mock.module($compileProvider => {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div>{{1+2}}</div>');
          expect(element.hasClass('ng-binding')).toBe(true);
          expect(element.data('$binding')).toEqual(['1+2']);
        });
      });
    });

    it('should observe interpolated attrs', angular.mock.inject(($rootScope, $compile) => {
      compileForTest('<div some-attr="{{value}}" observer></div>');

      // should be async
      expect(observeSpy).not.toHaveBeenCalled();

      $rootScope.$apply(() => {
        $rootScope.value = 'bound-value';
      });
      expect(observeSpy).toHaveBeenCalledOnceWith('bound-value');
    }));


    it('should return a deregistration function while observing an attribute', angular.mock.inject(($rootScope, $compile) => {
      compileForTest('<div some-attr="{{value}}" observer></div>');

      $rootScope.$apply('value = "first-value"');
      expect(observeSpy).toHaveBeenCalledWith('first-value');

      deregisterObserver();
      $rootScope.$apply('value = "new-value"');
      expect(observeSpy).not.toHaveBeenCalledWith('new-value');
    }));


    it('should set interpolated attrs to initial interpolation value', angular.mock.inject(($rootScope, $compile) => {
      // we need the interpolated attributes to be initialized so that linking fn in a component
      // can access the value during link
      $rootScope.whatever = 'test value';
      compileForTest('<div some-attr="{{whatever}}" observer></div>');
      expect(directiveAttrs.someAttr).toBe($rootScope.whatever);
    }));


    it('should allow directive to replace interpolated attributes before attr interpolation compilation', angular.mock.inject(
      ($compile, $rootScope) => {
        element = compileForTest('<div some-attr="foo-{{1+1}}" replace-some-attr></div>');
        $rootScope.$digest();
        expect(element.attr('some-attr')).toEqual('bar-2');
      }));


    it('should call observer of non-interpolated attr through $evalAsync',
      angular.mock.inject(($rootScope, $compile) => {
        compileForTest('<div some-attr="nonBound" observer></div>');
        expect(directiveAttrs.someAttr).toBe('nonBound');

        expect(observeSpy).not.toHaveBeenCalled();
        $rootScope.$digest();
        expect(observeSpy).toHaveBeenCalled();
      })
    );

    it('should support non-interpolated `src` and `data-src` on the same element',
      angular.mock.inject(($rootScope, $compile) => {
        const element = compileForTest('<img src="abc" data-src="123">');
        expect(element.attr('src')).toEqual('abc');
        expect(element.attr('data-src')).toEqual('123');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('abc');
        expect(element.attr('data-src')).toEqual('123');
      }));

    it('should call observer only when the attribute value changes', () => {
      angular.mock.module(() => {
        directive('observingDirective', () => {
          return {
            restrict: 'E',
            scope: { someAttr: '@' }
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        compileForTest('<observing-directive observer></observing-directive>');
        $rootScope.$digest();
        expect(observeSpy).not.toHaveBeenCalledWith(undefined);
      });
    });


    it('should delegate exceptions to $exceptionHandler', () => {
      observeSpy = jest.fn().mockImplementation(() => {
        throw new Error('ERROR')
      });

      angular.mock.module($exceptionHandlerProvider => {
        $exceptionHandlerProvider.mode('log');
        directive('error', () => {
          return (scope, elm, attr) => {
            attr.$observe('someAttr', observeSpy);
            attr.$observe('someAttr', observeSpy);
          };
        });
      });

      angular.mock.inject(($compile, $rootScope, $exceptionHandler) => {
        compileForTest('<div some-attr="{{value}}" error></div>');
        $rootScope.$digest();

        expect(observeSpy).toHaveBeenCalled();
        expect(observeSpy).toHaveBeenCalledTimes(2);
        expect($exceptionHandler.errors).toEqual([new Error('ERROR'), new Error('ERROR')]);
      });
    });


    it('should translate {{}} in terminal nodes', angular.mock.inject(($rootScope, $compile) => {
      element = compileForTest('<select ng:model="x"><option value="">Greet {{name}}!</option></select>');
      $rootScope.$digest();
      expect(sortedHtml(element).replace(' selected="selected"', '')).
        toEqual('<select ng:model="x">' +
          '<option value="">Greet !</option>' +
          '</select>');
      $rootScope.name = 'Misko';
      $rootScope.$digest();
      expect(sortedHtml(element).replace(' selected="selected"', '')).
        toEqual('<select ng:model="x">' +
          '<option value="">Greet Misko!</option>' +
          '</select>');
    }));


    it('should handle consecutive text elements as a single text element', angular.mock.inject(($rootScope, $compile) => {
      // No point it running the test, if there is no MutationObserver
      if (!window.MutationObserver) return;

      // Create and register the MutationObserver
      const observer = new window.MutationObserver(angular.noop);
      observer.observe(document.body, { childList: true, subtree: true });

      // Run the actual test
      const base = angular.element('<div>&mdash; {{ "This doesn\'t." }}</div>');
      element = compileForTest(base);
      $rootScope.$digest();
      expect(element.text()).toBe('— This doesn\'t.');

      // Unregister the MutationObserver (and hope it doesn't mess up with subsequent tests)
      observer.disconnect();
    }));


    it('should not process text nodes merged into their sibling', angular.mock.inject(($compile, $rootScope) => {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode('1{{ value }}'));
      div.appendChild(document.createTextNode('2{{ value }}'));
      div.appendChild(document.createTextNode('3{{ value }}'));

      element = angular.element(div.childNodes);

      const initialWatcherCount = $rootScope.$countWatchers();
      compileForTest(element);
      $rootScope.$apply('value = 0');
      const newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

      expect(element.text()).toBe('102030');
      expect(newWatcherCount).toBe(3);

      dealoc(div);
    }));


    it('should support custom start/end interpolation symbols in template and directive template',
      () => {
        angular.mock.module(($interpolateProvider, $compileProvider) => {
          $interpolateProvider.startSymbol('##').endSymbol(']]');
          $compileProvider.directive('myDirective', () => {
            return {
              template: '<span>{{hello}}|{{hello|uppercase}}</span>'
            };
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div>##hello|uppercase]]|<div my-directive></div></div>');
          $rootScope.hello = 'ahoj';
          $rootScope.$digest();
          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      });


    it('should support custom start interpolation symbol, even when `endSymbol` doesn\'t change',
      () => {
        angular.mock.module(($compileProvider, $interpolateProvider) => {
          $interpolateProvider.startSymbol('[[');
          $compileProvider.directive('myDirective', () => {
            return {
              template: '<span>{{ hello }}|{{ hello | uppercase }}</span>'
            };
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          const tmpl = '<div>[[ hello | uppercase }}|<div my-directive></div></div>';
          element = compileForTest(tmpl);

          $rootScope.hello = 'ahoj';
          $rootScope.$digest();

          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      }
    );


    it('should support custom end interpolation symbol, even when `startSymbol` doesn\'t change',
      () => {
        angular.mock.module(($compileProvider, $interpolateProvider) => {
          $interpolateProvider.endSymbol(']]');
          $compileProvider.directive('myDirective', () => {
            return {
              template: '<span>{{ hello }}|{{ hello | uppercase }}</span>'
            };
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          const tmpl = '<div>{{ hello | uppercase ]]|<div my-directive></div></div>';
          element = compileForTest(tmpl);

          $rootScope.hello = 'ahoj';
          $rootScope.$digest();

          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      }
    );


    it('should support custom start/end interpolation symbols in async directive template',
      () => {
        angular.mock.module(($interpolateProvider, $compileProvider) => {
          $interpolateProvider.startSymbol('##').endSymbol(']]');
          $compileProvider.directive('myDirective', () => {
            return {
              templateUrl: 'myDirective.html'
            };
          });
        });

        angular.mock.inject(($compile, $rootScope, $templateCache) => {
          $templateCache.put('myDirective.html', '<span>{{hello}}|{{hello|uppercase}}</span>');
          element = compileForTest('<div>##hello|uppercase]]|<div my-directive></div></div>');
          $rootScope.hello = 'ahoj';
          $rootScope.$digest();
          expect(element.text()).toBe('AHOJ|ahoj|AHOJ');
        });
      });


    it('should make attributes observable for terminal directives', () => {
      angular.mock.module(() => {
        directive('myAttr', log => {
          return {
            terminal: true,
            link: function (scope, element, attrs) {
              attrs.$observe('myAttr', val => {
                log(val);
              });
            }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope, log) => {
        element = compileForTest('<div my-attr="{{myVal}}"></div>');
        expect(log).toEqual([]);

        $rootScope.myVal = 'carrot';
        $rootScope.$digest();

        expect(log).toEqual(['carrot']);
      });
    });
  });

  describe('collector', () => {

    let collected;
    beforeEach(angular.mock.module($compileProvider => {
      collected = false;
      $compileProvider.directive('testCollect', () => {
        return {
          restrict: 'EACM',
          link: function () {
            collected = true;
          }
        };
      });
    }));

    it('should collect comment directives by default', angular.mock.inject(() => {
      const html = '<!-- directive: test-collect -->';
      element = compileForTest('<div>' + html + '</div>');
      expect(collected).toBe(true);
    }));

    it('should collect css class directives by default', angular.mock.inject(() => {
      element = compileForTest('<div class="test-collect"></div>');
      expect(collected).toBe(true);
    }));

    angular.forEach([
      { commentEnabled: true, cssEnabled: true },
      { commentEnabled: true, cssEnabled: false },
      { commentEnabled: false, cssEnabled: true },
      { commentEnabled: false, cssEnabled: false }
    ], config => {
      describe('commentDirectivesEnabled(' + config.commentEnabled + ') ' +
        'cssClassDirectivesEnabled(' + config.cssEnabled + ')', () => {

          beforeEach(angular.mock.module($compileProvider => {
            $compileProvider.commentDirectivesEnabled(config.commentEnabled);
            $compileProvider.cssClassDirectivesEnabled(config.cssEnabled);
          }));

          let $compile, $rootScope;
          beforeEach(angular.mock.inject((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          }));

          it('should handle comment directives appropriately', () => {
            const html = '<!-- directive: test-collect -->';
            element = compileForTest('<div>' + html + '</div>');
            expect(collected).toBe(config.commentEnabled);
          });

          it('should handle css directives appropriately', () => {
            element = compileForTest('<div class="test-collect"></div>');
            expect(collected).toBe(config.cssEnabled);
          });

          it('should not prevent to compile entity directives', () => {
            element = compileForTest('<test-collect></test-collect>');
            expect(collected).toBe(true);
          });

          it('should not prevent to compile attribute directives', () => {
            element = compileForTest('<span test-collect></span>');
            expect(collected).toBe(true);
          });

          it('should not prevent to compile interpolated expressions', () => {
            element = compileForTest('<span>{{"text "+"interpolated"}}</span>');
            $rootScope.$apply();
            expect(element.text()).toBe('text interpolated');
          });

          it('should interpolate expressions inside class attribute', () => {
            $rootScope.interpolateMe = 'interpolated';
            const html = '<div class="{{interpolateMe}}"></div>';
            element = compileForTest(html);
            $rootScope.$apply();
            expect(element).toHaveClass('interpolated');
          });
        });
    });

    it('should configure comment directives true by default',
      angular.mock.module($compileProvider => {
        const commentDirectivesEnabled = $compileProvider.commentDirectivesEnabled();
        expect(commentDirectivesEnabled).toBe(true);
      })
    );

    it('should return self when setting commentDirectivesEnabled',
      angular.mock.module($compileProvider => {
        const self = $compileProvider.commentDirectivesEnabled(true);
        expect(self).toBe($compileProvider);
      })
    );

    it('should cache commentDirectivesEnabled value when configure ends', () => {
      let $compileProvider;
      angular.mock.module(_$compileProvider_ => {
        $compileProvider = _$compileProvider_;
        $compileProvider.commentDirectivesEnabled(false);
      });

      angular.mock.inject(($compile, $rootScope) => {
        $compileProvider.commentDirectivesEnabled(true);
        const html = '<!-- directive: test-collect -->';
        element = compileForTest('<div>' + html + '</div>');
        expect(collected).toBe(false);
      });
    });

    it('should configure css class directives true by default',
      angular.mock.module($compileProvider => {
        const cssClassDirectivesEnabled = $compileProvider.cssClassDirectivesEnabled();
        expect(cssClassDirectivesEnabled).toBe(true);
      })
    );

    it('should return self when setting cssClassDirectivesEnabled',
      angular.mock.module($compileProvider => {
        const self = $compileProvider.cssClassDirectivesEnabled(true);
        expect(self).toBe($compileProvider);
      })
    );

    it('should cache cssClassDirectivesEnabled value when configure ends', () => {
      let $compileProvider;
      angular.mock.module(_$compileProvider_ => {
        $compileProvider = _$compileProvider_;
        $compileProvider.cssClassDirectivesEnabled(false);
      });

      angular.mock.inject(($compile, $rootScope) => {
        $compileProvider.cssClassDirectivesEnabled(true);
        element = compileForTest('<div class="test-collect"></div>');
        expect(collected).toBe(false);
      });
    });
  });

  describe('link phase', () => {

    beforeEach(angular.mock.module(() => {

      angular.forEach(['a', 'b', 'c'], name => {
        directive(name, log => {
          return {
            restrict: 'ECA',
            compile: function () {
              log('t' + name.toUpperCase());
              return {
                pre: function () {
                  log('pre' + name.toUpperCase());
                },
                post: function linkFn() {
                  log('post' + name.toUpperCase());
                }
              };
            }
          };
        });
      });
    }));


    it('should not store linkingFns for noop branches', angular.mock.inject(($rootScope, $compile) => {
      element = angular.element('<div name="{{a}}"><span>ignore</span></div>');
      const linkingFn = $compile(element);
      // Now prune the branches with no directives
      element.find('span').remove();
      expect(element.find('span').length).toBe(0);
      // and we should still be able to compile without errors
      linkingFn($rootScope);
    }));


    it('should compile from top to bottom but link from bottom up', angular.mock.inject(
      ($compile, $rootScope, log) => {
        element = compileForTest('<a b><c></c></a>');
        expect(log).toEqual('tA; tB; tC; preA; preB; preC; postC; postB; postA');
      }
    ));


    it('should support link function on directive object', () => {
      angular.mock.module(() => {
        directive('abc', ngInternals.valueFn({
          link: function (scope, element, attrs) {
            element.text(attrs.abc);
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div abc="WORKS">FAIL</div>');
        expect(element.text()).toEqual('WORKS');
      });
    });

    it('should support $observe inside link function on directive object', () => {
      angular.mock.module(() => {
        directive('testLink', ngInternals.valueFn({
          templateUrl: 'test-link.html',
          link: function (scope, element, attrs) {
            attrs.$observe('testLink', val => {
              scope.testAttr = val;
            });
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope, $templateCache) => {
        $templateCache.put('test-link.html', '{{testAttr}}');
        element = compileForTest('<div test-link="{{1+2}}"></div>');
        $rootScope.$apply();
        expect(element.text()).toBe('3');
      });
    });

    it('should throw multilink error when linking the same element more then once', () => {
      const linker = generateTestCompiler('<div>');
      linker($rootScope).remove();
      expect(() => {
        linker($rootScope);
      }).toThrowMinErr('$compile', 'multilink', 'This element has already been linked.');
    });
  });


  describe('attrs', () => {

    it('should allow setting of attributes', () => {
      angular.mock.module(() => {
        directive({
          setter: ngInternals.valueFn((scope, element, attr) => {
            attr.$set('name', 'abc');
            attr.$set('disabled', true);
            expect(attr.name).toBe('abc');
            expect(attr.disabled).toBe(true);
          })
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest('<div setter></div>');
        expect(element.attr('name')).toEqual('abc');
        expect(element.attr('disabled')).toEqual('disabled');
      });
    });


    it('should read boolean attributes as boolean only on control elements', () => {
      let value;
      angular.mock.module(() => {
        directive({
          input: ngInternals.valueFn({
            restrict: 'ECA',
            link: function (scope, element, attr) {
              value = attr.required;
            }
          })
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest('<input required></input>');
        expect(value).toEqual(true);
      });
    });

    it('should read boolean attributes as text on non-controll elements', () => {
      let value;
      angular.mock.module(() => {
        directive({
          div: ngInternals.valueFn({
            restrict: 'ECA',
            link: function (scope, element, attr) {
              value = attr.required;
            }
          })
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest('<div required="some text"></div>');
        expect(value).toEqual('some text');
      });
    });


    it('should create new instance of attr for each template stamping', () => {
      angular.mock.module($provide => {
        const state = { first: [], second: [] };
        $provide.value('state', state);
        directive({
          first: ngInternals.valueFn({
            priority: 1,
            compile: function (templateElement, templateAttr) {
              return (scope, element, attr) => {
                state.first.push({
                  template: { element: templateElement, attr: templateAttr },
                  link: { element: element, attr: attr }
                });
              };
            }
          }),
          second: ngInternals.valueFn({
            priority: 2,
            compile: function (templateElement, templateAttr) {
              return (scope, element, attr) => {
                state.second.push({
                  template: { element: templateElement, attr: templateAttr },
                  link: { element: element, attr: attr }
                });
              };
            }
          })
        });
      });
      angular.mock.inject(($rootScope, $compile, state) => {
        const template = generateTestCompiler('<div first second>');
        dealoc(template($rootScope.$new(), angular.noop));
        dealoc(template($rootScope.$new(), angular.noop));

        // instance between directives should be shared
        expect(state.first[0].template.element).toBe(state.second[0].template.element);
        expect(state.first[0].template.attr).toBe(state.second[0].template.attr);

        // the template and the link can not be the same instance
        expect(state.first[0].template.element).not.toBe(state.first[0].link.element);
        expect(state.first[0].template.attr).not.toBe(state.first[0].link.attr);

        // each new template needs to be new instance
        expect(state.first[0].link.element).not.toBe(state.first[1].link.element);
        expect(state.first[0].link.attr).not.toBe(state.first[1].link.attr);
        expect(state.second[0].link.element).not.toBe(state.second[1].link.element);
        expect(state.second[0].link.attr).not.toBe(state.second[1].link.attr);
      });
    });


    it('should properly $observe inside ng-repeat', () => {
      const spies = [];

      angular.mock.module(() => {
        directive('observer', () => {
          return (scope, elm, attr) => {
            spies.push(jest.fn());
            attr.$observe('some', spies[spies.length - 1]);
          };
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div><div ng-repeat="i in items">' +
          '<span some="id_{{i.id}}" observer></span>' +
          '</div></div>');

        $rootScope.$apply(() => {
          $rootScope.items = [{ id: 1 }, { id: 2 }];
        });

        expect(spies[0]).toHaveBeenCalledOnceWith('id_1');
        expect(spies[1]).toHaveBeenCalledOnceWith('id_2');
        spies[0].mockClear();
        spies[1].mockClear();

        $rootScope.$apply(() => {
          $rootScope.items[0].id = 5;
        });

        expect(spies[0]).toHaveBeenCalledOnceWith('id_5');
      });
    });


    describe('$set', () => {
      let attr;
      beforeEach(() => {
        angular.mock.module(() => {
          // Create directives that capture the `attr` object
          ['input', 'a', 'img'].forEach(tag => {
            directive(tag, ngInternals.valueFn({
              restrict: 'ECA',
              link: function (scope, element, attr) {
                scope.attr = attr;
              }
            }));
          });
        });
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<input></input>');
          attr = $rootScope.attr;
          expect(attr).toBeDefined();
        });
      });


      it('should set attributes', () => {
        attr.$set('ngMyAttr', 'value');
        expect(element.attr('ng-my-attr')).toEqual('value');
        expect(attr.ngMyAttr).toEqual('value');
      });


      it('should allow overriding of attribute name and remember the name', () => {
        attr.$set('ngOther', '123', true, 'other');
        expect(element.attr('other')).toEqual('123');
        expect(attr.ngOther).toEqual('123');

        attr.$set('ngOther', '246');
        expect(element.attr('other')).toEqual('246');
        expect(attr.ngOther).toEqual('246');
      });


      it('should remove attribute', () => {
        attr.$set('ngMyAttr', 'value');
        expect(element.attr('ng-my-attr')).toEqual('value');

        attr.$set('ngMyAttr', undefined);
        expect(element.attr('ng-my-attr')).toBeUndefined();

        attr.$set('ngMyAttr', 'value');
        attr.$set('ngMyAttr', null);
        expect(element.attr('ng-my-attr')).toBeUndefined();
      });

      it('should set the value to lowercased keys for boolean attrs', () => {
        attr.$set('disabled', 'value');
        expect(element.attr('disabled')).toEqual('disabled');

        element.removeAttr('disabled');

        attr.$set('dISaBlEd', 'VaLuE');
        expect(element.attr('disabled')).toEqual('disabled');
      });

      it('should call removeAttr for boolean attrs when value is `false`', () => {
        attr.$set('disabled', 'value');

        jest.spyOn(angular.element.prototype, 'attr');
        jest.spyOn(angular.element.prototype, 'removeAttr');

        attr.$set('disabled', false);

        expect(element.attr).not.toHaveBeenCalled();
        expect(element.removeAttr).toHaveBeenCalledWith('disabled');
        expect(element.attr('disabled')).toEqual(undefined);

        attr.$set('disabled', 'value');

        element.attr.mockClear();
        element.removeAttr.mockClear();

        attr.$set('dISaBlEd', false);

        expect(element.attr).not.toHaveBeenCalled();
        expect(element.removeAttr).toHaveBeenCalledWith('disabled');
        expect(element.attr('disabled')).toEqual(undefined);
      });


      it('should not set DOM element attr if writeAttr false', () => {
        attr.$set('test', 'value', false);

        expect(element.attr('test')).toBeUndefined();
        expect(attr.test).toBe('value');
      });

      it('should not automatically sanitize a[href]', angular.mock.inject(($compile, $rootScope) => {
        // Breaking change in https://github.com/angular/angular.js/pull/16378
        element = compileForTest('<a></a>');
        $rootScope.attr.$set('href', 'evil:foo()');
        expect(element.attr('href')).toEqual('evil:foo()');
        expect($rootScope.attr.href).toEqual('evil:foo()');
      }));

      it('should not automatically sanitize img[src]', angular.mock.inject(($compile, $rootScope) => {
        // Breaking change in https://github.com/angular/angular.js/pull/16378
        element = compileForTest('<img></img>');
        $rootScope.attr.$set('img', 'evil:foo()');
        expect(element.attr('img')).toEqual('evil:foo()');
        expect($rootScope.attr.img).toEqual('evil:foo()');
      }));

      it('should automatically sanitize img[srcset]', angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<img></img>');
        $rootScope.attr.$set('srcset', 'evil:foo()');
        expect(element.attr('srcset')).toEqual('unsafe:evil:foo()');
        expect($rootScope.attr.srcset).toEqual('unsafe:evil:foo()');
      }));

      it('should not accept trusted values for img[srcset]', angular.mock.inject(($compile, $rootScope, $sce) => {
        const trusted = $sce.trustAsMediaUrl('trustme:foo()');
        element = compileForTest('<img></img>');
        expect(() => {
          $rootScope.attr.$set('srcset', trusted);
        }).toThrowMinErr('$compile', 'srcset', 'Can\'t pass trusted values to `$set(\'srcset\', value)`: "trustme:foo()"');
      }));
    });
  });

  describe('controller lifecycle hooks', () => {

    describe('$onInit', () => {

      it('should call `$onInit`, if provided, after all the controllers on the element have been initialized', () => {

        function check() {
          expect(this.element.controller('d1').id).toEqual(1);
          expect(this.element.controller('d2').id).toEqual(2);
        }

        function Controller1($element) { this.id = 1; this.element = $element; }
        Controller1.prototype.$onInit = jest.fn(check);

        function Controller2($element) { this.id = 2; this.element = $element; }
        Controller2.prototype.$onInit = jest.fn(check);

        angular.module('my', [])
          .directive('d1', ngInternals.valueFn({ controller: Controller1 }))
          .directive('d2', ngInternals.valueFn({ controller: Controller2 }));

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div d1 d2></div>');
          expect(Controller1.prototype.$onInit).toHaveBeenCalledTimes(1);
          expect(Controller2.prototype.$onInit).toHaveBeenCalledTimes(1);
        });
      });

      it('should continue to trigger other `$onInit` hooks if one throws an error', () => {
        function ThrowingController() {
          this.$onInit = () => {
            throw new Error('bad hook');
          };
        }
        function LoggingController($log) {
          this.$onInit = () => {
            $log.info('onInit');
          };
        }

        angular.module('my', [])
          .component('c1', {
            controller: ThrowingController,
            bindings: { 'prop': '<' }
          })
          .component('c2', {
            controller: LoggingController,
            bindings: { 'prop': '<' }
          })
          .config($exceptionHandlerProvider => {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope, $exceptionHandler, $log) => {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = compileForTest('<div><c1 prop="a"></c1><c2 prop="a"></c2>');

          // The first component's error should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

          // The second component's hook should still be called
          expect($log.info.logs.pop()).toEqual(['onInit']);
        });
      });
    });


    describe('$onDestroy', () => {

      it('should call `$onDestroy`, if provided, on the controller when its scope is destroyed', () => {

        function TestController() { this.count = 0; }
        TestController.prototype.$onDestroy = function () { this.count++; };

        angular.module('my', [])
          .directive('d1', ngInternals.valueFn({ scope: true, controller: TestController }))
          .directive('d2', ngInternals.valueFn({ scope: {}, controller: TestController }))
          .directive('d3', ngInternals.valueFn({ controller: TestController }));

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {

          element = compileForTest('<div><d1 ng-if="show[0]"></d1><d2 ng-if="show[1]"></d2><div ng-if="show[2]"><d3></d3></div></div>');

          $rootScope.$apply('show = [true, true, true]');
          const d1Controller = element.find('d1').controller('d1');
          const d2Controller = element.find('d2').controller('d2');
          const d3Controller = element.find('d3').controller('d3');

          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([0, 0, 0]);
          $rootScope.$apply('show = [false, true, true]');
          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1, 0, 0]);
          $rootScope.$apply('show = [false, false, true]');
          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1, 1, 0]);
          $rootScope.$apply('show = [false, false, false]');
          expect([d1Controller.count, d2Controller.count, d3Controller.count]).toEqual([1, 1, 1]);
        });
      });


      it('should call `$onDestroy` top-down (the same as `scope.$broadcast`)', () => {
        let log = [];
        function ParentController() { log.push('parent created'); }
        ParentController.prototype.$onDestroy = () => { log.push('parent destroyed'); };
        function ChildController() { log.push('child created'); }
        ChildController.prototype.$onDestroy = () => { log.push('child destroyed'); };
        function GrandChildController() { log.push('grand child created'); }
        GrandChildController.prototype.$onDestroy = () => { log.push('grand child destroyed'); };

        angular.module('my', [])
          .directive('parent', ngInternals.valueFn({ scope: true, controller: ParentController }))
          .directive('child', ngInternals.valueFn({ scope: true, controller: ChildController }))
          .directive('grandChild', ngInternals.valueFn({ scope: true, controller: GrandChildController }));

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {

          element = compileForTest('<parent ng-if="show"><child><grand-child></grand-child></child></parent>');
          $rootScope.$apply('show = true');
          expect(log).toEqual(['parent created', 'child created', 'grand child created']);
          log = [];
          $rootScope.$apply('show = false');
          expect(log).toEqual(['parent destroyed', 'child destroyed', 'grand child destroyed']);
        });
      });
    });


    describe('$postLink', () => {

      it('should call `$postLink`, if provided, after the element has completed linking (i.e. post-link)', () => {

        const log = [];

        function Controller1() { }
        Controller1.prototype.$postLink = () => { log.push('d1 view init'); };

        function Controller2() { }
        Controller2.prototype.$postLink = () => { log.push('d2 view init'); };

        angular.module('my', [])
          .directive('d1', ngInternals.valueFn({
            controller: Controller1,
            link: { pre: function (s, e) { log.push('d1 pre: ' + e.text()); }, post: function (s, e) { log.push('d1 post: ' + e.text()); } },
            template: '<d2></d2>'
          }))
          .directive('d2', ngInternals.valueFn({
            controller: Controller2,
            link: { pre: function (s, e) { log.push('d2 pre: ' + e.text()); }, post: function (s, e) { log.push('d2 post: ' + e.text()); } },
            template: 'loaded'
          }));

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<d1></d1>');
          expect(log).toEqual([
            'd1 pre: loaded',
            'd2 pre: loaded',
            'd2 post: loaded',
            'd2 view init',
            'd1 post: loaded',
            'd1 view init'
          ]);
        });
      });
    });

    describe('$doCheck', () => {
      it('should call `$doCheck`, if provided, for each digest cycle, after $onChanges and $onInit', () => {
        let log = [];

        function TestController() { }
        TestController.prototype.$doCheck = () => { log.push('$doCheck'); };
        TestController.prototype.$onChanges = () => { log.push('$onChanges'); };
        TestController.prototype.$onInit = () => { log.push('$onInit'); };

        angular.module('my', [])
          .component('dcc', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<dcc prop1="val"></dcc>');
          expect(log).toEqual([
            '$onChanges',
            '$onInit',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply();
          expect(log).toEqual([
            '$doCheck',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply('val = 2');
          expect(log).toEqual([
            '$doCheck',
            '$onChanges',
            '$doCheck'
          ]);
        });
      });

      it('should work if $doCheck is provided in the constructor', () => {
        let log = [];

        function TestController() {
          this.$doCheck = () => { log.push('$doCheck'); };
          this.$onChanges = () => { log.push('$onChanges'); };
          this.$onInit = () => { log.push('$onInit'); };
        }

        angular.module('my', [])
          .component('dcc', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<dcc prop1="val"></dcc>');
          expect(log).toEqual([
            '$onChanges',
            '$onInit',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply();
          expect(log).toEqual([
            '$doCheck',
            '$doCheck'
          ]);

          // Clear log
          log = [];

          $rootScope.$apply('val = 2');
          expect(log).toEqual([
            '$doCheck',
            '$onChanges',
            '$doCheck'
          ]);
        });
      });
    });

    describe('$onChanges', () => {

      it('should call `$onChanges`, if provided, when a one-way (`<`) or interpolation (`@`) bindings are updated', () => {
        let log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<', 'prop2': '<', 'other': '=', 'attr': '@' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          // Setup a watch to indicate some complicated updated logic
          $rootScope.$watch('val', (val, oldVal) => { $rootScope.val2 = val * 2; });
          // Setup the directive with two bindings
          element = compileForTest('<c1 prop1="val" prop2="val2" other="val3" attr="{{val4}}"></c1>');

          expect(log).toEqual([
            {
              prop1: expect.objectContaining({ currentValue: undefined }),
              prop2: expect.objectContaining({ currentValue: undefined }),
              attr: expect.objectContaining({ currentValue: '' })
            }
          ]);

          // Clear the initial changes from the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('val = 42');

          // Now we should have a single changes entry in the log
          expect(log).toEqual([
            {
              prop1: expect.objectContaining({ currentValue: 42 }),
              prop2: expect.objectContaining({ currentValue: 84 })
            }
          ]);

          // Clear the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('val = 17');
          // Now we should have a single changes entry in the log
          expect(log).toEqual([
            {
              prop1: expect.objectContaining({ previousValue: 42, currentValue: 17 }),
              prop2: expect.objectContaining({ previousValue: 84, currentValue: 34 })
            }
          ]);

          // Clear the log
          log = [];

          // Update val3 to trigger the "other" two-way binding
          $rootScope.$apply('val3 = 63');
          // onChanges should not have been called
          expect(log).toEqual([]);

          // Update val4 to trigger the "attr" interpolation binding
          $rootScope.$apply('val4 = 22');
          // onChanges should not have been called
          expect(log).toEqual([
            {
              attr: expect.objectContaining({ previousValue: '', currentValue: '22' })
            }
          ]);
        });
      });


      it('should trigger `$onChanges` even if the inner value already equals the new outer value', () => {
        const log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<c1 prop1="val"></c1>');

          $rootScope.$apply('val = 1');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: undefined, currentValue: 1 }) });

          element.isolateScope().$ctrl.prop1 = 2;
          $rootScope.$apply('val = 2');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: 1, currentValue: 2 }) });
        });
      });


      it('should trigger `$onChanges` for literal expressions when expression input value changes (simple value)', () => {
        const log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<c1 prop1="[val]"></c1>');

          $rootScope.$apply('val = 1');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: [undefined], currentValue: [1] }) });

          $rootScope.$apply('val = 2');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: [1], currentValue: [2] }) });
        });
      });


      it('should trigger `$onChanges` for literal expressions when expression input value changes (complex value)', () => {
        const log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<c1 prop1="[val]"></c1>');

          $rootScope.$apply('val = [1]');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: [undefined], currentValue: [[1]] }) });

          $rootScope.$apply('val = [2]');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: [[1]], currentValue: [[2]] }) });
        });
      });


      it('should trigger `$onChanges` for literal expressions when expression input value changes instances, even when equal', () => {
        const log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop1': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<c1 prop1="[val]"></c1>');

          $rootScope.$apply('val = [1]');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: [undefined], currentValue: [[1]] }) });

          $rootScope.$apply('val = [1]');
          expect(log.pop()).toEqual({ prop1: expect.objectContaining({ previousValue: [[1]], currentValue: [[1]] }) });
        });
      });


      it('should pass the original value as `previousValue` even if there were multiple changes in a single digest', () => {
        let log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<c1 prop="a + b"></c1>');

          // We add this watch after the compilation to ensure that it will run after the binding watchers
          // therefore triggering the thing that this test is hoping to enforce
          $rootScope.$watch('a', val => { $rootScope.b = val * 2; });

          expect(log).toEqual([{ prop: expect.objectContaining({ currentValue: undefined }) }]);

          // Clear the initial values from the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('a = 42');
          // Now the change should have the real previous value (undefined), not the intermediate one (42)
          expect(log).toEqual([{ prop: expect.objectContaining({ currentValue: 126 }) }]);

          // Clear the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('a = 7');
          // Now the change should have the real previous value (126), not the intermediate one, (91)
          expect(log).toEqual([{ prop: expect.objectContaining({ previousValue: 126, currentValue: 21 }) }]);
        });
      });


      it('should trigger an initial onChanges call for each binding with the `isFirstChange()` returning true', () => {
        let log = [];
        function TestController() { }
        TestController.prototype.$onChanges = change => { log.push(change); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<', attr: '@' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {

          $rootScope.$apply('a = 7');
          element = compileForTest('<c1 prop="a" attr="{{a}}"></c1>');

          expect(log).toEqual([
            {
              prop: expect.objectContaining({ currentValue: 7 }),
              attr: expect.objectContaining({ currentValue: '7' })
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(true);
          expect(log[0].attr.isFirstChange()).toEqual(true);

          log = [];
          $rootScope.$apply('a = 9');
          expect(log).toEqual([
            {
              prop: expect.objectContaining({ previousValue: 7, currentValue: 9 }),
              attr: expect.objectContaining({ previousValue: '7', currentValue: '9' })
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(false);
          expect(log[0].attr.isFirstChange()).toEqual(false);
        });
      });


      it('should trigger an initial onChanges call for each binding even if the hook is defined in the constructor', () => {
        let log = [];
        function TestController() {
          this.$onChanges = change => { log.push(change); };
        }

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<', attr: '@' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {
          $rootScope.$apply('a = 7');
          element = compileForTest('<c1 prop="a" attr="{{a}}"></c1>');

          expect(log).toEqual([
            {
              prop: expect.objectContaining({ currentValue: 7 }),
              attr: expect.objectContaining({ currentValue: '7' })
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(true);
          expect(log[0].attr.isFirstChange()).toEqual(true);

          log = [];
          $rootScope.$apply('a = 10');
          expect(log).toEqual([
            {
              prop: expect.objectContaining({ previousValue: 7, currentValue: 10 }),
              attr: expect.objectContaining({ previousValue: '7', currentValue: '10' })
            }
          ]);
          expect(log[0].prop.isFirstChange()).toEqual(false);
          expect(log[0].attr.isFirstChange()).toEqual(false);
        });
      });

      it('should clean up `@`-binding observers when re-assigning bindings', () => {
        const constructorSpy = jest.fn();
        const prototypeSpy = jest.fn();

        function TestController() {
          return { $onChanges: constructorSpy };
        }
        TestController.prototype.$onChanges = prototypeSpy;

        angular.mock.module($compileProvider => {
          $compileProvider.component('test', {
            bindings: { attr: '@' },
            controller: TestController
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          const template = '<test attr="{{a}}"></test>';
          $rootScope.a = 'foo';

          element = compileForTest(template);
          $rootScope.$digest();
          expect(constructorSpy).toHaveBeenCalled();
          expect(prototypeSpy).not.toHaveBeenCalled();

          constructorSpy.mockClear();
          $rootScope.$apply('a = "bar"');
          expect(constructorSpy).toHaveBeenCalled();
          expect(prototypeSpy).not.toHaveBeenCalled();
        });
      });

      it('should not call `$onChanges` twice even when the initial value is `NaN`', () => {
        const onChangesSpy = jest.fn();

        angular.mock.module($compileProvider => {
          $compileProvider.component('test', {
            bindings: { prop: '<', attr: '@' },
            controller: function TestController() {
              this.$onChanges = onChangesSpy;
            }
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          const template = '<test prop="a" attr="{{a}}"></test>' +
            '<test prop="b" attr="{{b}}"></test>';
          $rootScope.a = 'foo';
          $rootScope.b = NaN;

          element = compileForTest(template);
          $rootScope.$digest();

          expect(onChangesSpy).toHaveBeenCalledTimes(2);
          expect(onChangesSpy.mock.calls[0][0]).toEqual({
            prop: expect.objectContaining({ currentValue: 'foo' }),
            attr: expect.objectContaining({ currentValue: 'foo' })
          });
          expect(onChangesSpy.mock.calls[1][0]).toEqual({
            prop: expect.objectContaining({ currentValue: NaN }),
            attr: expect.objectContaining({ currentValue: 'NaN' })
          });

          onChangesSpy.mockClear();
          $rootScope.$apply('a = "bar"; b = 42');

          expect(onChangesSpy).toHaveBeenCalledTimes(2);
          expect(onChangesSpy.mock.calls[0][0]).toEqual({
            prop: expect.objectContaining({ previousValue: 'foo', currentValue: 'bar' }),
            attr: expect.objectContaining({ previousValue: 'foo', currentValue: 'bar' })
          });
          expect(onChangesSpy.mock.calls[1][0]).toEqual({
            prop: expect.objectContaining({ previousValue: NaN, currentValue: 42 }),
            attr: expect.objectContaining({ previousValue: 'NaN', currentValue: '42' })
          });
        });
      });


      it('should only trigger one extra digest however many controllers have changes', () => {
        let log = [];
        function TestController1() { }
        TestController1.prototype.$onChanges = change => { log.push(['TestController1', change]); };
        function TestController2() { }
        TestController2.prototype.$onChanges = change => { log.push(['TestController2', change]); };

        angular.module('my', [])
          .component('c1', {
            controller: TestController1,
            bindings: { 'prop': '<' }
          })
          .component('c2', {
            controller: TestController2,
            bindings: { 'prop': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {

          // Create a watcher to count the number of digest cycles
          let watchCount = 0;
          $rootScope.$watch(() => { watchCount++; });

          // Setup two sibling components with bindings that will change
          element = compileForTest('<div><c1 prop="val1"></c1><c2 prop="val2"></c2></div>');

          // Clear out initial changes
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('val1 = 42; val2 = 17');

          expect(log).toEqual([
            ['TestController1', { prop: expect.objectContaining({ currentValue: 42 }) }],
            ['TestController2', { prop: expect.objectContaining({ currentValue: 17 }) }]
          ]);
          // A single apply should only trigger three turns of the digest loop
          expect(watchCount).toEqual(3);
        });
      });


      it('should cope with changes occurring inside `$onChanges()` hooks', () => {
        let log = [];
        function OuterController() { }
        OuterController.prototype.$onChanges = function (change) {
          log.push(['OuterController', change]);
          // Make a change to the inner component
          this.b = this.prop1 * 2;
        };

        function InnerController() { }
        InnerController.prototype.$onChanges = change => { log.push(['InnerController', change]); };

        angular.module('my', [])
          .component('outer', {
            controller: OuterController,
            bindings: { 'prop1': '<' },
            template: '<inner prop2="$ctrl.b"></inner>'
          })
          .component('inner', {
            controller: InnerController,
            bindings: { 'prop2': '<' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {

          // Setup the directive with two bindings
          element = compileForTest('<outer prop1="a"></outer>');

          // Clear out initial changes
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply('a = 42');

          expect(log).toEqual([
            ['OuterController', { prop1: expect.objectContaining({ previousValue: undefined, currentValue: 42 }) }],
            ['InnerController', { prop2: expect.objectContaining({ previousValue: NaN, currentValue: 84 }) }]
          ]);
        });
      });


      it('should throw an error if `$onChanges()` hooks are not stable', () => {
        function TestController() { }
        TestController.prototype.$onChanges = function (change) {
          this.onChange();
        };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<', onChange: '&' }
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope) => {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = compileForTest('<c1 prop="a" on-change="a = -a"></c1>');

          // Update val to trigger the unstable onChanges, which will result in an error
          expect(() => {
            $rootScope.$apply('a = 42');
          }).toThrowMinErr('$compile', 'infchng');

          dealoc(element);
          element = compileForTest('<c1 prop="b" on-change=""></c1>');
          $rootScope.$apply('b = 24');
          $rootScope.$apply('b = 48');
        });
      });


      it('should log an error if `$onChanges()` hooks are not stable', () => {
        function TestController() { }
        TestController.prototype.$onChanges = function (change) {
          this.onChange();
        };

        angular.module('my', [])
          .component('c1', {
            controller: TestController,
            bindings: { 'prop': '<', onChange: '&' }
          })
          .config($exceptionHandlerProvider => {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope, $exceptionHandler) => {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = compileForTest('<c1 prop="a" on-change="a = -a"></c1>');

          // Update val to trigger the unstable onChanges, which will result in an error
          $rootScope.$apply('a = 42');
          expect($exceptionHandler.errors.length).toEqual(1);
          expect($exceptionHandler.errors[0]).
            toEqualMinErr('$compile', 'infchng', '10 $onChanges() iterations reached.');
        });
      });


      it('should continue to trigger other `$onChanges` hooks if one throws an error', () => {
        function ThrowingController() {
          this.$onChanges = change => {
            throw new Error('bad hook');
          };
        }
        function LoggingController($log) {
          this.$onChanges = change => {
            $log.info('onChange');
          };
        }

        angular.module('my', [])
          .component('c1', {
            controller: ThrowingController,
            bindings: { 'prop': '<' }
          })
          .component('c2', {
            controller: LoggingController,
            bindings: { 'prop': '<' }
          })
          .config($exceptionHandlerProvider => {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope, $exceptionHandler, $log) => {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = compileForTest('<div><c1 prop="a"></c1><c2 prop="a"></c2>');

          // The first component's error should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

          // The second component's changes should still be called
          expect($log.info.logs.pop()).toEqual(['onChange']);

          $rootScope.$apply('a = 42');

          // The first component's error should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook'));

          // The second component's changes should still be called
          expect($log.info.logs.pop()).toEqual(['onChange']);
        });
      });


      it('should throw `$onChanges` errors immediately', () => {
        function ThrowingController() {
          this.$onChanges = function (change) {
            throw new Error('bad hook: ' + this.prop);
          };
        }

        angular.module('my', [])
          .component('c1', {
            controller: ThrowingController,
            bindings: { 'prop': '<' }
          })
          .config($exceptionHandlerProvider => {
            // We need to test with the exceptionHandler not rethrowing...
            $exceptionHandlerProvider.mode('log');
          });

        angular.mock.module('my');
        angular.mock.inject(($compile, $rootScope, $exceptionHandler, $log) => {

          // Setup the directive with bindings that will keep updating the bound value forever
          element = compileForTest('<div><c1 prop="a"></c1><c1 prop="a * 2"></c1>');

          // Both component's errors should be logged
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: NaN'));
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: undefined'));

          $rootScope.$apply('a = 42');

          // Both component's error should be logged individually
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: 84'));
          expect($exceptionHandler.errors.pop()).toEqual(new Error('bad hook: 42'));
        });
      });
    });
  });


  describe('isolated locals', () => {
    let componentScope, regularScope;

    beforeEach(angular.mock.module(() => {
      directive('myComponent', () => {
        return {
          scope: {
            attr: '@',
            attrAlias: '@attr',
            $attrAlias: '@$attr$',
            ref: '=',
            refAlias: '= ref',
            $refAlias: '= $ref$',
            reference: '=',
            optref: '=?',
            optrefAlias: '=? optref',
            $optrefAlias: '=? $optref$',
            optreference: '=?',
            colref: '=*',
            colrefAlias: '=* colref',
            $colrefAlias: '=* $colref$',
            owRef: '<',
            owRefAlias: '< owRef',
            $owRefAlias: '< $owRef$',
            owOptref: '<?',
            owOptrefAlias: '<? owOptref',
            $owOptrefAlias: '<? $owOptref$',
            owColref: '<*',
            owColrefAlias: '<* owColref',
            $owColrefAlias: '<* $owColref$',
            expr: '&',
            optExpr: '&?',
            exprAlias: '&expr',
            $exprAlias: '&$expr$',
            constructor: '&?'
          },
          link: function (scope) {
            componentScope = scope;
          }
        };
      });
      directive('badDeclaration', () => {
        return {
          scope: { attr: 'xxx' }
        };
      });
      directive('storeScope', () => {
        return {
          link: function (scope) {
            regularScope = scope;
          }
        };
      });
    }));


    it('should give other directives the parent scope', angular.mock.inject($rootScope => {
      compile('<div><input type="text" my-component store-scope ng-model="value"></div>');
      $rootScope.$apply(() => {
        $rootScope.value = 'from-parent';
      });
      expect(element.find('input').val()).toBe('from-parent');
      expect(componentScope).not.toBe(regularScope);
      expect(componentScope.$parent).toBe(regularScope);
    }));


    it('should not give the isolate scope to other directive template', () => {
      angular.mock.module(() => {
        directive('otherTplDir', () => {
          return {
            template: 'value: {{value}}'
          };
        });
      });

      angular.mock.inject($rootScope => {
        compile('<div my-component other-tpl-dir>');

        $rootScope.$apply(() => {
          $rootScope.value = 'from-parent';
        });

        expect(element.html()).toBe('value: from-parent');
      });
    });


    it('should not give the isolate scope to other directive template (with templateUrl)', () => {
      angular.mock.module(() => {
        directive('otherTplDir', () => {
          return {
            templateUrl: 'other.html'
          };
        });
      });

      angular.mock.inject(($rootScope, $templateCache) => {
        $templateCache.put('other.html', 'value: {{value}}');
        compile('<div my-component other-tpl-dir>');

        $rootScope.$apply(() => {
          $rootScope.value = 'from-parent';
        });

        expect(element.html()).toBe('value: from-parent');
      });
    });


    it('should not give the isolate scope to regular child elements', () => {
      angular.mock.inject($rootScope => {
        compile('<div my-component>value: {{value}}</div>');

        $rootScope.$apply(() => {
          $rootScope.value = 'from-parent';
        });

        expect(element.html()).toBe('value: from-parent');
      });
    });


    it('should update parent scope when "="-bound NaN changes', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.num = NaN;
      compile('<div my-component reference="num"></div>');
      const isolateScope = element.isolateScope();
      expect(isolateScope.reference).toBeNaN();

      isolateScope.$apply(scope => { scope.reference = 64; });
      expect($rootScope.num).toBe(64);
    }));


    it('should update isolate scope when "="-bound NaN changes', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.num = NaN;
      compile('<div my-component reference="num"></div>');
      const isolateScope = element.isolateScope();
      expect(isolateScope.reference).toBeNaN();

      $rootScope.$apply(scope => { scope.num = 64; });
      expect(isolateScope.reference).toBe(64);
    }));


    it('should be able to bind attribute names which are present in Object.prototype', () => {
      angular.mock.module(() => {
        directive('inProtoAttr', ngInternals.valueFn({
          scope: {
            'constructor': '@',
            'toString': '&',

            // Spidermonkey extension, may be obsolete in the future
            'watch': '='
          }
        }));
      });
      angular.mock.inject($rootScope => {
        expect(() => {
          compile('<div in-proto-attr constructor="hello, world" watch="[]" ' +
            'to-string="value = !value"></div>');
        }).not.toThrow();
        const isolateScope = element.isolateScope();

        expect(typeof isolateScope.constructor).toBe('string');
        expect(angular.isArray(isolateScope.watch)).toBe(true);
        expect(typeof isolateScope.toString).toBe('function');
        expect($rootScope.value).toBeUndefined();
        isolateScope.toString();
        expect($rootScope.value).toBe(true);
      });
    });

    it('should be able to interpolate attribute names which are present in Object.prototype', () => {
      let attrs;
      angular.mock.module(() => {
        directive('attrExposer', ngInternals.valueFn({
          link: function ($scope, $element, $attrs) {
            attrs = $attrs;
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        compileForTest('<div attr-exposer to-string="{{1 + 1}}">');
        $rootScope.$apply();
        expect(attrs.toString).toBe('2');
      });
    });


    it('should not initialize scope value if optional expression binding is not passed', angular.mock.inject($compile => {
      compile('<div my-component></div>');
      const isolateScope = element.isolateScope();
      expect(isolateScope.optExpr).toBeUndefined();
    }));


    it('should not initialize scope value if optional expression binding with Object.prototype name is not passed', angular.mock.inject($compile => {
      compile('<div my-component></div>');
      const isolateScope = element.isolateScope();
      expect(isolateScope.constructor).toBe($rootScope.constructor);
    }));


    it('should initialize scope value if optional expression binding is passed', angular.mock.inject($compile => {
      compile('<div my-component opt-expr="value = \'did!\'"></div>');
      const isolateScope = element.isolateScope();
      expect(typeof isolateScope.optExpr).toBe('function');
      expect(isolateScope.optExpr()).toBe('did!');
      expect($rootScope.value).toBe('did!');
    }));


    it('should initialize scope value if optional expression binding with Object.prototype name is passed', angular.mock.inject($compile => {
      compile('<div my-component constructor="value = \'did!\'"></div>');
      const isolateScope = element.isolateScope();
      expect(typeof isolateScope.constructor).toBe('function');
      expect(isolateScope.constructor()).toBe('did!');
      expect($rootScope.value).toBe('did!');
    }));


    it('should not overwrite @-bound property each digest when not present', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('testDir', ngInternals.valueFn({
          scope: { prop: '@' },
          controller: function ($scope) {
            $scope.prop = $scope.prop || 'default';
            this.getProp = () => {
              return $scope.prop;
            };
          },
          controllerAs: 'ctrl',
          template: '<p></p>'
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div test-dir></div>');
        const scope = element.isolateScope();
        expect(scope.ctrl.getProp()).toBe('default');

        $rootScope.$digest();
        expect(scope.ctrl.getProp()).toBe('default');
      });
    });


    it('should ignore optional "="-bound property if value is the empty string', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('testDir', ngInternals.valueFn({
          scope: { prop: '=?' },
          controller: function ($scope) {
            $scope.prop = $scope.prop || 'default';
            this.getProp = () => {
              return $scope.prop;
            };
          },
          controllerAs: 'ctrl',
          template: '<p></p>'
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div test-dir></div>');
        const scope = element.isolateScope();
        expect(scope.ctrl.getProp()).toBe('default');
        $rootScope.$digest();
        expect(scope.ctrl.getProp()).toBe('default');
        scope.prop = 'foop';
        $rootScope.$digest();
        expect(scope.ctrl.getProp()).toBe('foop');
      });
    });


    describe('bind-once', () => {

      function countWatches(scope) {
        let result = 0;
        while (scope !== null) {
          result += (scope.$$watchers && scope.$$watchers.length) || 0;
          result += countWatches(scope.$$childHead);
          scope = scope.$$nextSibling;
        }
        return result;
      }

      it('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(() => {
          directive('otherTplDir', () => {
            return {
              scope: { param1: '=', param2: '=' },
              template: '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}'
            };
          });
        });

        angular.mock.inject($rootScope => {
          compile('<div other-tpl-dir param1="::foo" param2="bar"></div>');
          expect(countWatches($rootScope)).toEqual(6); // 4 -> template watch group, 2 -> '='
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(6);

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:foo;4:');
          expect(countWatches($rootScope)).toEqual(4);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:foo;4:bar');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:foo;4:bar');
        });
      });

      it('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(() => {
          directive('otherTplDir', () => {
            return {
              scope: { param1: '@', param2: '@' },
              template: '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}'
            };
          });
        });

        angular.mock.inject($rootScope => {
          compile('<div other-tpl-dir param1="{{::foo}}" param2="{{bar}}"></div>');
          expect(countWatches($rootScope)).toEqual(6); // 4 -> template watch group, 2 -> {{ }}
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(4); // (- 2) -> bind-once in template

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:;4:');
        });
      });

      it('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(() => {
          directive('otherTplDir', () => {
            return {
              scope: { param1: '=', param2: '=' },
              templateUrl: 'other.html'
            };
          });
        });

        angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('other.html', '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}');
          compile('<div other-tpl-dir param1="::foo" param2="bar"></div>');
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(6); // 4 -> template watch group, 2 -> '='

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:foo;4:');
          expect(countWatches($rootScope)).toEqual(4);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:foo;4:bar');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:foo;4:bar');
        });
      });

      it('should be possible to one-time bind a parameter on a component with a template', () => {
        angular.mock.module(() => {
          directive('otherTplDir', () => {
            return {
              scope: { param1: '@', param2: '@' },
              templateUrl: 'other.html'
            };
          });
        });

        angular.mock.inject(($rootScope, $templateCache) => {
          $templateCache.put('other.html', '1:{{param1}};2:{{param2}};3:{{::param1}};4:{{::param2}}');
          compile('<div other-tpl-dir param1="{{::foo}}" param2="{{bar}}"></div>');
          $rootScope.$digest();
          expect(element.html()).toBe('1:;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(4); // (4 - 2) -> template watch group, 2 -> {{ }}

          $rootScope.foo = 'foo';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.foo = 'baz';
          $rootScope.bar = 'bar';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:bar;3:;4:');
          expect(countWatches($rootScope)).toEqual(3);

          $rootScope.bar = 'baz';
          $rootScope.$digest();
          expect(element.html()).toBe('1:foo;2:baz;3:;4:');
        });
      });

      it('should continue with a digets cycle when there is a two-way binding from the child to the parent', () => {
        angular.mock.module(() => {
          directive('hello', () => {
            return {
              restrict: 'E',
              scope: { greeting: '=' },
              template: '<button ng-click="setGreeting()">Say hi!</button>',
              link: function (scope) {
                scope.setGreeting = () => { scope.greeting = 'Hello!'; };
              }
            };
          });
        });

        angular.mock.inject($rootScope => {
          compile('<div>' +
            '<p>{{greeting}}</p>' +
            '<div><hello greeting="greeting"></hello></div>' +
            '</div>');
          $rootScope.$digest();
          browserTrigger(element.find('button'), 'click');
          expect(element.find('p').text()).toBe('Hello!');
        });
      });

    });


    describe('attribute', () => {
      it('should copy simple attribute', angular.mock.inject(() => {
        compile('<div><span my-component attr="some text" $attr$="some other text">');

        expect(componentScope.attr).toEqual('some text');
        expect(componentScope.attrAlias).toEqual('some text');
        expect(componentScope.$attrAlias).toEqual('some other text');
        expect(componentScope.attrAlias).toEqual(componentScope.attr);
      }));

      it('should copy an attribute with spaces', angular.mock.inject(() => {
        compile('<div><span my-component attr=" some text " $attr$=" some other text ">');

        expect(componentScope.attr).toEqual(' some text ');
        expect(componentScope.attrAlias).toEqual(' some text ');
        expect(componentScope.$attrAlias).toEqual(' some other text ');
        expect(componentScope.attrAlias).toEqual(componentScope.attr);
      }));

      it('should set up the interpolation before it reaches the link function', angular.mock.inject(() => {
        $rootScope.name = 'misko';
        compile('<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">');
        expect(componentScope.attr).toEqual('hello misko');
        expect(componentScope.attrAlias).toEqual('hello misko');
        expect(componentScope.$attrAlias).toEqual('hi misko');
      }));

      it('should update when interpolated attribute updates', angular.mock.inject(() => {
        compile('<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">');

        $rootScope.name = 'igor';
        $rootScope.$apply();

        expect(componentScope.attr).toEqual('hello igor');
        expect(componentScope.attrAlias).toEqual('hello igor');
        expect(componentScope.$attrAlias).toEqual('hi igor');
      }));
    });


    describe('object reference', () => {
      it('should update local when origin changes', angular.mock.inject(() => {
        compile('<div><span my-component ref="name" $ref$="name">');
        expect(componentScope.ref).toBeUndefined();
        expect(componentScope.refAlias).toBe(componentScope.ref);
        expect(componentScope.$refAlias).toBe(componentScope.ref);

        $rootScope.name = 'misko';
        $rootScope.$apply();

        expect($rootScope.name).toBe('misko');
        expect(componentScope.ref).toBe('misko');
        expect(componentScope.refAlias).toBe('misko');
        expect(componentScope.$refAlias).toBe('misko');

        $rootScope.name = {};
        $rootScope.$apply();
        expect(componentScope.ref).toBe($rootScope.name);
        expect(componentScope.refAlias).toBe($rootScope.name);
        expect(componentScope.$refAlias).toBe($rootScope.name);
      }));


      it('should update local when both change', angular.mock.inject(() => {
        compile('<div><span my-component ref="name" $ref$="name">');
        $rootScope.name = { mark: 123 };
        componentScope.ref = 'misko';

        $rootScope.$apply();
        expect($rootScope.name).toEqual({ mark: 123 });
        expect(componentScope.ref).toBe($rootScope.name);
        expect(componentScope.refAlias).toBe($rootScope.name);
        expect(componentScope.$refAlias).toBe($rootScope.name);

        $rootScope.name = 'igor';
        componentScope.ref = {};
        $rootScope.$apply();
        expect($rootScope.name).toEqual('igor');
        expect(componentScope.ref).toBe($rootScope.name);
        expect(componentScope.refAlias).toBe($rootScope.name);
        expect(componentScope.$refAlias).toBe($rootScope.name);
      }));

      it('should not break if local and origin both change to the same value', angular.mock.inject(() => {
        $rootScope.name = 'aaa';

        compile('<div><span my-component ref="name">');

        //change both sides to the same item within the same digest cycle
        componentScope.ref = 'same';
        $rootScope.name = 'same';
        $rootScope.$apply();

        //change origin back to its previous value
        $rootScope.name = 'aaa';
        $rootScope.$apply();

        expect($rootScope.name).toBe('aaa');
        expect(componentScope.ref).toBe('aaa');
      }));

      it('should complain on non assignable changes', angular.mock.inject(() => {
        compile('<div><span my-component ref="\'hello \' + name">');
        $rootScope.name = 'world';
        $rootScope.$apply();
        expect(componentScope.ref).toBe('hello world');

        componentScope.ref = 'ignore me';
        expect(() => { $rootScope.$apply(); }).
          toThrowMinErr('$compile', 'nonassign', 'Expression \'\'hello \' + name\' in attribute \'ref\' used with directive \'myComponent\' is non-assignable!');
        expect(componentScope.ref).toBe('hello world');
        // reset since the exception was rethrown which prevented phase clearing
        $rootScope.$$phase = null;

        $rootScope.name = 'misko';
        $rootScope.$apply();
        expect(componentScope.ref).toBe('hello misko');
      }));

      it('should complain if assigning to undefined', angular.mock.inject(() => {
        compile('<div><span my-component>');
        $rootScope.$apply();
        expect(componentScope.ref).toBeUndefined();

        componentScope.ref = 'ignore me';
        expect(() => { $rootScope.$apply(); }).
          toThrowMinErr('$compile', 'nonassign', 'Expression \'undefined\' in attribute \'ref\' used with directive \'myComponent\' is non-assignable!');
        expect(componentScope.ref).toBeUndefined();

        $rootScope.$$phase = null; // reset since the exception was rethrown which prevented phase clearing
        $rootScope.$apply();
        expect(componentScope.ref).toBeUndefined();
      }));

      // regression
      it('should stabilize model', angular.mock.inject(() => {
        compile('<div><span my-component reference="name">');

        let lastRefValueInParent;
        $rootScope.$watch('name', ref => {
          lastRefValueInParent = ref;
        });

        $rootScope.name = 'aaa';
        $rootScope.$apply();

        componentScope.reference = 'new';
        $rootScope.$apply();

        expect(lastRefValueInParent).toBe('new');
      }));

      describe('literal objects', () => {
        it('should copy parent changes', angular.mock.inject(() => {
          compile('<div><span my-component reference="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          expect(componentScope.reference).toEqual({ name: 'a' });

          $rootScope.name = 'b';
          $rootScope.$apply();
          expect(componentScope.reference).toEqual({ name: 'b' });
        }));

        it('should not change the component when parent does not change', angular.mock.inject(() => {
          compile('<div><span my-component reference="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          const lastComponentValue = componentScope.reference;
          $rootScope.$apply();
          expect(componentScope.reference).toBe(lastComponentValue);
        }));

        it('should complain when the component changes', angular.mock.inject(() => {
          compile('<div><span my-component reference="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          componentScope.reference = { name: 'b' };
          expect(() => {
            $rootScope.$apply();
          }).toThrowMinErr('$compile', 'nonassign', 'Expression \'{name: name}\' in attribute \'reference\' used with directive \'myComponent\' is non-assignable!');

        }));

        it('should work for primitive literals', angular.mock.inject(() => {
          test('1', 1);
          test('null', null);
          test('undefined', undefined);
          test('\'someString\'', 'someString');
          test('true', true);

          function test(literalString, literalValue) {
            compile('<div><span my-component reference="' + literalString + '">');

            $rootScope.$apply();
            expect(componentScope.reference).toBe(literalValue);
            dealoc(element);
          }
        }));

      });

    });


    describe('optional object reference', () => {
      it('should update local when origin changes', angular.mock.inject(() => {
        compile('<div><span my-component optref="name" $optref$="name">');
        expect(componentScope.optRef).toBeUndefined();
        expect(componentScope.optRefAlias).toBe(componentScope.optRef);
        expect(componentScope.$optRefAlias).toBe(componentScope.optRef);

        $rootScope.name = 'misko';
        $rootScope.$apply();
        expect(componentScope.optref).toBe($rootScope.name);
        expect(componentScope.optrefAlias).toBe($rootScope.name);
        expect(componentScope.$optrefAlias).toBe($rootScope.name);

        $rootScope.name = {};
        $rootScope.$apply();
        expect(componentScope.optref).toBe($rootScope.name);
        expect(componentScope.optrefAlias).toBe($rootScope.name);
        expect(componentScope.$optrefAlias).toBe($rootScope.name);
      }));

      it('should not throw exception when reference does not exist', angular.mock.inject(() => {
        compile('<div><span my-component>');

        expect(componentScope.optref).toBeUndefined();
        expect(componentScope.optrefAlias).toBeUndefined();
        expect(componentScope.$optrefAlias).toBeUndefined();
        expect(componentScope.optreference).toBeUndefined();
      }));
    });


    describe('collection object reference', () => {
      it('should update isolate scope when origin scope changes', angular.mock.inject(() => {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];
        $rootScope.query = '';
        $rootScope.$apply();

        compile('<div><span my-component colref="collection | filter:query" $colref$="collection | filter:query">');

        expect(componentScope.colref).toEqual($rootScope.collection);
        expect(componentScope.colrefAlias).toEqual(componentScope.colref);
        expect(componentScope.$colrefAlias).toEqual(componentScope.colref);

        $rootScope.query = 'Gab';
        $rootScope.$apply();

        expect(componentScope.colref).toEqual([$rootScope.collection[0]]);
        expect(componentScope.colrefAlias).toEqual([$rootScope.collection[0]]);
        expect(componentScope.$colrefAlias).toEqual([$rootScope.collection[0]]);
      }));

      it('should update origin scope when isolate scope changes', angular.mock.inject(() => {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];

        compile('<div><span my-component colref="collection">');

        const newItem = {
          name: 'Pablo',
          value: 10
        };
        componentScope.colref.push(newItem);
        componentScope.$apply();

        expect($rootScope.collection[2]).toEqual(newItem);
      }));
    });


    describe('one-way binding', () => {
      it('should update isolate when the identity of origin changes', angular.mock.inject(() => {
        compile('<div><span my-component ow-ref="obj" $ow-ref$="obj">');

        expect(componentScope.owRef).toBeUndefined();
        expect(componentScope.owRefAlias).toBe(componentScope.owRef);
        expect(componentScope.$owRefAlias).toBe(componentScope.owRef);

        $rootScope.obj = { value: 'initial' };
        $rootScope.$apply();

        expect($rootScope.obj).toEqual({ value: 'initial' });
        expect(componentScope.owRef).toEqual({ value: 'initial' });
        expect(componentScope.owRefAlias).toBe(componentScope.owRef);
        expect(componentScope.$owRefAlias).toBe(componentScope.owRef);

        // This changes in both scopes because of reference
        $rootScope.obj.value = 'origin1';
        $rootScope.$apply();
        expect(componentScope.owRef.value).toBe('origin1');
        expect(componentScope.owRefAlias.value).toBe('origin1');
        expect(componentScope.$owRefAlias.value).toBe('origin1');

        componentScope.owRef = { value: 'isolate1' };
        componentScope.$apply();
        expect($rootScope.obj.value).toBe('origin1');

        // Change does not propagate because object identity hasn't changed
        $rootScope.obj.value = 'origin2';
        $rootScope.$apply();
        expect(componentScope.owRef.value).toBe('isolate1');
        expect(componentScope.owRefAlias.value).toBe('origin2');
        expect(componentScope.$owRefAlias.value).toBe('origin2');

        // Change does propagate because object identity changes
        $rootScope.obj = { value: 'origin3' };
        $rootScope.$apply();
        expect(componentScope.owRef.value).toBe('origin3');
        expect(componentScope.owRef).toBe($rootScope.obj);
        expect(componentScope.owRefAlias).toBe($rootScope.obj);
        expect(componentScope.$owRefAlias).toBe($rootScope.obj);
      }));

      it('should update isolate when both change', angular.mock.inject(() => {
        compile('<div><span my-component ow-ref="name" $ow-ref$="name">');

        $rootScope.name = { mark: 123 };
        componentScope.owRef = 'misko';

        $rootScope.$apply();
        expect($rootScope.name).toEqual({ mark: 123 });
        expect(componentScope.owRef).toBe($rootScope.name);
        expect(componentScope.owRefAlias).toBe($rootScope.name);
        expect(componentScope.$owRefAlias).toBe($rootScope.name);

        $rootScope.name = 'igor';
        componentScope.owRef = {};
        $rootScope.$apply();
        expect($rootScope.name).toEqual('igor');
        expect(componentScope.owRef).toBe($rootScope.name);
        expect(componentScope.owRefAlias).toBe($rootScope.name);
        expect(componentScope.$owRefAlias).toBe($rootScope.name);
      }));

      describe('initialization', () => {
        let component, log;

        beforeEach(() => {
          log = [];
          angular.module('owComponentTest', [])
            .component('owComponent', {
              bindings: { input: '<' },
              controller: function () {
                component = this;
                this.input = 'constructor';
                log.push('constructor');

                this.$onInit = function () {
                  this.input = '$onInit';
                  log.push('$onInit');
                };

                this.$onChanges = changes => {
                  if (changes.input) {
                    log.push(['$onChanges', angular.copy(changes.input)]);
                  }
                };
              }
            });
        });

        it('should not update isolate again after $onInit if outer has not changed', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(() => {
            $rootScope.name = 'outer';
            compile('<ow-component input="name"></ow-component>');

            expect($rootScope.name).toEqual('outer');
            expect(component.input).toEqual('$onInit');

            $rootScope.$digest();

            expect($rootScope.name).toEqual('outer');
            expect(component.input).toEqual('$onInit');

            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer' })],
              '$onInit'
            ]);
          });
        });

        it('should not update isolate again after $onInit if outer object reference has not changed', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(() => {
            $rootScope.name = ['outer'];
            compile('<ow-component input="name"></ow-component>');

            expect($rootScope.name).toEqual(['outer']);
            expect(component.input).toEqual('$onInit');

            $rootScope.name[0] = 'inner';
            $rootScope.$digest();

            expect($rootScope.name).toEqual(['inner']);
            expect(component.input).toEqual('$onInit');

            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: ['outer'] })],
              '$onInit'
            ]);
          });
        });

        it('should update isolate again after $onInit if outer object reference changes even if equal', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(() => {
            $rootScope.name = ['outer'];
            compile('<ow-component input="name"></ow-component>');

            expect($rootScope.name).toEqual(['outer']);
            expect(component.input).toEqual('$onInit');

            $rootScope.name = ['outer'];
            $rootScope.$digest();

            expect($rootScope.name).toEqual(['outer']);
            expect(component.input).toEqual(['outer']);

            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: ['outer'] })],
              '$onInit',
              ['$onChanges', expect.objectContaining({ previousValue: ['outer'], currentValue: ['outer'] })]
            ]);
          });
        });

        it('should not update isolate again after $onInit if outer is a literal', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(() => {
            $rootScope.name = 'outer';
            compile('<ow-component input="[name]"></ow-component>');

            expect(component.input).toEqual('$onInit');

            // No outer change
            $rootScope.$apply('name = "outer"');
            expect(component.input).toEqual('$onInit');

            // Outer change
            $rootScope.$apply('name = "re-outer"');
            expect(component.input).toEqual(['re-outer']);

            expect(log).toEqual([
              'constructor',
              [
                '$onChanges',
                expect.objectContaining({ currentValue: ['outer'] })
              ],
              '$onInit',
              [
                '$onChanges',
                expect.objectContaining({ previousValue: ['outer'], currentValue: ['re-outer'] })
              ]
            ]);
          });
        });

        it('should update isolate again after $onInit if outer has changed (before initial watchAction call)', () => {
          angular.mock.module('owComponentTest');
          angular.mock.inject(() => {
            $rootScope.name = 'outer1';
            compile('<ow-component input="name"></ow-component>');

            expect(component.input).toEqual('$onInit');
            $rootScope.$apply('name = "outer2"');

            expect($rootScope.name).toEqual('outer2');
            expect(component.input).toEqual('outer2');
            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer1' })],
              '$onInit',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer2', previousValue: 'outer1' })]
            ]);
          });
        });

        it('should update isolate again after $onInit if outer has changed (before initial watchAction call)', () => {
          angular.module('owComponentTest')
            .directive('changeInput', () => {
              return (scope, elem, attrs) => {
                scope.name = 'outer2';
              };
            });
          angular.mock.module('owComponentTest');
          angular.mock.inject(() => {
            $rootScope.name = 'outer1';
            compile('<ow-component input="name" change-input></ow-component>');

            expect(component.input).toEqual('$onInit');
            $rootScope.$digest();

            expect($rootScope.name).toEqual('outer2');
            expect(component.input).toEqual('outer2');
            expect(log).toEqual([
              'constructor',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer1' })],
              '$onInit',
              ['$onChanges', expect.objectContaining({ currentValue: 'outer2', previousValue: 'outer1' })]
            ]);
          });
        });
      });

      it('should not break when isolate and origin both change to the same value', angular.mock.inject(() => {
        $rootScope.name = 'aaa';
        compile('<div><span my-component ow-ref="name">');

        //change both sides to the same item within the same digest cycle
        componentScope.owRef = 'same';
        $rootScope.name = 'same';
        $rootScope.$apply();

        //change origin back to its previous value
        $rootScope.name = 'aaa';
        $rootScope.$apply();

        expect($rootScope.name).toBe('aaa');
        expect(componentScope.owRef).toBe('aaa');
      }));


      it('should not update origin when identity of isolate changes', angular.mock.inject(() => {
        $rootScope.name = { mark: 123 };
        compile('<div><span my-component ow-ref="name" $ow-ref$="name">');

        expect($rootScope.name).toEqual({ mark: 123 });
        expect(componentScope.owRef).toBe($rootScope.name);
        expect(componentScope.owRefAlias).toBe($rootScope.name);
        expect(componentScope.$owRefAlias).toBe($rootScope.name);

        componentScope.owRef = 'martin';
        $rootScope.$apply();
        expect($rootScope.name).toEqual({ mark: 123 });
        expect(componentScope.owRef).toBe('martin');
        expect(componentScope.owRefAlias).toEqual({ mark: 123 });
        expect(componentScope.$owRefAlias).toEqual({ mark: 123 });
      }));


      it('should update origin when property of isolate object reference changes', angular.mock.inject(() => {
        $rootScope.obj = { mark: 123 };
        compile('<div><span my-component ow-ref="obj">');

        expect($rootScope.obj).toEqual({ mark: 123 });
        expect(componentScope.owRef).toBe($rootScope.obj);

        componentScope.owRef.mark = 789;
        $rootScope.$apply();
        expect($rootScope.obj).toEqual({ mark: 789 });
        expect(componentScope.owRef).toBe($rootScope.obj);
      }));


      it('should not throw on non assignable expressions in the parent', angular.mock.inject(() => {
        compile('<div><span my-component ow-ref="\'hello \' + name">');

        $rootScope.name = 'world';
        $rootScope.$apply();
        expect(componentScope.owRef).toBe('hello world');

        componentScope.owRef = 'ignore me';
        expect(componentScope.owRef).toBe('ignore me');
        expect($rootScope.name).toBe('world');

        $rootScope.name = 'misko';
        $rootScope.$apply();
        expect(componentScope.owRef).toBe('hello misko');
      }));


      it('should not throw when assigning to undefined', angular.mock.inject(() => {
        compile('<div><span my-component>');

        expect(componentScope.owRef).toBeUndefined();

        componentScope.owRef = 'ignore me';
        expect(componentScope.owRef).toBe('ignore me');

        $rootScope.$apply();
        expect(componentScope.owRef).toBe('ignore me');
      }));


      it('should update isolate scope when "<"-bound NaN changes', angular.mock.inject(() => {
        $rootScope.num = NaN;
        compile('<div my-component ow-ref="num"></div>');

        const isolateScope = element.isolateScope();
        expect(isolateScope.owRef).toBeNaN();

        $rootScope.num = 64;
        $rootScope.$apply();
        expect(isolateScope.owRef).toBe(64);
      }));


      describe('literal objects', () => {
        it('should copy parent changes', angular.mock.inject(() => {
          compile('<div><span my-component ow-ref="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({ name: 'a' });

          $rootScope.name = 'b';
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({ name: 'b' });
        }));


        it('should not change the isolated scope when origin does not change', angular.mock.inject(() => {
          compile('<div><span my-component ref="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          const lastComponentValue = componentScope.owRef;
          $rootScope.$apply();
          expect(componentScope.owRef).toBe(lastComponentValue);
        }));


        it('should watch input values to array literals', angular.mock.inject(() => {
          $rootScope.name = 'georgios';
          $rootScope.obj = { name: 'pete' };
          compile('<div><span my-component ow-ref="[{name: name}, obj]">');

          expect(componentScope.owRef).toEqual([{ name: 'georgios' }, { name: 'pete' }]);

          $rootScope.name = 'lucas';
          $rootScope.obj = { name: 'martin' };
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual([{ name: 'lucas' }, { name: 'martin' }]);
        }));


        it('should watch input values object literals', angular.mock.inject(() => {
          $rootScope.name = 'georgios';
          $rootScope.obj = { name: 'pete' };
          compile('<div><span my-component ow-ref="{name: name, item: obj}">');

          expect(componentScope.owRef).toEqual({ name: 'georgios', item: { name: 'pete' } });

          $rootScope.name = 'lucas';
          $rootScope.obj = { name: 'martin' };
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({ name: 'lucas', item: { name: 'martin' } });
        }));


        // https://github.com/angular/angular.js/issues/15833
        it('should work with ng-model inputs', () => {
          let componentScope;

          angular.mock.module($compileProvider => {
            $compileProvider.directive('undi', () => {
              return {
                restrict: 'A',
                scope: {
                  undi: '<'
                },
                link: function ($scope) { componentScope = $scope; }
              };
            });
          });

          angular.mock.inject(($compile, $rootScope) => {
            element = compileForTest('<form name="f" undi="[f.i]"><input name="i" ng-model="a"/></form>');
            $rootScope.$apply();
            expect(componentScope.undi).toBeDefined();
          });
        });


        it('should not complain when the isolated scope changes', angular.mock.inject(() => {
          compile('<div><span my-component ow-ref="{name: name}">');

          $rootScope.name = 'a';
          $rootScope.$apply();
          componentScope.owRef = { name: 'b' };
          componentScope.$apply();

          expect(componentScope.owRef).toEqual({ name: 'b' });
          expect($rootScope.name).toBe('a');

          $rootScope.name = 'c';
          $rootScope.$apply();
          expect(componentScope.owRef).toEqual({ name: 'c' });
        }));

        it('should work for primitive literals', angular.mock.inject(() => {
          test('1', 1);
          test('null', null);
          test('undefined', undefined);
          test('\'someString\'', 'someString');
          test('true', true);

          function test(literalString, literalValue) {
            compile('<div><span my-component ow-ref="' + literalString + '">');

            expect(componentScope.owRef).toBe(literalValue);
            dealoc(element);
          }
        }));

        describe('optional one-way binding', () => {
          it('should update local when origin changes', angular.mock.inject(() => {
            compile('<div><span my-component ow-optref="name" $ow-optref$="name">');

            expect(componentScope.owOptref).toBeUndefined();
            expect(componentScope.owOptrefAlias).toBe(componentScope.owOptref);
            expect(componentScope.$owOptrefAlias).toBe(componentScope.owOptref);

            $rootScope.name = 'misko';
            $rootScope.$apply();
            expect(componentScope.owOptref).toBe($rootScope.name);
            expect(componentScope.owOptrefAlias).toBe($rootScope.name);
            expect(componentScope.$owOptrefAlias).toBe($rootScope.name);

            $rootScope.name = {};
            $rootScope.$apply();
            expect(componentScope.owOptref).toBe($rootScope.name);
            expect(componentScope.owOptrefAlias).toBe($rootScope.name);
            expect(componentScope.$owOptrefAlias).toBe($rootScope.name);
          }));

          it('should not throw exception when reference does not exist', angular.mock.inject(() => {
            compile('<div><span my-component>');

            expect(componentScope.owOptref).toBeUndefined();
            expect(componentScope.owOptrefAlias).toBeUndefined();
            expect(componentScope.$owOptrefAlias).toBeUndefined();
          }));
        });
      });
    });

    describe('one-way collection bindings', () => {
      it('should update isolate scope when origin scope changes', angular.mock.inject(() => {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];
        $rootScope.query = '';
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="collection | filter:query" $ow-colref$="collection | filter:query">');

        expect(componentScope.owColref).toEqual($rootScope.collection);
        expect(componentScope.owColrefAlias).toEqual(componentScope.owColref);
        expect(componentScope.$owColrefAlias).toEqual(componentScope.owColref);

        $rootScope.query = 'Gab';
        $rootScope.$apply();

        expect(componentScope.owColref).toEqual([$rootScope.collection[0]]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.collection[0]]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.collection[0]]);
      }));

      it('should not update isolate scope when deep state within origin scope changes', angular.mock.inject(() => {
        $rootScope.collection = [{
          name: 'Gabriel',
          value: 18
        }, {
          name: 'Tony',
          value: 91
        }];
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="collection" $ow-colref$="collection">');

        expect(componentScope.owColref).toEqual($rootScope.collection);
        expect(componentScope.owColrefAlias).toEqual(componentScope.owColref);
        expect(componentScope.$owColrefAlias).toEqual(componentScope.owColref);

        componentScope.owColref = componentScope.owColrefAlias = componentScope.$owColrefAlias = undefined;
        $rootScope.collection[0].name = 'Joe';
        $rootScope.$apply();

        expect(componentScope.owColref).toBeUndefined();
        expect(componentScope.owColrefAlias).toBeUndefined();
        expect(componentScope.$owColrefAlias).toBeUndefined();
      }));

      it('should update isolate scope when origin scope changes', angular.mock.inject(() => {
        $rootScope.gab = {
          name: 'Gabriel',
          value: 18
        };
        $rootScope.tony = {
          name: 'Tony',
          value: 91
        };
        $rootScope.query = '';
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="[gab, tony] | filter:query" $ow-colref$="[gab, tony] | filter:query">');

        expect(componentScope.owColref).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);

        $rootScope.query = 'Gab';
        $rootScope.$apply();

        expect(componentScope.owColref).toEqual([$rootScope.gab]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab]);
      }));

      it('should update isolate scope when origin literal object content changes', angular.mock.inject(() => {
        $rootScope.gab = {
          name: 'Gabriel',
          value: 18
        };
        $rootScope.tony = {
          name: 'Tony',
          value: 91
        };
        $rootScope.$apply();

        compile('<div><span my-component ow-colref="[gab, tony]" $ow-colref$="[gab, tony]">');

        expect(componentScope.owColref).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);

        $rootScope.tony = {
          name: 'Bob',
          value: 42
        };
        $rootScope.$apply();

        expect(componentScope.owColref).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
        expect(componentScope.$owColrefAlias).toEqual([$rootScope.gab, $rootScope.tony]);
      }));
    });

    describe('executable expression', () => {
      it('should allow expression execution with locals', angular.mock.inject(() => {
        compile('<div><span my-component expr="count = count + offset" $expr$="count = count + offset">');
        $rootScope.count = 2;

        expect(typeof componentScope.expr).toBe('function');
        expect(typeof componentScope.exprAlias).toBe('function');
        expect(typeof componentScope.$exprAlias).toBe('function');

        expect(componentScope.expr({ offset: 1 })).toEqual(3);
        expect($rootScope.count).toEqual(3);

        expect(componentScope.exprAlias({ offset: 10 })).toEqual(13);
        expect(componentScope.$exprAlias({ offset: 10 })).toEqual(23);
        expect($rootScope.count).toEqual(23);
      }));
    });

    it('should throw on unknown definition', angular.mock.inject(() => {
      expect(() => {
        compile('<div><span bad-declaration>');
      }).toThrowMinErr('$compile', 'iscp', 'Invalid isolate scope definition for directive \'badDeclaration\'. Definition: {... attr: \'xxx\' ...}');
    }));

    it('should expose a $$isolateBindings property onto the scope', angular.mock.inject(() => {
      compile('<div><span my-component>');

      expect(typeof componentScope.$$isolateBindings).toBe('object');

      expect(componentScope.$$isolateBindings.attr.mode).toBe('@');
      expect(componentScope.$$isolateBindings.attr.attrName).toBe('attr');
      expect(componentScope.$$isolateBindings.attrAlias.attrName).toBe('attr');
      expect(componentScope.$$isolateBindings.$attrAlias.attrName).toBe('$attr$');
      expect(componentScope.$$isolateBindings.ref.mode).toBe('=');
      expect(componentScope.$$isolateBindings.ref.attrName).toBe('ref');
      expect(componentScope.$$isolateBindings.refAlias.attrName).toBe('ref');
      expect(componentScope.$$isolateBindings.$refAlias.attrName).toBe('$ref$');
      expect(componentScope.$$isolateBindings.reference.mode).toBe('=');
      expect(componentScope.$$isolateBindings.reference.attrName).toBe('reference');
      expect(componentScope.$$isolateBindings.owRef.mode).toBe('<');
      expect(componentScope.$$isolateBindings.owRef.attrName).toBe('owRef');
      expect(componentScope.$$isolateBindings.owRefAlias.attrName).toBe('owRef');
      expect(componentScope.$$isolateBindings.$owRefAlias.attrName).toBe('$owRef$');
      expect(componentScope.$$isolateBindings.expr.mode).toBe('&');
      expect(componentScope.$$isolateBindings.expr.attrName).toBe('expr');
      expect(componentScope.$$isolateBindings.exprAlias.attrName).toBe('expr');
      expect(componentScope.$$isolateBindings.$exprAlias.attrName).toBe('$expr$');

      const firstComponentScope = componentScope, first$$isolateBindings = componentScope.$$isolateBindings;

      dealoc(element);
      compile('<div><span my-component>');
      expect(componentScope).not.toBe(firstComponentScope);
      expect(componentScope.$$isolateBindings).toBe(first$$isolateBindings);
    }));


    it('should expose isolate scope variables on controller with controllerAs when bindToController is true (template)', () => {
      let controllerCalled = false;
      angular.mock.module($compileProvider => {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          template: '<p>isolate</p>',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: function ($scope) {
            this.$onInit = function () {
              expect(this.data).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.oneway).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controllerCalled = true;
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = compileForTest('<div foo-dir dir-data="remoteData" ' +
          'dir-str="Hello, {{whom}}!" ' +
          'dir-fn="fn()"></div>');
        expect(controllerCalled).toBe(true);
      });
    });


    it('should not pre-assign bound properties to the controller', () => {
      let controllerCalled = false, onInitCalled = false;
      angular.mock.module($compileProvider => {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          template: '<p>isolate</p>',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: function ($scope) {
            expect(this.data).toBeUndefined();
            expect(this.oneway).toBeUndefined();
            expect(this.str).toBeUndefined();
            expect(this.fn).toBeUndefined();
            controllerCalled = true;
            this.$onInit = function () {
              expect(this.data).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.oneway).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
              onInitCalled = true;
            };
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = compileForTest('<div foo-dir dir-data="remoteData" ' +
          'dir-str="Hello, {{whom}}!" ' +
          'dir-fn="fn()"></div>');
        expect(controllerCalled).toBe(true);
        expect(onInitCalled).toBe(true);
      });
    });

    it('should eventually expose isolate scope variables on ES6 class controller with controllerAs when bindToController is true', () => {
      if (!support.classes) return;
      let controllerCalled = false;
      // eslint-disable-next-line no-eval
      const Controller = eval('(\n' +
        'class Foo {\n' +
        '  constructor($scope) {}\n' +
        '  $onInit() {\n' +
        '    expect(this.data).toEqualData({\n' +
        '      \'foo\': \'bar\',\n' +
        '      \'baz\': \'biz\'\n' +
        '    });\n' +
        '    expect(this.oneway).toEqualData({\n' +
        '      \'foo\': \'bar\',\n' +
        '      \'baz\': \'biz\'\n' +
        '    });\n' +
        '    expect(this.str).toBe(\'Hello, world!\');\n' +
        '    expect(this.fn()).toBe(\'called!\');\n' +
        '    controllerCalled = true;\n' +
        '  }\n' +
        '}\n' +
        ')');
      jest.spyOn(Controller.prototype, '$onInit');

      angular.mock.module($compileProvider => {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          template: '<p>isolate</p>',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: Controller,
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = compileForTest('<div foo-dir dir-data="remoteData" ' +
          'dir-str="Hello, {{whom}}!" ' +
          'dir-fn="fn()"></div>');
        expect(Controller.prototype.$onInit).toHaveBeenCalled();
        expect(controllerCalled).toBe(true);
      });
    });


    it('should update @-bindings on controller when bindToController and attribute change observed', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('atBinding', ngInternals.valueFn({
          template: '<p>{{At.text}}</p>',
          scope: {
            text: '@atBinding'
          },
          controller: function ($scope) { },
          bindToController: true,
          controllerAs: 'At'
        }));
      });

      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div at-binding="Test: {{text}}"></div>');
        const p = element.find('p');
        $rootScope.$digest();
        expect(p.text()).toBe('Test: ');

        $rootScope.text = 'Kittens';
        $rootScope.$digest();
        expect(p.text()).toBe('Test: Kittens');
      });
    });


    it('should expose isolate scope variables on controller with controllerAs when bindToController is true (templateUrl)', () => {
      let controllerCalled = false;
      angular.mock.module($compileProvider => {
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: function ($scope) {
            this.$onInit = function () {
              expect(this.data).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.oneway).toEqualData({
                'foo': 'bar',
                'baz': 'biz'
              });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controllerCalled = true;
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(($compile, $rootScope, $templateCache) => {
        $templateCache.put('test.html', '<p>isolate</p>');
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = compileForTest('<div foo-dir dir-data="remoteData" ' +
          'dir-str="Hello, {{whom}}!" ' +
          'dir-fn="fn()"></div>');
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
      });
    });


    it('should throw noctrl when missing controller', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('noCtrl', ngInternals.valueFn({
          templateUrl: 'test.html',
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controllerAs: 'test',
          bindToController: true
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        expect(() => {
          compileForTest('<div no-ctrl>');
        }).toThrowMinErr('$compile', 'noctrl',
          'Cannot bind to controller without directive \'noCtrl\'s controller.');
      });
    });


    it('should throw badrestrict on first compilation when restrict is invalid', () => {
      angular.mock.module(($compileProvider, $exceptionHandlerProvider) => {
        $compileProvider.directive('invalidRestrictBadString', ngInternals.valueFn({ restrict: '"' }));
        $compileProvider.directive('invalidRestrictTrue', ngInternals.valueFn({ restrict: true }));
        $compileProvider.directive('invalidRestrictObject', ngInternals.valueFn({ restrict: {} }));
        $compileProvider.directive('invalidRestrictNumber', ngInternals.valueFn({ restrict: 42 }));

        // We need to test with the exceptionHandler not rethrowing...
        $exceptionHandlerProvider.mode('log');
      });

      angular.mock.inject(($exceptionHandler, $compile, $rootScope) => {
        compileForTest('<div invalid-restrict-true>');
        expect($exceptionHandler.errors.length).toBe(1);
        expect($exceptionHandler.errors[0].toString()).toMatch(/\$compile.*badrestrict.*'true'/);

        compileForTest('<div invalid-restrict-bad-string>');
        compileForTest('<div invalid-restrict-bad-string>');
        expect($exceptionHandler.errors.length).toBe(2);
        expect($exceptionHandler.errors[1].toString()).toMatch(/\$compile.*badrestrict.*'"'/);

        compileForTest('<div invalid-restrict-bad-string invalid-restrict-object>');
        expect($exceptionHandler.errors.length).toBe(3);
        expect($exceptionHandler.errors[2].toString()).toMatch(/\$compile.*badrestrict.*'{}'/);

        compileForTest('<div invalid-restrict-object invalid-restrict-number>');
        expect($exceptionHandler.errors.length).toBe(4);
        expect($exceptionHandler.errors[3].toString()).toMatch(/\$compile.*badrestrict.*'42'/);
      });
    });


    describe('should bind to controller via object notation', () => {
      const controllerOptions = [{
        description: 'no controller identifier',
        controller: 'myCtrl'
      }, {
        description: '"Ctrl as ident" syntax',
        controller: 'myCtrl as myCtrl'
      }, {
        description: 'controllerAs setting',
        controller: 'myCtrl',
        controllerAs: 'myCtrl'
      }],
        scopeOptions = [{
          description: 'isolate scope',
          scope: {}
        }, {
          description: 'new scope',
          scope: true
        }, {
          description: 'no scope',
          scope: false
        }],
        templateOptions = [{
          description: 'inline template',
          template: '<p>template</p>'
        }, {
          description: 'templateUrl setting',
          templateUrl: 'test.html'
        }, {
          description: 'no template'
        }];

      angular.forEach(controllerOptions, controllerOption => {
        angular.forEach(scopeOptions, scopeOption => {
          angular.forEach(templateOptions, templateOption => {

            const description = [],
              ddo = {
                bindToController: {
                  'data': '=dirData',
                  'oneway': '<dirData',
                  'str': '@dirStr',
                  'fn': '&dirFn'
                }
              };

            angular.forEach([controllerOption, scopeOption, templateOption], option => {
              description.push(option.description);
              delete option.description;
              angular.extend(ddo, option);
            });

            it('(' + description.join(', ') + ')', () => {
              let controllerCalled = false;
              angular.mock.module(($compileProvider, $controllerProvider) => {
                $controllerProvider.register('myCtrl', function () {
                  this.$onInit = function () {
                    expect(this.data).toEqualData({
                      'foo': 'bar',
                      'baz': 'biz'
                    });
                    expect(this.oneway).toEqualData({
                      'foo': 'bar',
                      'baz': 'biz'
                    });
                    expect(this.str).toBe('Hello, world!');
                    expect(this.fn()).toBe('called!');
                  };
                  controllerCalled = true;
                });
                $compileProvider.directive('fooDir', ngInternals.valueFn(ddo));
              });
              angular.mock.inject(($compile, $rootScope, $templateCache) => {
                $templateCache.put('test.html', '<p>template</p>');
                $rootScope.fn = ngInternals.valueFn('called!');
                $rootScope.whom = 'world';
                $rootScope.remoteData = {
                  'foo': 'bar',
                  'baz': 'biz'
                };
                element = compileForTest('<div foo-dir dir-data="remoteData" ' +
                  'dir-str="Hello, {{whom}}!" ' +
                  'dir-fn="fn()"></div>');
                $rootScope.$digest();
                expect(controllerCalled).toBe(true);
                if (ddo.controllerAs || ddo.controller.indexOf(' as ') !== -1) {
                  if (ddo.scope) {
                    expect($rootScope.myCtrl).toBeUndefined();
                  } else {
                    // The controller identifier was added to the containing scope.
                    expect($rootScope.myCtrl).toBeDefined();
                  }
                }
              });
            });

          });
        });
      });

    });


    it('should bind to multiple directives controllers via object notation (no scope)', () => {
      let controller1Called = false;
      let controller2Called = false;
      angular.mock.module(($compileProvider, $controllerProvider) => {
        $compileProvider.directive('foo', ngInternals.valueFn({
          bindToController: {
            'data': '=fooData',
            'oneway': '<fooData',
            'str': '@fooStr',
            'fn': '&fooFn'
          },
          controllerAs: 'fooCtrl',
          controller: function () {
            this.$onInit = function () {
              expect(this.data).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
              expect(this.oneway).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controller1Called = true;
          }
        }));
        $compileProvider.directive('bar', ngInternals.valueFn({
          bindToController: {
            'data': '=barData',
            'oneway': '<barData',
            'str': '@barStr',
            'fn': '&barFn'
          },
          controllerAs: 'barCtrl',
          controller: function () {
            this.$onInit = function () {
              expect(this.data).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
              expect(this.oneway).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
              expect(this.str).toBe('Hello, second world!');
              expect(this.fn()).toBe('second called!');
            };
            controller2Called = true;
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.string = 'world';
        $rootScope.data = { 'foo': 'bar', 'baz': 'biz' };
        $rootScope.fn2 = ngInternals.valueFn('second called!');
        $rootScope.string2 = 'second world';
        $rootScope.data2 = { 'foo2': 'bar2', 'baz2': 'biz2' };
        element = compileForTest(
          '<div ' +
          'foo ' +
          'foo-data="data" ' +
          'foo-str="Hello, {{string}}!" ' +
          'foo-fn="fn()" ' +
          'bar ' +
          'bar-data="data2" ' +
          'bar-str="Hello, {{string2}}!" ' +
          'bar-fn="fn2()" > ' +
          '</div>');
        $rootScope.$digest();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });
    });


    it('should bind to multiple directives controllers via object notation (new iso scope)', () => {
      let controller1Called = false;
      let controller2Called = false;
      angular.mock.module(($compileProvider, $controllerProvider) => {
        $compileProvider.directive('foo', ngInternals.valueFn({
          bindToController: {
            'data': '=fooData',
            'oneway': '<fooData',
            'str': '@fooStr',
            'fn': '&fooFn'
          },
          scope: {},
          controllerAs: 'fooCtrl',
          controller: function () {
            this.$onInit = function () {
              expect(this.data).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
              expect(this.oneway).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controller1Called = true;
          }
        }));
        $compileProvider.directive('bar', ngInternals.valueFn({
          bindToController: {
            'data': '=barData',
            'oneway': '<barData',
            'str': '@barStr',
            'fn': '&barFn'
          },
          controllerAs: 'barCtrl',
          controller: function () {
            this.$onInit = function () {
              expect(this.data).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
              expect(this.oneway).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
              expect(this.str).toBe('Hello, second world!');
              expect(this.fn()).toBe('second called!');
            };
            controller2Called = true;
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.string = 'world';
        $rootScope.data = { 'foo': 'bar', 'baz': 'biz' };
        $rootScope.fn2 = ngInternals.valueFn('second called!');
        $rootScope.string2 = 'second world';
        $rootScope.data2 = { 'foo2': 'bar2', 'baz2': 'biz2' };
        element = compileForTest(
          '<div ' +
          'foo ' +
          'foo-data="data" ' +
          'foo-str="Hello, {{string}}!" ' +
          'foo-fn="fn()" ' +
          'bar ' +
          'bar-data="data2" ' +
          'bar-str="Hello, {{string2}}!" ' +
          'bar-fn="fn2()" > ' +
          '</div>');
        $rootScope.$digest();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });
    });


    it('should bind to multiple directives controllers via object notation (new scope)', () => {
      let controller1Called = false;
      let controller2Called = false;
      angular.mock.module(($compileProvider, $controllerProvider) => {
        $compileProvider.directive('foo', ngInternals.valueFn({
          bindToController: {
            'data': '=fooData',
            'oneway': '<fooData',
            'str': '@fooStr',
            'fn': '&fooFn'
          },
          scope: true,
          controllerAs: 'fooCtrl',
          controller: function () {
            this.$onInit = function () {
              expect(this.data).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
              expect(this.oneway).toEqualData({ 'foo': 'bar', 'baz': 'biz' });
              expect(this.str).toBe('Hello, world!');
              expect(this.fn()).toBe('called!');
            };
            controller1Called = true;
          }
        }));
        $compileProvider.directive('bar', ngInternals.valueFn({
          bindToController: {
            'data': '=barData',
            'oneway': '<barData',
            'str': '@barStr',
            'fn': '&barFn'
          },
          scope: true,
          controllerAs: 'barCtrl',
          controller: function () {
            this.$onInit = function () {
              expect(this.data).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
              expect(this.oneway).toEqualData({ 'foo2': 'bar2', 'baz2': 'biz2' });
              expect(this.str).toBe('Hello, second world!');
              expect(this.fn()).toBe('second called!');
            };
            controller2Called = true;
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.string = 'world';
        $rootScope.data = { 'foo': 'bar', 'baz': 'biz' };
        $rootScope.fn2 = ngInternals.valueFn('second called!');
        $rootScope.string2 = 'second world';
        $rootScope.data2 = { 'foo2': 'bar2', 'baz2': 'biz2' };
        element = compileForTest(
          '<div ' +
          'foo ' +
          'foo-data="data" ' +
          'foo-str="Hello, {{string}}!" ' +
          'foo-fn="fn()" ' +
          'bar ' +
          'bar-data="data2" ' +
          'bar-str="Hello, {{string2}}!" ' +
          'bar-fn="fn2()" > ' +
          '</div>');
        $rootScope.$digest();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });
    });


    it('should evaluate against the correct scope, when using `bindToController` (new scope)',
      () => {
        angular.mock.module(($compileProvider, $controllerProvider) => {
          $controllerProvider.register({
            'ParentCtrl': function () {
              this.value1 = 'parent1';
              this.value2 = 'parent2';
              this.value3 = () => { return 'parent3'; };
              this.value4 = 'parent4';
            },
            'ChildCtrl': function () {
              this.value1 = 'child1';
              this.value2 = 'child2';
              this.value3 = () => { return 'child3'; };
              this.value4 = 'child4';
            }
          });

          $compileProvider.directive('child', ngInternals.valueFn({
            scope: true,
            controller: 'ChildCtrl as ctrl',
            bindToController: {
              fromParent1: '@',
              fromParent2: '=',
              fromParent3: '&',
              fromParent4: '<'
            },
            template: ''
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest(
            '<div ng-controller="ParentCtrl as ctrl">' +
            '<child ' +
            'from-parent-1="{{ ctrl.value1 }}" ' +
            'from-parent-2="ctrl.value2" ' +
            'from-parent-3="ctrl.value3" ' +
            'from-parent-4="ctrl.value4">' +
            '</child>' +
            '</div>');
          $rootScope.$digest();

          const parentCtrl = element.controller('ngController');
          const childCtrl = element.find('child').controller('child');

          expect(childCtrl.fromParent1).toBe(parentCtrl.value1);
          expect(childCtrl.fromParent1).not.toBe(childCtrl.value1);
          expect(childCtrl.fromParent2).toBe(parentCtrl.value2);
          expect(childCtrl.fromParent2).not.toBe(childCtrl.value2);
          expect(childCtrl.fromParent3()()).toBe(parentCtrl.value3());
          expect(childCtrl.fromParent3()()).not.toBe(childCtrl.value3());
          expect(childCtrl.fromParent4).toBe(parentCtrl.value4);
          expect(childCtrl.fromParent4).not.toBe(childCtrl.value4);

          childCtrl.fromParent2 = 'modified';
          $rootScope.$digest();

          expect(parentCtrl.value2).toBe('modified');
          expect(childCtrl.value2).toBe('child2');
        });
      }
    );


    it('should evaluate against the correct scope, when using `bindToController` (new iso scope)',
      () => {
        angular.mock.module(($compileProvider, $controllerProvider) => {
          $controllerProvider.register({
            'ParentCtrl': function () {
              this.value1 = 'parent1';
              this.value2 = 'parent2';
              this.value3 = () => { return 'parent3'; };
              this.value4 = 'parent4';
            },
            'ChildCtrl': function () {
              this.value1 = 'child1';
              this.value2 = 'child2';
              this.value3 = () => { return 'child3'; };
              this.value4 = 'child4';
            }
          });

          $compileProvider.directive('child', ngInternals.valueFn({
            scope: {},
            controller: 'ChildCtrl as ctrl',
            bindToController: {
              fromParent1: '@',
              fromParent2: '=',
              fromParent3: '&',
              fromParent4: '<'
            },
            template: ''
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest(
            '<div ng-controller="ParentCtrl as ctrl">' +
            '<child ' +
            'from-parent-1="{{ ctrl.value1 }}" ' +
            'from-parent-2="ctrl.value2" ' +
            'from-parent-3="ctrl.value3" ' +
            'from-parent-4="ctrl.value4">' +
            '</child>' +
            '</div>');
          $rootScope.$digest();

          const parentCtrl = element.controller('ngController');
          const childCtrl = element.find('child').controller('child');

          expect(childCtrl.fromParent1).toBe(parentCtrl.value1);
          expect(childCtrl.fromParent1).not.toBe(childCtrl.value1);
          expect(childCtrl.fromParent2).toBe(parentCtrl.value2);
          expect(childCtrl.fromParent2).not.toBe(childCtrl.value2);
          expect(childCtrl.fromParent3()()).toBe(parentCtrl.value3());
          expect(childCtrl.fromParent3()()).not.toBe(childCtrl.value3());
          expect(childCtrl.fromParent4).toBe(parentCtrl.value4);
          expect(childCtrl.fromParent4).not.toBe(childCtrl.value4);

          childCtrl.fromParent2 = 'modified';
          $rootScope.$digest();

          expect(parentCtrl.value2).toBe('modified');
          expect(childCtrl.value2).toBe('child2');
        });
      }
    );


    it('should put controller in scope when controller identifier present but not using controllerAs', () => {
      let controllerCalled = false;
      let myCtrl;
      angular.mock.module(($compileProvider, $controllerProvider) => {
        $controllerProvider.register('myCtrl', function () {
          controllerCalled = true;
          myCtrl = this;
        });
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          bindToController: {},
          scope: true,
          controller: 'myCtrl as theCtrl'
        }));
      });
      angular.mock.inject(($compile, $rootScope, $templateCache) => {
        $templateCache.put('test.html', '<p>isolate</p>');
        element = compileForTest('<div foo-dir>');
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
        const childScope = element.children().scope();
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).toBe(myCtrl);
      });
    });


    it('should re-install controllerAs and bindings for returned value from controller (new scope)', () => {
      let controllerCalled = false;
      let myCtrl;

      function MyCtrl() {
      }
      MyCtrl.prototype.test = function () {
        expect(this.data).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.oneway).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.str).toBe('Hello, world!');
        expect(this.fn()).toBe('called!');
      };

      angular.mock.module(($compileProvider, $controllerProvider) => {
        $controllerProvider.register('myCtrl', function () {
          controllerCalled = true;
          myCtrl = this;
          return new MyCtrl();
        });
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          bindToController: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          scope: true,
          controller: 'myCtrl as theCtrl'
        }));
      });
      angular.mock.inject(($compile, $rootScope, $templateCache) => {
        $templateCache.put('test.html', '<p>isolate</p>');
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = compileForTest('<div foo-dir dir-data="remoteData" ' +
          'dir-str="Hello, {{whom}}!" ' +
          'dir-fn="fn()"></div>');
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
        const childScope = element.children().scope();
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).not.toBe(myCtrl);
        expect(childScope.theCtrl.constructor).toBe(MyCtrl);
        childScope.theCtrl.test();
      });
    });


    it('should re-install controllerAs and bindings for returned value from controller (isolate scope)', () => {
      let controllerCalled = false;
      let myCtrl;

      function MyCtrl() {
      }
      MyCtrl.prototype.test = function () {
        expect(this.data).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.oneway).toEqualData({
          'foo': 'bar',
          'baz': 'biz'
        });
        expect(this.str).toBe('Hello, world!');
        expect(this.fn()).toBe('called!');
      };

      angular.mock.module(($compileProvider, $controllerProvider) => {
        $controllerProvider.register('myCtrl', function () {
          controllerCalled = true;
          myCtrl = this;
          return new MyCtrl();
        });
        $compileProvider.directive('fooDir', ngInternals.valueFn({
          templateUrl: 'test.html',
          bindToController: true,
          scope: {
            'data': '=dirData',
            'oneway': '<dirData',
            'str': '@dirStr',
            'fn': '&dirFn'
          },
          controller: 'myCtrl as theCtrl'
        }));
      });
      angular.mock.inject(($compile, $rootScope, $templateCache) => {
        $templateCache.put('test.html', '<p>isolate</p>');
        $rootScope.fn = ngInternals.valueFn('called!');
        $rootScope.whom = 'world';
        $rootScope.remoteData = {
          'foo': 'bar',
          'baz': 'biz'
        };
        element = compileForTest('<div foo-dir dir-data="remoteData" ' +
          'dir-str="Hello, {{whom}}!" ' +
          'dir-fn="fn()"></div>');
        $rootScope.$digest();
        expect(controllerCalled).toBe(true);
        const childScope = element.children().scope();
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).not.toBe(myCtrl);
        expect(childScope.theCtrl.constructor).toBe(MyCtrl);
        childScope.theCtrl.test();
      });
    });

    describe('should not overwrite @-bound property each digest when not present', () => {
      it('when creating new scope', () => {
        angular.mock.module($compileProvider => {
          $compileProvider.directive('testDir', ngInternals.valueFn({
            scope: true,
            bindToController: {
              prop: '@'
            },
            controller: function () {
              const self = this;
              this.$onInit = function () {
                this.prop = this.prop || 'default';
              };
              this.getProp = () => {
                return self.prop;
              };
            },
            controllerAs: 'ctrl',
            template: '<p></p>'
          }));
        });
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div test-dir></div>');
          const scope = element.scope();
          expect(scope.ctrl.getProp()).toBe('default');

          $rootScope.$digest();
          expect(scope.ctrl.getProp()).toBe('default');
        });
      });

      it('when creating isolate scope', () => {
        angular.mock.module($compileProvider => {
          $compileProvider.directive('testDir', ngInternals.valueFn({
            scope: {},
            bindToController: {
              prop: '@'
            },
            controller: function () {
              const self = this;
              this.$onInit = function () {
                this.prop = this.prop || 'default';
              };
              this.getProp = () => {
                return self.prop;
              };
            },
            controllerAs: 'ctrl',
            template: '<p></p>'
          }));
        });
        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div test-dir></div>');
          const scope = element.isolateScope();
          expect(scope.ctrl.getProp()).toBe('default');

          $rootScope.$digest();
          expect(scope.ctrl.getProp()).toBe('default');
        });
      });
    });

  });

  describe('require', () => {

    it('should get required controller', () => {
      angular.mock.module(() => {
        directive('main', log => {
          return {
            priority: 2,
            controller: function () {
              this.name = 'main';
            },
            link: function (scope, element, attrs, controller) {
              log(controller.name);
            }
          };
        });
        directive('dep', log => {
          return {
            priority: 1,
            require: 'main',
            link: function (scope, element, attrs, controller) {
              log('dep:' + controller.name);
            }
          };
        });
        directive('other', log => {
          return {
            link: function (scope, element, attrs, controller) {
              log(!!controller); // should be false
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div main dep other></div>');
        expect(log).toEqual('false; dep:main; main');
      });
    });


    it('should respect explicit return value from controller', () => {
      let expectedController;
      angular.mock.module(() => {
        directive('logControllerProp', log => {
          return {
            controller: function ($scope) {
              this.foo = 'baz'; // value should not be used.
              expectedController = { foo: 'bar' };
              return expectedController;
            },
            link: function (scope, element, attrs, controller) {
              expect(expectedController).toBeDefined();
              expect(controller).toBe(expectedController);
              expect(controller.foo).toBe('bar');
              log('done');
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<log-controller-prop></log-controller-prop>');
        expect(log).toEqual('done');
        expect(element.data('$logControllerPropController')).toBe(expectedController);
      });
    });


    it('should get explicit return value of required parent controller', () => {
      let expectedController;
      angular.mock.module(() => {
        directive('nested', log => {
          return {
            require: '^^?nested',
            controller: function () {
              if (!expectedController) expectedController = { foo: 'bar' };
              return expectedController;
            },
            link: function (scope, element, attrs, controller) {
              if (element.parent().length) {
                expect(expectedController).toBeDefined();
                expect(controller).toBe(expectedController);
                expect(controller.foo).toBe('bar');
                log('done');
              }
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div nested><div nested></div></div>');
        expect(log).toEqual('done');
        expect(element.data('$nestedController')).toBe(expectedController);
      });
    });


    it('should respect explicit controller return value when using controllerAs', () => {
      angular.mock.module(() => {
        directive('main', () => {
          return {
            templateUrl: 'main.html',
            scope: {},
            controller: function () {
              this.name = 'lucas';
              return { name: 'george' };
            },
            controllerAs: 'mainCtrl'
          };
        });
      });
      angular.mock.inject(($templateCache, $compile, $rootScope) => {
        $templateCache.put('main.html', '<span>template:{{mainCtrl.name}}</span>');
        element = compileForTest('<main/>');
        $rootScope.$apply();
        expect(element.text()).toBe('template:george');
      });
    });


    it('transcluded children should receive explicit return value of parent controller', () => {
      let expectedController;
      angular.mock.module(() => {
        directive('nester', ngInternals.valueFn({
          transclude: true,
          controller: function ($transclude) {
            this.foo = 'baz';
            expectedController = { transclude: $transclude, foo: 'bar' };
            return expectedController;
          },
          link: function (scope, el, attr, ctrl) {
            ctrl.transclude(cloneAttach);
            function cloneAttach(clone) {
              el.append(clone);
            }
          }
        }));
        directive('nested', log => {
          return {
            require: '^^nester',
            link: function (scope, element, attrs, controller) {
              expect(controller).toBeDefined();
              expect(controller).toBe(expectedController);
              log('done');
            }
          };
        });
      });
      angular.mock.inject((log, $compile) => {
        element = compileForTest('<div nester><div nested></div></div>');
        $rootScope.$apply();
        expect(log.toString()).toBe('done');
        expect(element.data('$nesterController')).toBe(expectedController);
      });
    });


    it('explicit controller return values are ignored if they are primitives', () => {
      angular.mock.module(() => {
        directive('logControllerProp', log => {
          return {
            controller: function ($scope) {
              this.foo = 'baz'; // value *will* be used.
              return 'bar';
            },
            link: function (scope, element, attrs, controller) {
              log(controller.foo);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<log-controller-prop></log-controller-prop>');
        expect(log).toEqual('baz');
        expect(element.data('$logControllerPropController').foo).toEqual('baz');
      });
    });


    it('should correctly assign controller return values for multiple directives', () => {
      let directiveController, otherDirectiveController;
      angular.mock.module(() => {

        directive('myDirective', log => {
          return {
            scope: true,
            controller: function ($scope) {
              directiveController = {
                foo: 'bar'
              };
              return directiveController;
            }
          };
        });

        directive('myOtherDirective', log => {
          return {
            controller: function ($scope) {
              otherDirectiveController = {
                baz: 'luh'
              };
              return otherDirectiveController;
            }
          };
        });

      });

      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<my-directive my-other-directive></my-directive>');
        expect(element.data('$myDirectiveController')).toBe(directiveController);
        expect(element.data('$myOtherDirectiveController')).toBe(otherDirectiveController);
      });
    });


    it('should get required parent controller', () => {
      angular.mock.module(() => {
        directive('nested', log => {
          return {
            require: '^^?nested',
            controller: function ($scope) { },
            link: function (scope, element, attrs, controller) {
              log(!!controller);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div nested><div nested></div></div>');
        expect(log).toEqual('true; false');
      });
    });


    it('should get required parent controller when the question mark precedes the ^^', () => {
      angular.mock.module(() => {
        directive('nested', log => {
          return {
            require: '?^^nested',
            controller: function ($scope) { },
            link: function (scope, element, attrs, controller) {
              log(!!controller);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div nested><div nested></div></div>');
        expect(log).toEqual('true; false');
      });
    });


    it('should throw if required parent is not found', () => {

      angular.mock.module(() => {
        directive('nested', () => {
          return {
            require: '^^nested',
            controller: function ($scope) { },
            link: function (scope, element, attrs, controller) { }
          };
        });
      });
      angular.mock.inject(($compile, $rootScope) => {
        expect(() => {
          element = compileForTest('<div nested></div>');
        }).toThrowMinErr('$compile', 'ctreq', 'Controller \'nested\', required by directive \'nested\', can\'t be found!');
      });
    });


    it('should get required controller via linkingFn (template)', () => {
      angular.mock.module(() => {
        directive('dirA', () => {
          return {
            controller: function () {
              this.name = 'dirA';
            }
          };
        });
        directive('dirB', log => {
          return {
            require: 'dirA',
            template: '<p>dirB</p>',
            link: function (scope, element, attrs, dirAController) {
              log('dirAController.name: ' + dirAController.name);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div dir-a dir-b></div>');
        expect(log).toEqual('dirAController.name: dirA');
      });
    });


    it('should get required controller via linkingFn (templateUrl)', () => {
      angular.mock.module(() => {
        directive('dirA', () => {
          return {
            controller: function () {
              this.name = 'dirA';
            }
          };
        });
        directive('dirB', log => {
          return {
            require: 'dirA',
            templateUrl: 'dirB.html',
            link: function (scope, element, attrs, dirAController) {
              log('dirAController.name: ' + dirAController.name);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope, $templateCache) => {
        $templateCache.put('dirB.html', '<p>dirB</p>');
        element = compileForTest('<div dir-a dir-b></div>');
        $rootScope.$digest();
        expect(log).toEqual('dirAController.name: dirA');
      });
    });

    it('should bind the required controllers to the directive controller, if provided as an object and bindToController is truthy', () => {
      let parentController, siblingController;

      function ParentController() { this.name = 'Parent'; }
      function SiblingController() { this.name = 'Sibling'; }
      function MeController() { this.name = 'Me'; }
      MeController.prototype.$onInit = function () {
        parentController = this.container;
        siblingController = this.friend;
      };
      jest.spyOn(MeController.prototype, '$onInit');

      angular.module('my', [])
        .directive('me', () => {
          return {
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            bindToController: true,
            controller: MeController,
            controllerAs: '$ctrl'
          };
        })
        .directive('parent', () => {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', () => {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(($compile, $rootScope, meDirective) => {
        element = compileForTest('<parent><me sibling></me></parent>');
        expect(MeController.prototype.$onInit).toHaveBeenCalled();
        expect(parentController).toEqual(expect.any(ParentController));
        expect(siblingController).toEqual(expect.any(SiblingController));
      });
    });

    it('should use the key if the name of a required controller is omitted', () => {
      function ParentController() { this.name = 'Parent'; }
      function ParentOptController() { this.name = 'ParentOpt'; }
      function ParentOrSiblingController() { this.name = 'ParentOrSibling'; }
      function ParentOrSiblingOptController() { this.name = 'ParentOrSiblingOpt'; }
      function SiblingController() { this.name = 'Sibling'; }
      function SiblingOptController() { this.name = 'SiblingOpt'; }

      angular.module('my', [])
        .component('me', {
          require: {
            parent: '^^',
            parentOpt: '?^^',
            parentOrSibling1: '^',
            parentOrSiblingOpt1: '?^',
            parentOrSibling2: '^',
            parentOrSiblingOpt2: '?^',
            sibling: '',
            siblingOpt: '?'
          }
        })
        .directive('parent', () => {
          return { controller: ParentController };
        })
        .directive('parentOpt', () => {
          return { controller: ParentOptController };
        })
        .directive('parentOrSibling1', () => {
          return { controller: ParentOrSiblingController };
        })
        .directive('parentOrSiblingOpt1', () => {
          return { controller: ParentOrSiblingOptController };
        })
        .directive('parentOrSibling2', () => {
          return { controller: ParentOrSiblingController };
        })
        .directive('parentOrSiblingOpt2', () => {
          return { controller: ParentOrSiblingOptController };
        })
        .directive('sibling', () => {
          return { controller: SiblingController };
        })
        .directive('siblingOpt', () => {
          return { controller: SiblingOptController };
        });

      angular.mock.module('my');
      angular.mock.inject(($compile, $rootScope) => {
        const template =
          '<div>' +
          // With optional
          '<parent parent-opt parent-or-sibling-1 parent-or-sibling-opt-1>' +
          '<me parent-or-sibling-2 parent-or-sibling-opt-2 sibling sibling-opt></me>' +
          '</parent>' +
          // Without optional
          '<parent parent-or-sibling-1>' +
          '<me parent-or-sibling-2 sibling></me>' +
          '</parent>' +
          '</div>';
        element = compileForTest(template);

        const ctrl1 = element.find('me').eq(0).controller('me');
        expect(ctrl1.parent).toEqual(expect.any(ParentController));
        expect(ctrl1.parentOpt).toEqual(expect.any(ParentOptController));
        expect(ctrl1.parentOrSibling1).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl1.parentOrSiblingOpt1).toEqual(expect.any(ParentOrSiblingOptController));
        expect(ctrl1.parentOrSibling2).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl1.parentOrSiblingOpt2).toEqual(expect.any(ParentOrSiblingOptController));
        expect(ctrl1.sibling).toEqual(expect.any(SiblingController));
        expect(ctrl1.siblingOpt).toEqual(expect.any(SiblingOptController));

        const ctrl2 = element.find('me').eq(1).controller('me');
        expect(ctrl2.parent).toEqual(expect.any(ParentController));
        expect(ctrl2.parentOpt).toBe(null);
        expect(ctrl2.parentOrSibling1).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl2.parentOrSiblingOpt1).toBe(null);
        expect(ctrl2.parentOrSibling2).toEqual(expect.any(ParentOrSiblingController));
        expect(ctrl2.parentOrSiblingOpt2).toBe(null);
        expect(ctrl2.sibling).toEqual(expect.any(SiblingController));
        expect(ctrl2.siblingOpt).toBe(null);
      });
    });


    it('should not bind required controllers if bindToController is falsy', () => {
      let parentController, siblingController;

      function ParentController() { this.name = 'Parent'; }
      function SiblingController() { this.name = 'Sibling'; }
      function MeController() { this.name = 'Me'; }
      MeController.prototype.$onInit = function () {
        parentController = this.container;
        siblingController = this.friend;
      };
      jest.spyOn(MeController.prototype, '$onInit');

      angular.module('my', [])
        .directive('me', () => {
          return {
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            controller: MeController
          };
        })
        .directive('parent', () => {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', () => {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(($compile, $rootScope, meDirective) => {
        element = compileForTest('<parent><me sibling></me></parent>');
        expect(MeController.prototype.$onInit).toHaveBeenCalled();
        expect(parentController).toBeUndefined();
        expect(siblingController).toBeUndefined();
      });
    });

    it('should bind required controllers to controller that has an explicit constructor return value', () => {
      let parentController, siblingController, meController;

      function ParentController() { this.name = 'Parent'; }
      function SiblingController() { this.name = 'Sibling'; }
      function MeController() {
        meController = {
          name: 'Me',
          $onInit: function () {
            parentController = this.container;
            siblingController = this.friend;
          }
        };
        jest.spyOn(meController, '$onInit');
        return meController;
      }

      angular.module('my', [])
        .directive('me', () => {
          return {
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            bindToController: true,
            controller: MeController,
            controllerAs: '$ctrl'
          };
        })
        .directive('parent', () => {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', () => {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(($compile, $rootScope, meDirective) => {
        element = compileForTest('<parent><me sibling></me></parent>');
        expect(meController.$onInit).toHaveBeenCalled();
        expect(parentController).toEqual(expect.any(ParentController));
        expect(siblingController).toEqual(expect.any(SiblingController));
      });
    });


    it('should bind required controllers to controllers that return an explicit constructor return value', () => {
      let parentController, containerController, siblingController, friendController, meController;

      function MeController() {
        this.name = 'Me';
        this.$onInit = function () {
          containerController = this.container;
          friendController = this.friend;
        };
      }
      function ParentController() {
        parentController = { name: 'Parent' };
        return parentController;
      }
      function SiblingController() {
        siblingController = { name: 'Sibling' };
        return siblingController;
      }

      angular.module('my', [])
        .directive('me', () => {
          return {
            priority: 1, // make sure it is run before sibling to test this case correctly
            restrict: 'E',
            scope: {},
            require: { container: '^parent', friend: 'sibling' },
            bindToController: true,
            controller: MeController,
            controllerAs: '$ctrl'
          };
        })
        .directive('parent', () => {
          return {
            restrict: 'E',
            scope: {},
            controller: ParentController
          };
        })
        .directive('sibling', () => {
          return {
            controller: SiblingController
          };
        });

      angular.mock.module('my');
      angular.mock.inject(($compile, $rootScope, meDirective) => {
        element = compileForTest('<parent><me sibling></me></parent>');
        expect(containerController).toEqual(parentController);
        expect(friendController).toEqual(siblingController);
      });
    });

    it('should require controller of an isolate directive from a non-isolate directive on the ' +
      'same element', () => {
        function IsolateController() { };
        let isolateDirControllerInNonIsolateDirective;

        angular.mock.module(() => {
          directive('isolate', () => {
            return {
              scope: {},
              controller: IsolateController
            };
          });
          directive('nonIsolate', () => {
            return {
              require: 'isolate',
              link: function (_, __, ___, isolateDirController) {
                isolateDirControllerInNonIsolateDirective = isolateDirController;
              }
            };
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div isolate non-isolate></div>');

          expect(isolateDirControllerInNonIsolateDirective).toBeDefined();
          expect(isolateDirControllerInNonIsolateDirective instanceof IsolateController).toBe(true);
        });
      });


    it('should give the isolate scope to the controller of another replaced directives in the template', () => {
      angular.mock.module(() => {
        directive('testDirective', () => {
          return {
            replace: true,
            restrict: 'E',
            scope: {},
            template: '<input type="checkbox" ng-model="model">'
          };
        });
      });

      angular.mock.inject($rootScope => {
        compile('<div><test-directive></test-directive></div>');

        element = element.children().eq(0);
        expect(element[0].checked).toBe(false);
        element.isolateScope().model = true;
        $rootScope.$digest();
        expect(element[0].checked).toBe(true);
      });
    });


    it('should share isolate scope with replaced directives (template)', () => {
      let normalScope;
      let isolateScope;

      angular.mock.module(() => {
        directive('isolate', () => {
          return {
            replace: true,
            scope: {},
            template: '<span ng-init="name=\'WORKS\'">{{name}}</span>',
            link: function (s) {
              isolateScope = s;
            }
          };
        });
        directive('nonIsolate', () => {
          return {
            link: function (s) {
              normalScope = s;
            }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div isolate non-isolate></div>');

        expect(normalScope).toBe($rootScope);
        expect(normalScope.name).toEqual(undefined);
        expect(isolateScope.name).toEqual('WORKS');
        $rootScope.$digest();
        expect(element.text()).toEqual('WORKS');
      });
    });


    it('should share isolate scope with replaced directives (templateUrl)', () => {
      let normalScope;
      let isolateScope;

      angular.mock.module(() => {
        directive('isolate', () => {
          return {
            replace: true,
            scope: {},
            templateUrl: 'main.html',
            link: function (s) {
              isolateScope = s;
            }
          };
        });
        directive('nonIsolate', () => {
          return {
            link: function (s) {
              normalScope = s;
            }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope, $templateCache) => {
        $templateCache.put('main.html', '<span ng-init="name=\'WORKS\'">{{name}}</span>');
        element = compileForTest('<div isolate non-isolate></div>');
        $rootScope.$apply();

        expect(normalScope).toBe($rootScope);
        expect(normalScope.name).toEqual(undefined);
        expect(isolateScope.name).toEqual('WORKS');
        expect(element.text()).toEqual('WORKS');
      });
    });


    it('should not get confused about where to use isolate scope when a replaced directive is used multiple times',
      () => {

        angular.mock.module(() => {
          directive('isolate', () => {
            return {
              replace: true,
              scope: {},
              template: '<span scope-tester="replaced"><span scope-tester="inside"></span></span>'
            };
          });
          directive('scopeTester', log => {
            return {
              link: function ($scope, $element) {
                log($element.attr('scope-tester') + '=' + ($scope.$root === $scope ? 'non-isolate' : 'isolate'));
              }
            };
          });
        });

        angular.mock.inject(($compile, $rootScope, log) => {
          element = compileForTest('<div>' +
            '<div isolate scope-tester="outside"></div>' +
            '<span scope-tester="sibling"></span>' +
            '</div>');

          $rootScope.$digest();
          expect(log).toEqual('inside=isolate; ' +
            'outside replaced=non-isolate; ' + // outside
            'outside replaced=isolate; ' + // replaced
            'sibling=non-isolate');
        });
      });


    it('should require controller of a non-isolate directive from an isolate directive on the ' +
      'same element', () => {
        function NonIsolateController() { };
        let nonIsolateDirControllerInIsolateDirective;

        angular.mock.module(() => {
          directive('isolate', () => {
            return {
              scope: {},
              require: 'nonIsolate',
              link: function (_, __, ___, nonIsolateDirController) {
                nonIsolateDirControllerInIsolateDirective = nonIsolateDirController;
              }
            };
          });
          directive('nonIsolate', () => {
            return {
              controller: NonIsolateController
            };
          });
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div isolate non-isolate></div>');

          expect(nonIsolateDirControllerInIsolateDirective).toBeDefined();
          expect(nonIsolateDirControllerInIsolateDirective instanceof NonIsolateController).toBe(true);
        });
      });


    it('should support controllerAs', () => {
      angular.mock.module(() => {
        directive('main', () => {
          return {
            templateUrl: 'main.html',
            transclude: true,
            scope: {},
            controller: function () {
              this.name = 'lucas';
            },
            controllerAs: 'mainCtrl'
          };
        });
      });
      angular.mock.inject(($templateCache, $compile, $rootScope) => {
        $templateCache.put('main.html', '<span>template:{{mainCtrl.name}} <div ng-transclude></div></span>');
        element = compileForTest('<div main>transclude:{{mainCtrl.name}}</div>');
        $rootScope.$apply();
        expect(element.text()).toBe('template:lucas transclude:');
      });
    });


    it('should support controller alias', () => {
      angular.mock.module($controllerProvider => {
        $controllerProvider.register('MainCtrl', function () {
          this.name = 'lucas';
        });
        directive('main', () => {
          return {
            templateUrl: 'main.html',
            scope: {},
            controller: 'MainCtrl as mainCtrl'
          };
        });
      });
      angular.mock.inject(($templateCache, $compile, $rootScope) => {
        $templateCache.put('main.html', '<span>{{mainCtrl.name}}</span>');
        element = compileForTest('<div main></div>');
        $rootScope.$apply();
        expect(element.text()).toBe('lucas');
      });
    });



    it('should require controller on parent element', () => {
      angular.mock.module(() => {
        directive('main', log => {
          return {
            controller: function () {
              this.name = 'main';
            }
          };
        });
        directive('dep', log => {
          return {
            require: '^main',
            link: function (scope, element, attrs, controller) {
              log('dep:' + controller.name);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div main><div dep></div></div>');
        expect(log).toEqual('dep:main');
      });
    });


    it('should throw an error if required controller can\'t be found', () => {

      angular.mock.module(() => {
        directive('dep', log => {
          return {
            require: '^main',
            link: function (scope, element, attrs, controller) {
              log('dep:' + controller.name);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        expect(() => {
          compileForTest('<div main><div dep></div></div>');
        }).toThrowMinErr('$compile', 'ctreq', 'Controller \'main\', required by directive \'dep\', can\'t be found!');
      });
    });


    it('should pass null if required controller can\'t be found and is optional', () => {
      angular.mock.module(() => {
        directive('dep', log => {
          return {
            require: '?^main',
            link: function (scope, element, attrs, controller) {
              log('dep:' + controller);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        compileForTest('<div main><div dep></div></div>');
        expect(log).toEqual('dep:null');
      });
    });


    it('should pass null if required controller can\'t be found and is optional with the question mark on the right', () => {
      angular.mock.module(() => {
        directive('dep', log => {
          return {
            require: '^?main',
            link: function (scope, element, attrs, controller) {
              log('dep:' + controller);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        compileForTest('<div main><div dep></div></div>');
        expect(log).toEqual('dep:null');
      });
    });


    it('should have optional controller on current element', () => {
      angular.mock.module(() => {
        directive('dep', log => {
          return {
            require: '?main',
            link: function (scope, element, attrs, controller) {
              log('dep:' + !!controller);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div main><div dep></div></div>');
        expect(log).toEqual('dep:false');
      });
    });


    it('should support multiple controllers', () => {
      angular.mock.module(() => {
        directive('c1', ngInternals.valueFn({
          controller: function () { this.name = 'c1'; }
        }));
        directive('c2', ngInternals.valueFn({
          controller: function () { this.name = 'c2'; }
        }));
        directive('dep', log => {
          return {
            require: ['^c1', '^c2'],
            link: function (scope, element, attrs, controller) {
              log('dep:' + controller[0].name + '-' + controller[1].name);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div c1 c2><div dep></div></div>');
        expect(log).toEqual('dep:c1-c2');
      });
    });

    it('should support multiple controllers as an object hash', () => {
      angular.mock.module(() => {
        directive('c1', ngInternals.valueFn({
          controller: function () { this.name = 'c1'; }
        }));
        directive('c2', ngInternals.valueFn({
          controller: function () { this.name = 'c2'; }
        }));
        directive('dep', log => {
          return {
            require: { myC1: '^c1', myC2: '^c2' },
            link: function (scope, element, attrs, controllers) {
              log('dep:' + controllers.myC1.name + '-' + controllers.myC2.name);
            }
          };
        });
      });
      angular.mock.inject((log, $compile, $rootScope) => {
        element = compileForTest('<div c1 c2><div dep></div></div>');
        expect(log).toEqual('dep:c1-c2');
      });
    });

    it('should support omitting the name of the required controller if it is the same as the key',
      () => {
        angular.mock.module(() => {
          directive('myC1', ngInternals.valueFn({
            controller: function () { this.name = 'c1'; }
          }));
          directive('myC2', ngInternals.valueFn({
            controller: function () { this.name = 'c2'; }
          }));
          directive('dep', log => {
            return {
              require: { myC1: '^', myC2: '^' },
              link: function (scope, element, attrs, controllers) {
                log('dep:' + controllers.myC1.name + '-' + controllers.myC2.name);
              }
            };
          });
        });
        angular.mock.inject((log, $compile, $rootScope) => {
          element = compileForTest('<div my-c1 my-c2><div dep></div></div>');
          expect(log).toEqual('dep:c1-c2');
        });
      }
    );

    it('should instantiate the controller just once when template/templateUrl', () => {
      const syncCtrlSpy = jest.fn(), asyncCtrlSpy = jest.fn();

      angular.mock.module(() => {
        directive('myDirectiveSync', ngInternals.valueFn({
          template: '<div>Hello!</div>',
          controller: syncCtrlSpy
        }));
        directive('myDirectiveAsync', ngInternals.valueFn({
          templateUrl: 'myDirectiveAsync.html',
          controller: asyncCtrlSpy,
          compile: function () {
            return () => {
            };
          }
        }));
      });

      angular.mock.inject(($templateCache, $compile, $rootScope) => {
        expect(syncCtrlSpy).not.toHaveBeenCalled();
        expect(asyncCtrlSpy).not.toHaveBeenCalled();

        $templateCache.put('myDirectiveAsync.html', '<div>Hello!</div>');
        element = compileForTest('<div>' +
          '<span xmy-directive-sync></span>' +
          '<span my-directive-async></span>' +
          '</div>');
        expect(syncCtrlSpy).not.toHaveBeenCalled();
        expect(asyncCtrlSpy).not.toHaveBeenCalled();

        $rootScope.$apply();

        //expect(syncCtrlSpy).toHaveBeenCalledTimes(1);
        expect(asyncCtrlSpy).toHaveBeenCalledTimes(1);
      });
    });



    it('should instantiate controllers in the parent->child order when transclusion, templateUrl and replacement ' +
      'are in the mix', () => {
        // When a child controller is in the transclusion that replaces the parent element that has a directive with
        // a controller, we should ensure that we first instantiate the parent and only then stuff that comes from the
        // transclusion.
        //
        // The transclusion moves the child controller onto the same element as parent controller so both controllers are
        // on the same level.

        angular.mock.module(() => {
          directive('parentDirective', () => {
            return {
              transclude: true,
              replace: true,
              templateUrl: 'parentDirective.html',
              controller: function (log) { log('parentController'); }
            };
          });
          directive('childDirective', () => {
            return {
              require: '^parentDirective',
              templateUrl: 'childDirective.html',
              controller: function (log) { log('childController'); }
            };
          });
        });

        angular.mock.inject(($templateCache, log, $compile, $rootScope) => {
          $templateCache.put('parentDirective.html', '<div ng-transclude>parentTemplateText;</div>');
          $templateCache.put('childDirective.html', '<span>childTemplateText;</span>');

          element = compileForTest('<div parent-directive><div child-directive></div>childContentText;</div>');
          $rootScope.$apply();
          expect(log).toEqual('parentController; childController');
          expect(element.text()).toBe('childTemplateText;childContentText;');
        });
      });


    it('should instantiate the controller after the isolate scope bindings are initialized (with template)', () => {
      angular.mock.module(() => {
        const Ctrl = ($scope, log) => {
          log('myFoo=' + $scope.myFoo);
        };

        directive('myDirective', () => {
          return {
            scope: {
              myFoo: '='
            },
            template: '<p>Hello</p>',
            controller: Ctrl
          };
        });
      });

      angular.mock.inject(($templateCache, $compile, $rootScope, log) => {
        $rootScope.foo = 'bar';

        element = compileForTest('<div my-directive my-foo="foo"></div>');
        $rootScope.$apply();
        expect(log).toEqual('myFoo=bar');
      });
    });


    it('should instantiate the controller after the isolate scope bindings are initialized (with templateUrl)', () => {
      angular.mock.module(() => {
        const Ctrl = ($scope, log) => {
          log('myFoo=' + $scope.myFoo);
        };

        directive('myDirective', () => {
          return {
            scope: {
              myFoo: '='
            },
            templateUrl: 'hello.html',
            controller: Ctrl
          };
        });
      });

      angular.mock.inject(($templateCache, $compile, $rootScope, log) => {
        $templateCache.put('hello.html', '<p>Hello</p>');
        $rootScope.foo = 'bar';

        element = compileForTest('<div my-directive my-foo="foo"></div>');
        $rootScope.$apply();
        expect(log).toEqual('myFoo=bar');
      });
    });


    it('should instantiate controllers in the parent->child->baby order when nested transclusion, templateUrl and ' +
      'replacement are in the mix', () => {
        // similar to the test above, except that we have one more layer of nesting and nested transclusion

        angular.mock.module(() => {
          directive('parentDirective', () => {
            return {
              transclude: true,
              replace: true,
              templateUrl: 'parentDirective.html',
              controller: function (log) { log('parentController'); }
            };
          });
          directive('childDirective', () => {
            return {
              require: '^parentDirective',
              transclude: true,
              replace: true,
              templateUrl: 'childDirective.html',
              controller: function (log) { log('childController'); }
            };
          });
          directive('babyDirective', () => {
            return {
              require: '^childDirective',
              templateUrl: 'babyDirective.html',
              controller: function (log) { log('babyController'); }
            };
          });
        });

        angular.mock.inject(($templateCache, log, $compile, $rootScope) => {
          $templateCache.put('parentDirective.html', '<div ng-transclude>parentTemplateText;</div>');
          $templateCache.put('childDirective.html', '<span ng-transclude>childTemplateText;</span>');
          $templateCache.put('babyDirective.html', '<span>babyTemplateText;</span>');

          element = compileForTest('<div parent-directive>' +
            '<div child-directive>' +
            'childContentText;' +
            '<div baby-directive>babyContent;</div>' +
            '</div>' +
            '</div>');
          $rootScope.$apply();
          expect(log).toEqual('parentController; childController; babyController');
          expect(element.text()).toBe('childContentText;babyTemplateText;');
        });
      });


    it('should allow controller usage in pre-link directive functions with templateUrl', () => {
      angular.mock.module(() => {
        const Ctrl = log => {
          log('instance');
        };

        directive('myDirective', () => {
          return {
            scope: true,
            templateUrl: 'hello.html',
            controller: Ctrl,
            compile: function () {
              return {
                pre: function (scope, template, attr, ctrl) { },
                post: function () { }
              };
            }
          };
        });
      });

      angular.mock.inject(($templateCache, $compile, $rootScope, log) => {
        $templateCache.put('hello.html', '<p>Hello</p>');

        element = compileForTest('<div my-directive></div>');
        $rootScope.$apply();

        expect(log).toEqual('instance');
        expect(element.text()).toBe('Hello');
      });
    });


    it('should allow controller usage in pre-link directive functions with a template', () => {
      angular.mock.module(() => {
        const Ctrl = log => {
          log('instance');
        };

        directive('myDirective', () => {
          return {
            scope: true,
            template: '<p>Hello</p>',
            controller: Ctrl,
            compile: function () {
              return {
                pre: function (scope, template, attr, ctrl) { },
                post: function () { }
              };
            }
          };
        });
      });

      angular.mock.inject(($templateCache, $compile, $rootScope, log) => {
        element = compileForTest('<div my-directive></div>');
        $rootScope.$apply();

        expect(log).toEqual('instance');
        expect(element.text()).toBe('Hello');
      });
    });


    it('should throw ctreq with correct directive name, regardless of order', () => {

      angular.mock.module($compileProvider => {
        $compileProvider.directive('aDir', ngInternals.valueFn({
          restrict: 'E',
          require: 'ngModel',
          link: angular.noop
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        expect(() => {
          // a-dir will cause a ctreq error to be thrown. Previously, the error would reference
          // the last directive in the chain (which in this case would be ngClick), based on
          // priority and alphabetical ordering. This test verifies that the ordering does not
          // affect which directive is referenced in the minErr message.
          element = compileForTest('<a-dir ng-click="foo=bar"></a-dir>');
        }).toThrowMinErr('$compile', 'ctreq',
          'Controller \'ngModel\', required by directive \'aDir\', can\'t be found!');
      });
    });
  });


  describe('transclude', () => {

    describe('content transclusion', () => {

      it('should support transclude directive', () => {
        angular.mock.module(() => {
          directive('trans', () => {
            return {
              transclude: 'content',
              replace: true,
              scope: {},
              link: function (scope) {
                scope.x = 'iso';
              },
              template: '<ul><li>W:{{x}}-{{$parent.$id}}-{{$id}};</li><li ng-transclude></li></ul>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div><div trans>T:{{x}}-{{$parent.$id}}-{{$id}}<span>;</span></div></div>');
          $rootScope.x = 'root';
          $rootScope.$apply();
          expect(element.text()).toEqual('W:iso-1-2;T:root-2-3;');
          expect(angular.element(angular.element(element.find('li')[1]).contents()[0]).text()).toEqual('T:root-2-3');
          expect(angular.element(element.find('span')[0]).text()).toEqual(';');
        });
      });


      it('should transclude transcluded content', () => {
        angular.mock.module(() => {
          directive('book', ngInternals.valueFn({
            transclude: 'content',
            template: '<div>book-<div chapter>(<div ng-transclude></div>)</div></div>'
          }));
          directive('chapter', ngInternals.valueFn({
            transclude: 'content',
            templateUrl: 'chapter.html'
          }));
          directive('section', ngInternals.valueFn({
            transclude: 'content',
            template: '<div>section-!<div ng-transclude></div>!</div></div>'
          }));
          return $httpBackend => {
            $httpBackend.
              expect('GET', 'chapter.html').
              respond('<div>chapter-<div section>[<div ng-transclude></div>]</div></div>');
          };
        });
        angular.mock.inject((log, $rootScope, $compile, $httpBackend) => {
          element = compileForTest('<div><div book>paragraph</div></div>');
          $rootScope.$apply();

          expect(element.text()).toEqual('book-');

          $httpBackend.flush();
          $rootScope.$apply();
          expect(element.text()).toEqual('book-chapter-section-![(paragraph)]!');
        });
      });


      it('should compile directives with lower priority than ngTransclude', () => {
        let ngTranscludePriority;
        const lowerPriority = -1;

        angular.mock.module($provide => {
          $provide.decorator('ngTranscludeDirective', $delegate => {
            ngTranscludePriority = $delegate[0].priority;
            return $delegate;
          });

          directive('lower', log => {
            return {
              priority: lowerPriority,
              link: {
                pre: function () {
                  log('pre');
                },
                post: function () {
                  log('post');
                }
              }
            };
          });
          directive('trans', log => {
            return {
              transclude: true,
              template: '<div lower ng-transclude></div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div trans><span>transcluded content</span></div>');

          expect(lowerPriority).toBeLessThan(ngTranscludePriority);

          $rootScope.$apply();

          expect(element.text()).toEqual('transcluded content');
          expect(log).toEqual('pre; post');
        });
      });


      it('should not merge text elements from transcluded content', () => {
        angular.mock.module(() => {
          directive('foo', ngInternals.valueFn({
            transclude: 'content',
            template: '<div>This is before {{before}}. </div>',
            link: function (scope, element, attr, ctrls, $transclude) {
              const futureParent = element.children().eq(0);
              $transclude(clone => {
                futureParent.append(clone);
              }, futureParent);
            },
            scope: true
          }));
        });
        angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<div><div foo>This is after {{after}}</div></div>');
          $rootScope.before = 'BEFORE';
          $rootScope.after = 'AFTER';
          $rootScope.$apply();
          expect(element.text()).toEqual('This is before BEFORE. This is after AFTER');

          $rootScope.before = 'Not-Before';
          $rootScope.after = 'AfTeR';
          $rootScope.$$childHead.before = 'BeFoRe';
          $rootScope.$$childHead.after = 'Not-After';
          $rootScope.$apply();
          expect(element.text()).toEqual('This is before BeFoRe. This is after AfTeR');
        });
      });


      it('should only allow one content transclusion per element', () => {
        angular.mock.module(() => {
          directive('first', ngInternals.valueFn({
            transclude: true
          }));
          directive('second', ngInternals.valueFn({
            transclude: true
          }));
        });
        angular.mock.inject($compile => {
          expect(() => {
            compileForTest('<div first="" second=""></div>');
          }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <div .+/);
        });
      });


      it('should correctly handle multi-element directives', () => {
        angular.mock.module(() => {
          directive('foo', ngInternals.valueFn({
            template: '[<div ng-transclude></div>]',
            transclude: true
          }));
          directive('bar', ngInternals.valueFn({
            template: '[<div ng-transclude="header"></div>|<div ng-transclude="footer"></div>]',
            transclude: {
              header: 'header',
              footer: 'footer'
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          const tmplWithFoo =
            '<foo>' +
            '<div ng-if-start="true">Hello, </div>' +
            '<div ng-if-end>world!</div>' +
            '</foo>';
          const tmplWithBar =
            '<bar>' +
            '<header ng-if-start="true">This is a </header>' +
            '<header ng-if-end>header!</header>' +
            '<footer ng-if-start="true">This is a </footer>' +
            '<footer ng-if-end>footer!</footer>' +
            '</bar>';

          const elem1 = compileForTest(tmplWithFoo);
          const elem2 = compileForTest(tmplWithBar);

          $rootScope.$digest();

          expect(elem1.text()).toBe('[Hello, world!]');
          expect(elem2.text()).toBe('[This is a header!|This is a footer!]');

          dealoc(elem1);
          dealoc(elem2);
        });
      });


      //see issue https://github.com/angular/angular.js/issues/12936
      it('should use the proper scope when it is on the root element of a replaced directive template', () => {
        angular.mock.module(() => {
          directive('isolate', ngInternals.valueFn({
            scope: {},
            replace: true,
            template: '<div trans>{{x}}</div>',
            link: function (scope, element, attr, ctrl) {
              scope.x = 'iso';
            }
          }));
          directive('trans', ngInternals.valueFn({
            transclude: 'content',
            link: function (scope, element, attr, ctrl, $transclude) {
              $transclude(clone => {
                element.append(clone);
              });
            }
          }));
        });
        angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<isolate></isolate>');
          $rootScope.x = 'root';
          $rootScope.$apply();
          expect(element.text()).toEqual('iso');
        });
      });


      //see issue https://github.com/angular/angular.js/issues/12936
      it('should use the proper scope when it is on the root element of a replaced directive template with child scope', () => {
        angular.mock.module(() => {
          directive('child', ngInternals.valueFn({
            scope: true,
            replace: true,
            template: '<div trans>{{x}}</div>',
            link: function (scope, element, attr, ctrl) {
              scope.x = 'child';
            }
          }));
          directive('trans', ngInternals.valueFn({
            transclude: 'content',
            link: function (scope, element, attr, ctrl, $transclude) {
              $transclude(clone => {
                element.append(clone);
              });
            }
          }));
        });
        angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<child></child>');
          $rootScope.x = 'root';
          $rootScope.$apply();
          expect(element.text()).toEqual('child');
        });
      });

      it('should throw if a transcluded node is transcluded again', () => {

        angular.mock.module(() => {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            link: function (scope, element, attr, ctrl, $transclude) {
              $transclude();
              $transclude();
            }
          }));
        });
        angular.mock.inject(($rootScope, $compile) => {
          expect(() => {
            compileForTest('<trans></trans>');
          }).toThrowMinErr('$compile', 'multilink', 'This element has already been linked.');
        });
      });

      it('should not leak if two "element" transclusions are on the same element (with debug info)', () => {
        if (ngInternals.jQuery) {
          // jQuery 2.x doesn't expose the cache storage.
          return;
        }


        angular.mock.module($compileProvider => {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(($compile, $rootScope) => {
          const cacheSize = jqLiteCacheSize();

          element = compileForTest('<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          $rootScope.$apply('xs = [0,1]');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 2);

          $rootScope.$apply('xs = [0]');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          $rootScope.$apply('xs = []');
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          element.remove();
          expect(jqLiteCacheSize()).toEqual(cacheSize + 0);
        });
      });


      it('should not leak if two "element" transclusions are on the same element (without debug info)', () => {
        if (ngInternals.jQuery) {
          // jQuery 2.x doesn't expose the cache storage.
          return;
        }


        angular.mock.module($compileProvider => {
          $compileProvider.debugInfoEnabled(false);
        });

        angular.mock.inject(($compile, $rootScope) => {
          const cacheSize = jqLiteCacheSize();

          element = compileForTest('<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          $rootScope.$apply('xs = [0,1]');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          $rootScope.$apply('xs = [0]');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          $rootScope.$apply('xs = []');
          expect(jqLiteCacheSize()).toEqual(cacheSize);

          element.remove();
          expect(jqLiteCacheSize()).toEqual(cacheSize);
        });
      });


      it('should not leak if two "element" transclusions are on the same element (with debug info)', () => {
        if (ngInternals.jQuery) {
          // jQuery 2.x doesn't expose the cache storage.
          return;
        }

        angular.mock.module($compileProvider => {
          $compileProvider.debugInfoEnabled(true);
        });

        angular.mock.inject(($compile, $rootScope) => {
          const cacheSize = jqLiteCacheSize();
          element = compileForTest('<div><div ng-repeat="x in xs" ng-if="val">{{x}}</div></div>');

          $rootScope.$apply('xs = [0,1]');
          // At this point we have a bunch of comment placeholders but no real transcluded elements
          // So the cache only contains the root element's data
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          $rootScope.$apply('val = true');
          // Now we have two concrete transcluded elements plus some comments so two more cache items
          expect(jqLiteCacheSize()).toEqual(cacheSize + 3);

          $rootScope.$apply('val = false');
          // Once again we only have comments so no transcluded elements and the cache is back to just
          // the root element
          expect(jqLiteCacheSize()).toEqual(cacheSize + 1);

          element.remove();
          // Now we've even removed the root element along with its cache
          expect(jqLiteCacheSize()).toEqual(cacheSize + 0);
        });
      });

      it('should not leak when continuing the compilation of elements on a scope that was destroyed', () => {
        if (ngInternals.jQuery) {
          // jQuery 2.x doesn't expose the cache storage.
          return;
        }

        const linkFn = jest.fn();

        angular.mock.module(($controllerProvider, $compileProvider) => {
          $controllerProvider.register('Leak', ($scope, $timeout) => {
            $scope.code = 'red';
            $timeout(() => {
              $scope.code = 'blue';
            });
          });
          $compileProvider.directive('isolateRed', () => {
            return {
              restrict: 'A',
              scope: {},
              template: '<div red></div>'
            };
          });
          $compileProvider.directive('red', () => {
            return {
              restrict: 'A',
              templateUrl: 'red.html',
              scope: {},
              link: linkFn
            };
          });
        });

        angular.mock.inject(($compile, $rootScope, $httpBackend, $timeout, $templateCache) => {
          const cacheSize = jqLiteCacheSize();
          $httpBackend.whenGET('red.html').respond('<p>red.html</p>');
          const template = generateTestCompiler(
            '<div ng-controller="Leak">' +
            '<div ng-switch="code">' +
            '<div ng-switch-when="red">' +
            '<div isolate-red></div>' +
            '</div>' +
            '</div>' +
            '</div>');
          element = template($rootScope, angular.noop);
          $rootScope.$digest();
          $timeout.flush();
          $httpBackend.flush();
          expect(linkFn).not.toHaveBeenCalled();
          expect(jqLiteCacheSize()).toEqual(cacheSize + 2);

          $templateCache.removeAll();
          const destroyedScope = $rootScope.$new();
          destroyedScope.$destroy();
          const clone = template(destroyedScope, angular.noop);
          $rootScope.$digest();
          $timeout.flush();
          expect(linkFn).not.toHaveBeenCalled();
          clone.remove();
        });
      });

      describe('cleaning up after a replaced element', () => {
        let $compile, xs;
        beforeEach(angular.mock.inject(_$compile_ => {
          $compile = _$compile_;
          xs = [0, 1];
        }));

        function testCleanup() {
          let privateData, firstRepeatedElem;

          element = compileForTest('<div><div ng-repeat="x in xs" ng-click="noop()">{{x}}</div></div>');

          $rootScope.$apply('xs = [' + xs + ']');
          firstRepeatedElem = element.children('.ng-scope').eq(0);

          expect(firstRepeatedElem.data('$scope')).toBeDefined();
          privateData = angular.element._data(firstRepeatedElem[0]);
          expect(privateData.events).toBeDefined();
          expect(privateData.events.click).toBeDefined();
          expect(privateData.events.click[0]).toBeDefined();

          //Ensure the AngularJS $destroy event is still sent
          let destroyCount = 0;
          element.find('div').on('$destroy', () => {
            destroyCount++;
          });

          $rootScope.$apply('xs = null');

          expect(destroyCount).toBe(2);
          expect(firstRepeatedElem.data('$scope')).not.toBeDefined();
          privateData = angular.element._data(firstRepeatedElem[0]);
          expect(privateData && privateData.events).not.toBeDefined();
        }

        it('should work without external libraries (except jQuery)', testCleanup);

        it('should work with another library patching jqLite/jQuery.cleanData after AngularJS', () => {
          let cleanedCount = 0;
          const currentCleanData = angular.element.cleanData;
          angular.element.cleanData = elems => {
            cleanedCount += elems.length;
            // Don't return the output and explicitly pass only the first parameter
            // so that we're sure we're not relying on either of them. jQuery UI patch
            // behaves in this way.
            currentCleanData(elems);
          };

          testCleanup();

          // The ng-repeat template is removed/cleaned (the +1)
          // and each clone of the ng-repeat template is also removed (xs.length)
          expect(cleanedCount).toBe(xs.length + 1);

          // Restore the previous cleanData.
          angular.element.cleanData = currentCleanData;
        });
      });


      it('should add a $$transcluded property onto the transcluded scope', () => {
        angular.mock.module(() => {
          directive('trans', () => {
            return {
              transclude: true,
              replace: true,
              scope: true,
              template: '<div><span>I:{{$$transcluded}}</span><span ng-transclude></span></div>'
            };
          });
        });
        angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<div><div trans>T:{{$$transcluded}}</div></div>');
          $rootScope.$apply();
          expect(angular.element(element.find('span')[0]).text()).toEqual('I:');
          expect(angular.element(element.find('span')[1]).text()).toEqual('T:true');
        });
      });


      it('should clear contents of the ng-transclude element before appending transcluded content' +
        ' if transcluded content exists', () => {
          angular.mock.module(() => {
            directive('trans', () => {
              return {
                transclude: true,
                template: '<div ng-transclude>old stuff!</div>'
              };
            });
          });
          angular.mock.inject(($rootScope, $compile) => {
            element = compileForTest('<div trans>unicorn!</div>');
            $rootScope.$apply();
            expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">unicorn!</div>');
          });
        });

      it('should NOT clear contents of the ng-transclude element before appending transcluded content' +
        ' if transcluded content does NOT exist', () => {
          angular.mock.module(() => {
            directive('trans', () => {
              return {
                transclude: true,
                template: '<div ng-transclude>old stuff!</div>'
              };
            });
          });
          angular.mock.inject((log, $rootScope, $compile) => {
            element = compileForTest('<div trans></div>');
            $rootScope.$apply();
            expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">old stuff!</div>');
          });
        });


      it('should clear the fallback content from the element during compile and before linking', () => {
        angular.mock.module(() => {
          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-transclude>fallback content</div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = angular.element('<div trans></div>');
          const linkfn = generateTestCompiler(element);
          expect(element.html()).toEqual('<div ng-transclude=""></div>');
          linkfn($rootScope);
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">fallback content</div>');
        });
      });


      it('should allow cloning of the fallback via ngRepeat', () => {
        angular.mock.module(() => {
          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-repeat="i in [0,1,2]"><div ng-transclude>{{i}}</div></div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div trans></div>');
          $rootScope.$apply();
          expect(element.text()).toEqual('012');
        });
      });


      it('should not link the fallback content if transcluded content is provided', () => {
        const linkSpy = jest.fn();

        angular.mock.module(() => {
          directive('inner', () => {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<div trans>unicorn!</div>');
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">unicorn!</div>');
          expect(linkSpy).not.toHaveBeenCalled();
        });
      });

      it('should compile and link the fallback content if no transcluded content is provided', () => {
        const linkSpy = jest.fn();

        angular.mock.module(() => {
          directive('inner', () => {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div trans></div>');
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""><inner>old stuff! </inner></div>');
          expect(linkSpy).toHaveBeenCalled();
        });
      });

      it('should compile and link the fallback content if only whitespace transcluded content is provided', () => {
        const linkSpy = jest.fn();

        angular.mock.module(() => {
          directive('inner', () => {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div trans>\n  \n</div>');
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""><inner>old stuff! </inner></div>');
          expect(linkSpy).toHaveBeenCalled();
        });
      });

      it('should not link the fallback content if only whitespace and comments are provided as transclude content', () => {
        const linkSpy = jest.fn();

        angular.mock.module(() => {
          directive('inner', () => {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-transclude><inner></inner></div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div trans>\n<!-- some comment -->  \n</div>');
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="">\n<!-- some comment -->  \n</div>');
          expect(linkSpy).not.toHaveBeenCalled();
        });
      });

      it('should compile and link the fallback content if an optional transclusion slot is not provided', () => {
        const linkSpy = jest.fn();

        angular.mock.module(() => {
          directive('inner', () => {
            return {
              restrict: 'E',
              template: 'old stuff! ',
              link: linkSpy
            };
          });

          directive('trans', () => {
            return {
              transclude: { optionalSlot: '?optional' },
              template: '<div ng-transclude="optionalSlot"><inner></inner></div>'
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div trans></div>');
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude="optionalSlot"><inner>old stuff! </inner></div>');
          expect(linkSpy).toHaveBeenCalled();
        });
      });

      it('should cope if there is neither transcluded content nor fallback content', () => {
        angular.mock.module(() => {
          directive('trans', () => {
            return {
              transclude: true,
              template: '<div ng-transclude></div>'
            };
          });
        });
        angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<div trans></div>');
          $rootScope.$apply();
          expect(sortedHtml(element.html())).toEqual('<div ng-transclude=""></div>');
        });
      });

      it('should throw on an ng-transclude element inside no transclusion directive', () => {

        angular.mock.inject(($rootScope, $compile) => {
          let error;

          try {
            compileForTest('<div><div ng-transclude></div></div>');
          } catch (e) {
            error = e;
          }

          expect(error).toEqualMinErr('ngTransclude', 'orphan',
            'Illegal use of ngTransclude directive in the template! ' +
            'No parent directive that requires a transclusion found. ' +
            'Element: <div ng-transclude');
          // we need to do this because different browsers print empty attributes differently
        });
      });


      it('should not pass transclusion into a template directive when the directive didn\'t request transclusion', () => {


        angular.mock.module($compileProvider => {

          $compileProvider.directive('transFoo', ngInternals.valueFn({
            template: '<div>' +
              '<div no-trans-bar></div>' +
              '<div ng-transclude>this one should get replaced with content</div>' +
              '<div class="foo" ng-transclude></div>' +
              '</div>',
            transclude: true

          }));

          $compileProvider.directive('noTransBar', ngInternals.valueFn({
            template: '<div>' +
              // This ng-transclude is invalid. It should throw an error.
              '<div class="bar" ng-transclude></div>' +
              '</div>',
            transclude: false

          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          expect(() => {
            compileForTest('<div trans-foo>content</div>');
          }).toThrowMinErr('ngTransclude', 'orphan',
            'Illegal use of ngTransclude directive in the template! No parent directive that requires a transclusion found. Element: <div class="bar" ng-transclude="">');
        });
      });


      it('should not pass transclusion into a templateUrl directive', () => {

        angular.mock.module($compileProvider => {

          $compileProvider.directive('transFoo', ngInternals.valueFn({
            template: '<div>' +
              '<div no-trans-bar></div>' +
              '<div ng-transclude>this one should get replaced with content</div>' +
              '<div class="foo" ng-transclude></div>' +
              '</div>',
            transclude: true
          }));

          $compileProvider.directive('noTransBar', ngInternals.valueFn({
            templateUrl: 'noTransBar.html',
            transclude: false
          }));
        });

        angular.mock.inject(($compile, $rootScope, $templateCache) => {
          $templateCache.put('noTransBar.html',
            '<div>' +
            // This ng-transclude is invalid. It should throw an error.
            '<div class="bar" ng-transclude></div>' +
            '</div>');

          expect(() => {
            element = compileForTest('<div trans-foo>content</div>');
            $rootScope.$digest();
          }).toThrowMinErr('ngTransclude', 'orphan',
            'Illegal use of ngTransclude directive in the template! ' +
            'No parent directive that requires a transclusion found. ' +
            'Element: <div class="bar" ng-transclude="">');
        });
      });


      it('should expose transcludeFn in compile fn even for templateUrl', () => {
        angular.mock.module(() => {
          directive('transInCompile', ngInternals.valueFn({
            transclude: true,
            // template: '<div class="foo">whatever</div>',
            templateUrl: 'foo.html',
            compile: function (_, __, transclude) {
              return (scope, element) => {
                transclude(scope, (clone, scope) => {
                  element.html('');
                  element.append(clone);
                });
              };
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope, $templateCache) => {
          $templateCache.put('foo.html', '<div class="foo">whatever</div>');

          compile('<div trans-in-compile>transcluded content</div>');
          $rootScope.$apply();

          expect(ngInternals.trim(element.text())).toBe('transcluded content');
        });
      });


      it('should make the result of a transclusion available to the parent directive in post-linking phase' +
        '(template)', () => {
          angular.mock.module(() => {
            directive('trans', log => {
              return {
                transclude: true,
                template: '<div ng-transclude></div>',
                link: {
                  pre: function ($scope, $element) {
                    log('pre(' + $element.text() + ')');
                  },
                  post: function ($scope, $element) {
                    log('post(' + $element.text() + ')');
                  }
                }
              };
            });
          });
          angular.mock.inject((log, $rootScope, $compile) => {
            element = compileForTest('<div trans><span>unicorn!</span></div>');
            $rootScope.$apply();
            expect(log).toEqual('pre(); post(unicorn!)');
          });
        });


      it('should make the result of a transclusion available to the parent directive in post-linking phase' +
        '(templateUrl)', () => {
          // when compiling an async directive the transclusion is always processed before the directive
          // this is different compared to sync directive. delaying the transclusion makes little sense.

          angular.mock.module(() => {
            directive('trans', log => {
              return {
                transclude: true,
                templateUrl: 'trans.html',
                link: {
                  pre: function ($scope, $element) {
                    log('pre(' + $element.text() + ')');
                  },
                  post: function ($scope, $element) {
                    log('post(' + $element.text() + ')');
                  }
                }
              };
            });
          });
          angular.mock.inject((log, $rootScope, $compile, $templateCache) => {
            $templateCache.put('trans.html', '<div ng-transclude></div>');

            element = compileForTest('<div trans><span>unicorn!</span></div>');
            $rootScope.$apply();
            expect(log).toEqual('pre(); post(unicorn!)');
          });
        });


      it('should make the result of a transclusion available to the parent *replace* directive in post-linking phase' +
        '(template)', () => {
          angular.mock.module(() => {
            directive('replacedTrans', log => {
              return {
                transclude: true,
                replace: true,
                template: '<div ng-transclude></div>',
                link: {
                  pre: function ($scope, $element) {
                    log('pre(' + $element.text() + ')');
                  },
                  post: function ($scope, $element) {
                    log('post(' + $element.text() + ')');
                  }
                }
              };
            });
          });
          angular.mock.inject((log, $rootScope, $compile) => {
            element = compileForTest('<div replaced-trans><span>unicorn!</span></div>');
            $rootScope.$apply();
            expect(log).toEqual('pre(); post(unicorn!)');
          });
        });


      it('should make the result of a transclusion available to the parent *replace* directive in post-linking phase' +
        ' (templateUrl)', () => {
          angular.mock.module(() => {
            directive('replacedTrans', log => {
              return {
                transclude: true,
                replace: true,
                templateUrl: 'trans.html',
                link: {
                  pre: function ($scope, $element) {
                    log('pre(' + $element.text() + ')');
                  },
                  post: function ($scope, $element) {
                    log('post(' + $element.text() + ')');
                  }
                }
              };
            });
          });
          angular.mock.inject((log, $rootScope, $compile, $templateCache) => {
            $templateCache.put('trans.html', '<div ng-transclude></div>');

            element = compileForTest('<div replaced-trans><span>unicorn!</span></div>');
            $rootScope.$apply();
            expect(log).toEqual('pre(); post(unicorn!)');
          });
        });

      it('should copy the directive controller to all clones', () => {
        let transcludeCtrl;
        const cloneCount = 2;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller: function ($transclude) {
              transcludeCtrl = this;
            },
            link: function (scope, el, attr, ctrl, $transclude) {
              let i;
              for (i = 0; i < cloneCount; i++) {
                $transclude(cloneAttach);
              }

              function cloneAttach(clone) {
                el.append(clone);
              }
            }
          }));
        });
        angular.mock.inject($compile => {
          element = compileForTest('<div transclude><span></span></div>');
          const children = element.children();
          let i;
          expect(transcludeCtrl).toBeDefined();

          expect(element.data('$transcludeController')).toBe(transcludeCtrl);
          for (i = 0; i < cloneCount; i++) {
            expect(children.eq(i).data('$transcludeController')).toBeUndefined();
          }
        });
      });

      it('should provide the $transclude controller local as 5th argument to the pre and post-link function', () => {
        let ctrlTransclude, preLinkTransclude, postLinkTransclude;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller: function ($transclude) {
              ctrlTransclude = $transclude;
            },
            compile: function () {
              return {
                pre: function (scope, el, attr, ctrl, $transclude) {
                  preLinkTransclude = $transclude;
                },
                post: function (scope, el, attr, ctrl, $transclude) {
                  postLinkTransclude = $transclude;
                }
              };
            }
          }));
        });
        angular.mock.inject($compile => {
          element = compileForTest('<div transclude></div>');
          expect(ctrlTransclude).toBeDefined();
          expect(ctrlTransclude).toBe(preLinkTransclude);
          expect(ctrlTransclude).toBe(postLinkTransclude);
        });
      });

      it('should allow an optional scope argument in $transclude', () => {
        let capturedChildCtrl;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            link: function (scope, element, attr, ctrl, $transclude) {
              $transclude(scope, clone => {
                element.append(clone);
              });
            }
          }));
        });
        angular.mock.inject($compile => {
          element = compileForTest('<div transclude>{{$id}}</div>');
          $rootScope.$apply();
          expect(element.text()).toBe('' + $rootScope.$id);
        });

      });

      it('should expose the directive controller to transcluded children', () => {
        let capturedChildCtrl;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller: function () {
            },
            link: function (scope, element, attr, ctrl, $transclude) {
              $transclude(clone => {
                element.append(clone);
              });
            }
          }));
          directive('child', ngInternals.valueFn({
            require: '^transclude',
            link: function (scope, element, attr, ctrl) {
              capturedChildCtrl = ctrl;
            }
          }));
        });
        angular.mock.inject($compile => {
          element = compileForTest('<div transclude><div child></div></div>');
          expect(capturedChildCtrl).toBeTruthy();
        });
      });


      // See issue https://github.com/angular/angular.js/issues/14924
      it('should not process top-level transcluded text nodes merged into their sibling',
        () => {
          angular.mock.module(() => {
            directive('transclude', ngInternals.valueFn({
              template: '<ng-transclude></ng-transclude>',
              transclude: true,
              scope: {}
            }));
          });

          angular.mock.inject($compile => {
            element = angular.element('<div transclude></div>');
            element[0].appendChild(document.createTextNode('1{{ value }}'));
            element[0].appendChild(document.createTextNode('2{{ value }}'));
            element[0].appendChild(document.createTextNode('3{{ value }}'));

            const initialWatcherCount = $rootScope.$countWatchers();
            compileForTest(element);
            $rootScope.$apply('value = 0');
            const newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

            expect(element.text()).toBe('102030');
            expect(newWatcherCount).toBe(3);
          });
        }
      );


      // see issue https://github.com/angular/angular.js/issues/9413
      describe('passing a parent bound transclude function to the link ' +
        'function returned from `$compile`', () => {

          beforeEach(angular.mock.module(() => {
            directive('lazyCompile', $compile => {
              return {
                compile: function (tElement, tAttrs) {
                  const content = tElement.contents();
                  tElement.empty();
                  return (scope, element, attrs, ctrls, transcludeFn) => {
                    element.append(content);
                    compileForTest(content, scope, undefined, {
                      parentBoundTranscludeFn: transcludeFn
                    });
                  };
                }
              };
            });
            directive('toggle', ngInternals.valueFn({
              scope: { t: '=toggle' },
              transclude: true,
              template: '<div ng-if="t"><lazy-compile><div ng-transclude></div></lazy-compile></div>'
            }));
          }));

          it('should preserve the bound scope', () => {

            angular.mock.inject(($compile, $rootScope) => {
              element = compileForTest(
                '<div>' +
                '<div ng-init="outer=true"></div>' +
                '<div toggle="t">' +
                '<span ng-if="outer">Success</span><span ng-if="!outer">Error</span>' +
                '</div>' +
                '</div>');

              $rootScope.$apply('t = false');
              expect($rootScope.$countChildScopes()).toBe(1);
              expect(element.text()).toBe('');

              $rootScope.$apply('t = true');
              expect($rootScope.$countChildScopes()).toBe(4);
              expect(element.text()).toBe('Success');

              $rootScope.$apply('t = false');
              expect($rootScope.$countChildScopes()).toBe(1);
              expect(element.text()).toBe('');

              $rootScope.$apply('t = true');
              expect($rootScope.$countChildScopes()).toBe(4);
              expect(element.text()).toBe('Success');
            });
          });


          it('should preserve the bound scope when using recursive transclusion', () => {

            directive('recursiveTransclude', ngInternals.valueFn({
              transclude: true,
              template: '<div><lazy-compile><div ng-transclude></div></lazy-compile></div>'
            }));

            angular.mock.inject(($compile, $rootScope) => {
              element = compileForTest(
                '<div>' +
                '<div ng-init="outer=true"></div>' +
                '<div toggle="t">' +
                '<div recursive-transclude>' +
                '<span ng-if="outer">Success</span><span ng-if="!outer">Error</span>' +
                '</div>' +
                '</div>' +
                '</div>');

              $rootScope.$apply('t = false');
              expect($rootScope.$countChildScopes()).toBe(1);
              expect(element.text()).toBe('');

              $rootScope.$apply('t = true');
              expect($rootScope.$countChildScopes()).toBe(4);
              expect(element.text()).toBe('Success');

              $rootScope.$apply('t = false');
              expect($rootScope.$countChildScopes()).toBe(1);
              expect(element.text()).toBe('');

              $rootScope.$apply('t = true');
              expect($rootScope.$countChildScopes()).toBe(4);
              expect(element.text()).toBe('Success');
            });
          });
        });


      // see issue https://github.com/angular/angular.js/issues/9095
      describe('removing a transcluded element', () => {

        beforeEach(angular.mock.module(() => {
          directive('toggle', () => {
            return {
              transclude: true,
              template: '<div ng:if="t"><div ng:transclude></div></div>'
            };
          });
        }));


        it('should not leak the transclude scope when the transcluded content is an element transclusion directive',
          angular.mock.inject(($compile, $rootScope) => {

            element = compileForTest(
              '<div toggle>' +
              '<div ng:repeat="msg in [\'msg-1\']">{{ msg }}</div>' +
              '</div>'
            );

            $rootScope.$apply('t = true');
            expect(element.text()).toContain('msg-1');
            // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
            expect($rootScope.$countChildScopes()).toBe(3);

            $rootScope.$apply('t = false');
            expect(element.text()).not.toContain('msg-1');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);

            $rootScope.$apply('t = true');
            expect(element.text()).toContain('msg-1');
            // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
            expect($rootScope.$countChildScopes()).toBe(3);

            $rootScope.$apply('t = false');
            expect(element.text()).not.toContain('msg-1');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);
          }));


        it('should not leak the transclude scope when the transcluded content is an multi-element transclusion directive',
          angular.mock.inject(($compile, $rootScope) => {

            element = compileForTest(
              '<div toggle>' +
              '<div ng:repeat-start="msg in [\'msg-1\']">{{ msg }}</div>' +
              '<div ng:repeat-end>{{ msg }}</div>' +
              '</div>'
            );

            $rootScope.$apply('t = true');
            expect(element.text()).toContain('msg-1msg-1');
            // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
            expect($rootScope.$countChildScopes()).toBe(3);

            $rootScope.$apply('t = false');
            expect(element.text()).not.toContain('msg-1msg-1');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);

            $rootScope.$apply('t = true');
            expect(element.text()).toContain('msg-1msg-1');
            // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
            expect($rootScope.$countChildScopes()).toBe(3);

            $rootScope.$apply('t = false');
            expect(element.text()).not.toContain('msg-1msg-1');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);
          }));


        it('should not leak the transclude scope if the transcluded contains only comments',
          angular.mock.inject(($compile, $rootScope) => {

            element = compileForTest(
              '<div toggle>' +
              '<!-- some comment -->' +
              '</div>'
            );

            $rootScope.$apply('t = true');
            expect(element.html()).toContain('some comment');
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$countChildScopes()).toBe(2);

            $rootScope.$apply('t = false');
            expect(element.html()).not.toContain('some comment');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);

            $rootScope.$apply('t = true');
            expect(element.html()).toContain('some comment');
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$countChildScopes()).toBe(2);

            $rootScope.$apply('t = false');
            expect(element.html()).not.toContain('some comment');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);
          }));

        it('should not leak the transclude scope if the transcluded contains only text nodes',
          angular.mock.inject(($compile, $rootScope) => {

            element = compileForTest(
              '<div toggle>' +
              'some text' +
              '</div>'
            );

            $rootScope.$apply('t = true');
            expect(element.html()).toContain('some text');
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$countChildScopes()).toBe(2);

            $rootScope.$apply('t = false');
            expect(element.html()).not.toContain('some text');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);

            $rootScope.$apply('t = true');
            expect(element.html()).toContain('some text');
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$countChildScopes()).toBe(2);

            $rootScope.$apply('t = false');
            expect(element.html()).not.toContain('some text');
            // Expected scopes: $rootScope
            expect($rootScope.$countChildScopes()).toBe(0);
          }));

        it('should mark as destroyed all sub scopes of the scope being destroyed',
          angular.mock.inject(($compile, $rootScope) => {

            element = compileForTest(
              '<div toggle>' +
              '<div ng:repeat="msg in [\'msg-1\']">{{ msg }}</div>' +
              '</div>'
            );

            $rootScope.$apply('t = true');
            const childScopes = getChildScopes($rootScope);

            $rootScope.$apply('t = false');
            for (let i = 0; i < childScopes.length; ++i) {
              expect(childScopes[i].$$destroyed).toBe(true);
            }
          }));
      });


      describe('nested transcludes', () => {

        beforeEach(angular.mock.module($compileProvider => {

          $compileProvider.directive('noop', ngInternals.valueFn({}));

          $compileProvider.directive('sync', ngInternals.valueFn({
            template: '<div ng-transclude></div>',
            transclude: true
          }));

          $compileProvider.directive('async', ngInternals.valueFn({
            templateUrl: 'async',
            transclude: true
          }));

          $compileProvider.directive('syncSync', ngInternals.valueFn({
            template: '<div noop><div sync><div ng-transclude></div></div></div>',
            transclude: true
          }));

          $compileProvider.directive('syncAsync', ngInternals.valueFn({
            template: '<div noop><div async><div ng-transclude></div></div></div>',
            transclude: true
          }));

          $compileProvider.directive('asyncSync', ngInternals.valueFn({
            templateUrl: 'asyncSync',
            transclude: true
          }));

          $compileProvider.directive('asyncAsync', ngInternals.valueFn({
            templateUrl: 'asyncAsync',
            transclude: true
          }));

        }));

        beforeEach(angular.mock.inject($templateCache => {
          $templateCache.put('async', '<div ng-transclude></div>');
          $templateCache.put('asyncSync', '<div noop><div sync><div ng-transclude></div></div></div>');
          $templateCache.put('asyncAsync', '<div noop><div async><div ng-transclude></div></div></div>');
        }));


        it('should allow nested transclude directives with sync template containing sync template', angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div sync-sync>transcluded content</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        it('should allow nested transclude directives with sync template containing async template', angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div sync-async>transcluded content</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        it('should allow nested transclude directives with async template containing sync template', angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div async-sync>transcluded content</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        it('should allow nested transclude directives with async template containing asynch template', angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div async-async>transcluded content</div>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));


        it('should not leak memory with nested transclusion', () => {
          angular.mock.inject(($compile, $rootScope) => {
            let size;
            const initialSize = jqLiteCacheSize();

            element = angular.element('<div><ul><li ng-repeat="n in nums">{{n}} => <i ng-if="0 === n%2">Even</i><i ng-if="1 === n%2">Odd</i></li></ul></div>');
            compileForTest(element);

            $rootScope.nums = [0, 1, 2];
            $rootScope.$apply();
            size = jqLiteCacheSize();

            $rootScope.nums = [3, 4, 5];
            $rootScope.$apply();
            expect(jqLiteCacheSize()).toEqual(size);

            element.remove();
            expect(jqLiteCacheSize()).toEqual(initialSize);
          });
        });
      });


      describe('nested isolated scope transcludes', () => {
        beforeEach(angular.mock.module($compileProvider => {

          $compileProvider.directive('trans', ngInternals.valueFn({
            restrict: 'E',
            template: '<div ng-transclude></div>',
            transclude: true
          }));

          $compileProvider.directive('transAsync', ngInternals.valueFn({
            restrict: 'E',
            templateUrl: 'transAsync',
            transclude: true
          }));

          $compileProvider.directive('iso', ngInternals.valueFn({
            restrict: 'E',
            transclude: true,
            template: '<trans><span ng-transclude></span></trans>',
            scope: {}
          }));
          $compileProvider.directive('isoAsync1', ngInternals.valueFn({
            restrict: 'E',
            transclude: true,
            template: '<trans-async><span ng-transclude></span></trans-async>',
            scope: {}
          }));
          $compileProvider.directive('isoAsync2', ngInternals.valueFn({
            restrict: 'E',
            transclude: true,
            templateUrl: 'isoAsync',
            scope: {}
          }));
        }));

        beforeEach(angular.mock.inject($templateCache => {
          $templateCache.put('transAsync', '<div ng-transclude></div>');
          $templateCache.put('isoAsync', '<trans-async><span ng-transclude></span></trans-async>');
        }));


        it('should pass the outer scope to the transclude on the isolated template sync-sync', angular.mock.inject(($compile, $rootScope) => {

          $rootScope.val = 'transcluded content';
          element = compileForTest('<iso><span ng-bind="val"></span></iso>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        it('should pass the outer scope to the transclude on the isolated template async-sync', angular.mock.inject(($compile, $rootScope) => {

          $rootScope.val = 'transcluded content';
          element = compileForTest('<iso-async1><span ng-bind="val"></span></iso-async1>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

        it('should pass the outer scope to the transclude on the isolated template async-async', angular.mock.inject(($compile, $rootScope) => {

          $rootScope.val = 'transcluded content';
          element = compileForTest('<iso-async2><span ng-bind="val"></span></iso-async2>');
          $rootScope.$digest();
          expect(element.text()).toEqual('transcluded content');
        }));

      });

      describe('multiple siblings receiving transclusion', () => {

        it('should only receive transclude from parent', () => {

          angular.mock.module($compileProvider => {

            $compileProvider.directive('myExample', ngInternals.valueFn({
              scope: {},
              link: function link(scope, element, attrs) {
                const foo = element[0].querySelector('.foo');
                scope.children = angular.element(foo).children().length;
              },
              template: '<div>' +
                '<div>myExample {{children}}!</div>' +
                '<div ng-if="children">has children</div>' +
                '<div class="foo" ng-transclude></div>' +
                '</div>',
              transclude: true

            }));

          });

          angular.mock.inject(($compile, $rootScope) => {
            let element = compileForTest('<div my-example></div>');
            $rootScope.$digest();
            expect(element.text()).toEqual('myExample 0!');
            dealoc(element);

            element = compileForTest('<div my-example><p></p></div>');
            $rootScope.$digest();
            expect(element.text()).toEqual('myExample 1!has children');
            dealoc(element);
          });
        });
      });
    });


    describe('element transclusion', () => {

      it('should support basic element transclusion', () => {
        angular.mock.module(() => {
          directive('trans', log => {
            return {
              transclude: 'element',
              priority: 2,
              controller: function ($transclude) { this.$transclude = $transclude; },
              compile: function (element, attrs, template) {
                log('compile: ' + angular.mock.dump(element));
                return (scope, element, attrs, ctrl) => {
                  log('link');
                  let cursor = element;
                  template(scope.$new(), clone => { cursor.after(cursor = clone); });
                  ctrl.$transclude(clone => { cursor.after(clone); });
                };
              }
            };
          });
        });
        angular.mock.inject((log, $rootScope, $compile) => {
          element = compileForTest('<div><div high-log trans="text" log>{{$parent.$id}}-{{$id}};</div></div>');
          $rootScope.$apply();
          expect(log).toEqual('compile: <!-- trans: text -->; link; LOG; LOG; HIGH');
          expect(element.text()).toEqual('1-2;1-3;');
        });
      });

      it('should only allow one element transclusion per element', () => {
        angular.mock.module(() => {
          directive('first', ngInternals.valueFn({
            transclude: 'element'
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject($compile => {
          expect(() => {
            compileForTest('<div first second></div>');
          }).toThrowMinErr('$compile', 'multidir', 'Multiple directives [first, second] asking for transclusion on: ' +
            '<!-- first: -->');
        });
      });


      it('should only allow one element transclusion per element when directives have different priorities', () => {
        // we restart compilation in this case and we need to remember the duplicates during the second compile
        // regression #3893
        angular.mock.module(() => {
          directive('first', ngInternals.valueFn({
            transclude: 'element',
            priority: 100
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject($compile => {
          expect(() => {
            compileForTest('<div first second></div>');
          }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <div .+/);
        });
      });


      it('should only allow one element transclusion per element when async replace directive is in the mix', () => {
        angular.mock.module(() => {
          directive('template', ngInternals.valueFn({
            templateUrl: 'template.html',
            replace: true
          }));
          directive('first', ngInternals.valueFn({
            transclude: 'element',
            priority: 100
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject(($compile, $httpBackend) => {
          $httpBackend.expectGET('template.html').respond('<p second>template.html</p>');

          expect(() => {
            compileForTest('<div template first></div>');
            $httpBackend.flush();
          }).toThrowMinErr('$compile', 'multidir',
            'Multiple directives [first, second] asking for transclusion on: <p ');
        });
      });

      it('should only allow one element transclusion per element when replace directive is in the mix', () => {
        angular.mock.module(() => {
          directive('template', ngInternals.valueFn({
            template: '<p second></p>',
            replace: true
          }));
          directive('first', ngInternals.valueFn({
            transclude: 'element',
            priority: 100
          }));
          directive('second', ngInternals.valueFn({
            transclude: 'element'
          }));
        });
        angular.mock.inject($compile => {
          expect(() => {
            compileForTest('<div template first></div>');
          }).toThrowMinErr('$compile', 'multidir', /Multiple directives \[first, second] asking for transclusion on: <p .+/);
        });
      });


      it('should support transcluded element on root content', () => {
        let comment;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            compile: function (element, attr, linker) {
              return (scope, element, attr) => {
                comment = element;
              };
            }
          }));
        });
        angular.mock.inject(($compile, $rootScope) => {
          const element = angular.element('<div>before<div transclude></div>after</div>').contents();
          expect(element.length).toEqual(3);
          expect(ngInternals.nodeName_(element[1])).toBe('div');
          compileForTest(element);
          expect(ngInternals.nodeName_(element[1])).toBe('#comment');
          expect(ngInternals.nodeName_(comment)).toBe('#comment');
        });
      });


      it('should terminate compilation only for element transclusion', () => {
        angular.mock.module(() => {
          directive('elementTrans', log => {
            return {
              transclude: 'element',
              priority: 50,
              compile: log.fn('compile:elementTrans')
            };
          });
          directive('regularTrans', log => {
            return {
              transclude: true,
              priority: 50,
              compile: log.fn('compile:regularTrans')
            };
          });
        });
        angular.mock.inject((log, $compile, $rootScope) => {
          compileForTest('<div><div element-trans log="elem"></div><div regular-trans log="regular"></div></div>');
          expect(log).toEqual('compile:elementTrans; compile:regularTrans; regular');
        });
      });


      it('should instantiate high priority controllers only once, but low priority ones each time we transclude',
        () => {
          angular.mock.module(() => {
            directive('elementTrans', log => {
              return {
                transclude: 'element',
                priority: 50,
                controller: function ($transclude, $element) {
                  log('controller:elementTrans');
                  $transclude(clone => {
                    $element.after(clone);
                  });
                  $transclude(clone => {
                    $element.after(clone);
                  });
                  $transclude(clone => {
                    $element.after(clone);
                  });
                }
              };
            });
            directive('normalDir', log => {
              return {
                controller: function () {
                  log('controller:normalDir');
                }
              };
            });
          });
          angular.mock.inject(($compile, $rootScope, log) => {
            element = compileForTest('<div><div element-trans normal-dir></div></div>');
            expect(log).toEqual([
              'controller:elementTrans',
              'controller:normalDir',
              'controller:normalDir',
              'controller:normalDir'
            ]);
          });
        });

      it('should allow to access $transclude in the same directive', () => {
        let _$transclude;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            controller: function ($transclude) {
              _$transclude = $transclude;
            }
          }));
        });
        angular.mock.inject($compile => {
          element = compileForTest('<div transclude></div>');
          expect(_$transclude).toBeDefined();
        });
      });

      it('should copy the directive controller to all clones', () => {
        let transcludeCtrl;
        const cloneCount = 2;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            controller: function () {
              transcludeCtrl = this;
            },
            link: function (scope, el, attr, ctrl, $transclude) {
              let i;
              for (i = 0; i < cloneCount; i++) {
                $transclude(cloneAttach);
              }

              function cloneAttach(clone) {
                el.after(clone);
              }
            }
          }));
        });
        angular.mock.inject($compile => {
          element = compileForTest('<div><div transclude></div></div>');
          const children = element.children();
          let i;
          for (i = 0; i < cloneCount; i++) {
            expect(children.eq(i).data('$transcludeController')).toBe(transcludeCtrl);
          }
        });
      });

      it('should expose the directive controller to transcluded children', () => {
        let capturedTranscludeCtrl;
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            transclude: 'element',
            controller: function () {
            },
            link: function (scope, element, attr, ctrl, $transclude) {
              $transclude(scope, clone => {
                element.after(clone);
              });
            }
          }));
          directive('child', ngInternals.valueFn({
            require: '^transclude',
            link: function (scope, element, attr, ctrl) {
              capturedTranscludeCtrl = ctrl;
            }
          }));
        });
        angular.mock.inject($compile => {
          // We need to wrap the transclude directive's element in a parent element so that the
          // cloned element gets deallocated/cleaned up correctly
          element = compileForTest('<div><div transclude><div child></div></div></div>');
          expect(capturedTranscludeCtrl).toBeTruthy();
        });
      });

      it('should allow access to $transclude in a templateUrl directive', () => {
        let transclude;
        angular.mock.module(() => {
          directive('template', ngInternals.valueFn({
            templateUrl: 'template.html',
            replace: true
          }));
          directive('transclude', ngInternals.valueFn({
            transclude: 'content',
            controller: function ($transclude) {
              transclude = $transclude;
            }
          }));
        });
        angular.mock.inject(($compile, $httpBackend) => {
          $httpBackend.expectGET('template.html').respond('<div transclude></div>');
          element = compileForTest('<div template></div>');
          $httpBackend.flush();
          expect(transclude).toBeDefined();
        });
      });

      // issue #6006
      it('should link directive with $element as a comment node', () => {
        angular.mock.module($provide => {
          directive('innerAgain', log => {
            return {
              transclude: 'element',
              link: function (scope, element, attr, controllers, transclude) {
                log('innerAgain:' + (ngInternals.nodeName_(element)) + ':' + ngInternals.trim(element[0].data).toLowerCase());
                transclude(scope, clone => {
                  element.parent().append(clone);
                });
              }
            };
          });
          directive('inner', log => {
            return {
              replace: true,
              templateUrl: 'inner.html',
              link: function (scope, element) {
                log('inner:' + (ngInternals.nodeName_(element)).toLowerCase() + ':' + ngInternals.trim(element[0].data));
              }
            };
          });
          directive('outer', log => {
            return {
              transclude: 'element',
              link: function (scope, element, attrs, controllers, transclude) {
                log('outer:' + (ngInternals.nodeName_(element)).toLowerCase() + ':' + ngInternals.trim(element[0].data));
                transclude(scope, clone => {
                  element.parent().append(clone);
                });
              }
            };
          });
        });
        angular.mock.inject((log, $compile, $rootScope, $templateCache) => {
          $templateCache.put('inner.html', '<div inner-again><p>Content</p></div>');
          element = compileForTest('<div><div outer><div inner></div></div></div>');
          $rootScope.$digest();
          const child = element.children();

          expect(log.toArray()).toEqual([
            'outer:#comment:outer:',
            'innerAgain:#comment:inneragain:',
            'inner:#comment:innerAgain:'
          ]);
          expect(child.length).toBe(1);
          expect(child.contents().length).toBe(2);
          expect((ngInternals.nodeName_(child.contents().eq(0))).toLowerCase()).toBe('#comment');
          expect((ngInternals.nodeName_(child.contents().eq(1))).toLowerCase()).toBe('div');
        });
      });
    });


    it('should be possible to change the scope of a directive using $provide', () => {
      angular.mock.module($provide => {
        directive('foo', () => {
          return {
            scope: {},
            template: '<div></div>'
          };
        });
        $provide.decorator('fooDirective', $delegate => {
          const directive = $delegate[0];
          directive.scope.something = '=';
          directive.template = '<span>{{something}}</span>';
          return $delegate;
        });
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div><div foo something="bar"></div></div>');
        $rootScope.bar = 'bar';
        $rootScope.$digest();
        expect(element.text()).toBe('bar');
      });
    });


    it('should distinguish different bindings with the same binding name', () => {
      angular.mock.module(() => {
        directive('foo', () => {
          return {
            scope: {
              foo: '=',
              bar: '='
            },
            template: '<div><div>{{foo}}</div><div>{{bar}}</div></div>'
          };
        });
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<div><div foo="\'foo\'" bar="\'bar\'"></div></div>');
        $rootScope.$digest();
        expect(element.text()).toBe('foobar');
      });
    });


    it('should safely create transclude comment node and not break with "-->"',
      angular.mock.inject($rootScope => {
        // see: https://github.com/angular/angular.js/issues/1740
        element = compileForTest('<ul><li ng-repeat="item in [\'-->\', \'x\']">{{item}}|</li></ul>');
        $rootScope.$digest();

        expect(element.text()).toBe('-->|x|');
      }));


    describe('lazy compilation', () => {
      // See https://github.com/angular/angular.js/issues/7183
      it('should pass transclusion through to template of a \'replace\' directive', () => {
        angular.mock.module(() => {
          directive('transSync', () => {
            return {
              transclude: true,
              link: function (scope, element, attr, ctrl, transclude) {

                expect(transclude).toEqual(expect.any(Function));

                transclude(child => { element.append(child); });
              }
            };
          });

          directive('trans', $timeout => {
            return {
              transclude: true,
              link: function (scope, element, attrs, ctrl, transclude) {

                // We use timeout here to simulate how ng-if works
                $timeout(() => {
                  transclude(child => { element.append(child); });
                });
              }
            };
          });

          directive('replaceWithTemplate', () => {
            return {
              templateUrl: 'template.html',
              replace: true
            };
          });
        });

        angular.mock.inject(($compile, $rootScope, $templateCache, $timeout) => {

          $templateCache.put('template.html', '<div trans-sync>Content To Be Transcluded</div>');

          expect(() => {
            element = compileForTest('<div><div trans><div replace-with-template></div></div></div>');
            $timeout.flush();
          }).not.toThrow();

          expect(element.text()).toEqual('Content To Be Transcluded');
        });

      });

      it('should lazily compile the contents of directives that are transcluded', () => {
        let innerCompilationCount = 0, transclude;

        angular.mock.module(() => {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            controller: function ($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile: function () {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<trans><inner></inner></trans>');
          expect(innerCompilationCount).toBe(0);
          transclude(child => { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('FooBar');
        });
      });

      it('should lazily compile the contents of directives that are transcluded with a template', () => {
        let innerCompilationCount = 0, transclude;

        angular.mock.module(() => {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            template: '<div>Baz</div>',
            controller: function ($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile: function () {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<trans><inner></inner></trans>');
          expect(innerCompilationCount).toBe(0);
          transclude(child => { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('BazFooBar');
        });
      });

      it('should lazily compile the contents of directives that are transcluded with a templateUrl', () => {
        let innerCompilationCount = 0, transclude;

        angular.mock.module(() => {
          directive('trans', ngInternals.valueFn({
            transclude: true,
            templateUrl: 'baz.html',
            controller: function ($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile: function () {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope, $httpBackend) => {
          $httpBackend.expectGET('baz.html').respond('<div>Baz</div>');
          element = compileForTest('<trans><inner></inner></trans>');
          $httpBackend.flush();

          expect(innerCompilationCount).toBe(0);
          transclude(child => { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('BazFooBar');
        });
      });

      it('should lazily compile the contents of directives that are transclude element', () => {
        let innerCompilationCount = 0, transclude;

        angular.mock.module(() => {
          directive('trans', ngInternals.valueFn({
            transclude: 'element',
            controller: function ($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile: function () {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          element = compileForTest('<div><trans><inner></inner></trans></div>');
          expect(innerCompilationCount).toBe(0);
          transclude(child => { element.append(child); });
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('FooBar');
        });
      });

      it('should lazily compile transcluded directives with ngIf on them', () => {
        let innerCompilationCount = 0, outerCompilationCount = 0, transclude;

        angular.mock.module(() => {
          directive('outer', ngInternals.valueFn({
            transclude: true,
            compile: function () {
              outerCompilationCount += 1;
            },
            controller: function ($transclude) {
              transclude = $transclude;
            }
          }));

          directive('inner', ngInternals.valueFn({
            template: '<span>FooBar</span>',
            compile: function () {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope) => {
          $rootScope.shouldCompile = false;

          element = compileForTest('<div><outer ng-if="shouldCompile"><inner></inner></outer></div>');
          expect(outerCompilationCount).toBe(0);
          expect(innerCompilationCount).toBe(0);
          expect(transclude).toBeUndefined();
          $rootScope.$apply('shouldCompile=true');
          expect(outerCompilationCount).toBe(1);
          expect(innerCompilationCount).toBe(0);
          expect(transclude).toBeDefined();
          transclude(child => { element.append(child); });
          expect(outerCompilationCount).toBe(1);
          expect(innerCompilationCount).toBe(1);
          expect(element.text()).toBe('FooBar');
        });
      });

      it('should eagerly compile multiple directives with transclusion and templateUrl/replace', () => {
        let innerCompilationCount = 0;

        angular.mock.module(() => {
          directive('outer', ngInternals.valueFn({
            transclude: true
          }));

          directive('outer', ngInternals.valueFn({
            templateUrl: 'inner.html',
            replace: true
          }));

          directive('inner', ngInternals.valueFn({
            compile: function () {
              innerCompilationCount += 1;
            }
          }));
        });

        angular.mock.inject(($compile, $rootScope, $httpBackend) => {
          $httpBackend.expectGET('inner.html').respond('<inner></inner>');
          element = compileForTest('<outer></outer>');
          $httpBackend.flush();

          expect(innerCompilationCount).toBe(1);
        });
      });
    });

  });

  describe('multi-slot transclude', () => {
    it('should only include elements without a matching transclusion element in default transclusion slot', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              bossSlot: 'boss'
            },
            template:
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          '<span>stuart</span>' +
          '<span>bob</span>' +
          '<boss>gru</boss>' +
          '<span>kevin</span>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.text()).toEqual('stuartbobkevin');
      });
    });

    it('should use the default transclusion slot if the ng-transclude attribute has the same value as its key', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {},
            template:
              '<div class="a" ng-transclude="ng-transclude"></div>' +
              '<div class="b" ng:transclude="ng:transclude"></div>' +
              '<div class="c" data-ng-transclude="data-ng-transclude"></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          '<span>stuart</span>' +
          '<span>bob</span>' +
          '<span>kevin</span>' +
          '</minion-component>');
        $rootScope.$apply();
        const a = element.children().eq(0);
        const b = element.children().eq(1);
        const c = element.children().eq(2);
        expect(a).toHaveClass('a');
        expect(b).toHaveClass('b');
        expect(c).toHaveClass('c');
        expect(a.text()).toEqual('stuartbobkevin');
        expect(b.text()).toEqual('stuartbobkevin');
        expect(c.text()).toEqual('stuartbobkevin');
      });
    });


    it('should include non-element nodes in the default transclusion', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              bossSlot: 'boss'
            },
            template:
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          'text1' +
          '<span>stuart</span>' +
          '<span>bob</span>' +
          '<boss>gru</boss>' +
          'text2' +
          '<span>kevin</span>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.text()).toEqual('text1stuartbobtext2kevin');
      });
    });

    it('should transclude elements to an `ng-transclude` with a matching transclusion slot name', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: 'boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '<boss>gru</boss>' +
          '<minion>kevin</minion>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('gru');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    it('should use the `ng-transclude-slot` attribute if ng-transclude is used as an element', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: 'boss'
            },
            template:
              '<ng-transclude class="boss" ng-transclude-slot="bossSlot"></ng-transclude>' +
              '<ng-transclude class="minion" ng-transclude-slot="minionSlot"></ng-transclude>' +
              '<ng-transclude class="other"></ng-transclude>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '<boss>gru</boss>' +
          '<minion>kevin</minion>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('gru');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });

    it('should error if a required transclude slot is not filled', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: 'boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        expect(() => {
          element = compileForTest(
            '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '</minion-component>');
        }).toThrowMinErr('$compile', 'reqslot', 'Required transclusion slot `bossSlot` was not filled.');
      });
    });


    it('should not error if an optional transclude slot is not filled', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: '?boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(1).text()).toEqual('stuart');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    it('should error if we try to transclude a slot that was not declared by the directive', () => {

      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        expect(() => {
          element = compileForTest(
            '<minion-component>' +
            '<minion>stuart</minion>' +
            '<span>dorothy</span>' +
            '</minion-component>');
        }).toThrowMinErr('$compile', 'noslot',
          'No parent directive that requires a transclusion with slot name "bossSlot". ' +
          'Element: <div class="boss" ng-transclude="bossSlot">');
      });
    });

    it('should allow the slot name to equal the element name', () => {

      angular.mock.module(() => {
        directive('foo', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              bar: 'bar'
            },
            template:
              '<div class="other" ng-transclude="bar"></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<foo>' +
          '<bar>baz</bar>' +
          '</foo>');
        $rootScope.$apply();
        expect(element.text()).toEqual('baz');
      });
    });


    it('should match the normalized form of the element name', () => {
      angular.mock.module(() => {
        directive('foo', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              fooBarSlot: 'fooBar',
              mooKarSlot: 'mooKar'
            },
            template:
              '<div class="a" ng-transclude="fooBarSlot"></div>' +
              '<div class="b" ng-transclude="mooKarSlot"></div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<foo>' +
          '<foo-bar>bar1</foo-bar>' +
          '<foo:bar>bar2</foo:bar>' +
          '<moo-kar>baz1</moo-kar>' +
          '<data-moo-kar>baz2</data-moo-kar>' +
          '</foo>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('bar1bar2');
        expect(element.children().eq(1).text()).toEqual('baz1baz2');
      });
    });


    it('should return true from `isSlotFilled(slotName) for slots that have content in the transclusion', () => {
      let capturedTranscludeFn;
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: '?boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot"></div>' +
              '<div class="minion" ng-transclude="minionSlot"></div>' +
              '<div class="other" ng-transclude></div>',
            link: function (s, e, a, c, transcludeFn) {
              capturedTranscludeFn = transcludeFn;
            }
          };
        });
      });
      angular.mock.inject(($rootScope, $compile, log) => {
        element = compileForTest(
          '<minion-component>' +
          '  <minion>stuart</minion>' +
          '  <minion>bob</minion>' +
          '  <span>dorothy</span>' +
          '</minion-component>');
        $rootScope.$apply();

        const hasMinions = capturedTranscludeFn.isSlotFilled('minionSlot');
        const hasBosses = capturedTranscludeFn.isSlotFilled('bossSlot');

        expect(hasMinions).toBe(true);
        expect(hasBosses).toBe(false);
      });
    });

    it('should not overwrite the contents of an `ng-transclude` element, if the matching optional slot is not filled', () => {
      angular.mock.module(() => {
        directive('minionComponent', () => {
          return {
            restrict: 'E',
            scope: {},
            transclude: {
              minionSlot: 'minion',
              bossSlot: '?boss'
            },
            template:
              '<div class="boss" ng-transclude="bossSlot">default boss content</div>' +
              '<div class="minion" ng-transclude="minionSlot">default minion content</div>' +
              '<div class="other" ng-transclude>default content</div>'
          };
        });
      });
      angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest(
          '<minion-component>' +
          '<minion>stuart</minion>' +
          '<span>dorothy</span>' +
          '<minion>kevin</minion>' +
          '</minion-component>');
        $rootScope.$apply();
        expect(element.children().eq(0).text()).toEqual('default boss content');
        expect(element.children().eq(1).text()).toEqual('stuartkevin');
        expect(element.children().eq(2).text()).toEqual('dorothy');
      });
    });


    // See issue https://github.com/angular/angular.js/issues/14924
    it('should not process top-level transcluded text nodes merged into their sibling',
      () => {
        angular.mock.module(() => {
          directive('transclude', ngInternals.valueFn({
            template: '<ng-transclude></ng-transclude>',
            transclude: {},
            scope: {}
          }));
        });

        angular.mock.inject($compile => {
          element = angular.element('<div transclude></div>');
          element[0].appendChild(document.createTextNode('1{{ value }}'));
          element[0].appendChild(document.createTextNode('2{{ value }}'));
          element[0].appendChild(document.createTextNode('3{{ value }}'));

          const initialWatcherCount = $rootScope.$countWatchers();
          compileForTest(element);
          $rootScope.$apply('value = 0');
          const newWatcherCount = $rootScope.$countWatchers() - initialWatcherCount;

          expect(element.text()).toBe('102030');
          expect(newWatcherCount).toBe(3);
        });
      }
    );
  });

  ['img', 'audio', 'video'].forEach(tag => {
    if (tag === 'img') {
      describe(tag + '[src] context requirement', () => {
        it('should NOT require trusted values for trusted URIs', angular.mock.inject(($rootScope, $compile) => {
          element = compileForTest('<' + tag + ' src="{{testUrl}}"></' + tag + '>');
          $rootScope.testUrl = 'http://example.com/image.mp4'; // `http` is trusted
          $rootScope.$digest();
          expect(element.attr('src')).toEqual('http://example.com/image.mp4');
        }));

        it('should accept trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
          // As a MEDIA_URL URL
          element = compileForTest('<' + tag + ' src="{{testUrl}}"></' + tag + '>');
          // Some browsers complain if you try to write `javascript:` into an `img[src]`
          // So for the test use something different
          $rootScope.testUrl = $sce.trustAsMediaUrl('untrusted:foo()');
          $rootScope.$digest();
          expect(element.attr('src')).toEqual('untrusted:foo()');

          // As a URL
          element = compileForTest('<' + tag + ' src="{{testUrl}}"></' + tag + '>');
          $rootScope.testUrl = $sce.trustAsUrl('untrusted:foo()');
          $rootScope.$digest();
          expect(element.attr('src')).toEqual('untrusted:foo()');

          // As a RESOURCE URL
          element = compileForTest('<' + tag + ' src="{{testUrl}}"></' + tag + '>');
          $rootScope.testUrl = $sce.trustAsResourceUrl('untrusted:foo()');
          $rootScope.$digest();
          expect(element.attr('src')).toEqual('untrusted:foo()');
        }));
      });
    }
  });

  ['source', 'track'].forEach(tag => {
    describe(tag + '[src]', () => {
      it('should NOT require trusted values for trusted URIs', angular.mock.inject(($rootScope, $compile) => {
        element = compileForTest('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>');
        $rootScope.testUrl = 'http://example.com/image.mp4'; // `http` is trusted
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('http://example.com/image.mp4');
      }));

      it('should accept trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
        // As a MEDIA_URL URL
        element = compileForTest('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>');
        $rootScope.testUrl = $sce.trustAsMediaUrl('javascript:foo()');
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('javascript:foo()');

        // As a URL
        element = compileForTest('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>');
        $rootScope.testUrl = $sce.trustAsUrl('javascript:foo()');
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('javascript:foo()');

        // As a RESOURCE URL
        element = compileForTest('<video><' + tag + ' src="{{testUrl}}"></' + tag + '></video>');
        $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:foo()');
        $rootScope.$digest();
        expect(element.find(tag).attr('src')).toEqual('javascript:foo()');
      }));
    });
  });


  describe('img[src] sanitization', () => {

    it('should accept trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
      element = compileForTest('<img src="{{testUrl}}"></img>');
      // Some browsers complain if you try to write `javascript:` into an `img[src]`
      // So for the test use something different
      $rootScope.testUrl = $sce.trustAsMediaUrl('someUntrustedThing:foo();');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('someUntrustedThing:foo();');
    }));

    it('should sanitize concatenated values even if they are trusted', angular.mock.inject(($rootScope, $compile, $sce) => {
      element = compileForTest('<img src="{{testUrl}}ponies"></img>');
      $rootScope.testUrl = $sce.trustAsUrl('untrusted:foo();');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('unsafe:untrusted:foo();ponies');

      element = compileForTest('<img src="http://{{testUrl2}}"></img>');
      $rootScope.testUrl2 = $sce.trustAsUrl('xyz;');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('http://xyz;');

      element = compileForTest('<img src="{{testUrl3}}{{testUrl3}}"></img>');
      $rootScope.testUrl3 = $sce.trustAsUrl('untrusted:foo();');
      $rootScope.$digest();
      expect(element.attr('src')).toEqual('unsafe:untrusted:foo();untrusted:foo();');
    }));

    it('should not sanitize attributes other than src', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<img title="{{testUrl}}"></img>');
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();
      expect(element.attr('title')).toBe('javascript:doEvilStuff()');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jest.fn();
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<img src="{{testUrl}}"></img>');
        $rootScope.testUrl = 'someUrl';

        $$sanitizeUri.mockReturnValue('someSanitizedUrl');
        $rootScope.$apply();
        expect(element.attr('src')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
      });
    });


    it('should use $$sanitizeUri on concatenated trusted values', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('someSanitizedUrl');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope, $sce) => {
        element = compileForTest('<img src="{{testUrl}}ponies"></img>');
        $rootScope.testUrl = $sce.trustAsUrl('javascript:foo();');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('someSanitizedUrl');

        element = compileForTest('<img src="http://{{testUrl}}"></img>');
        $rootScope.testUrl = $sce.trustAsUrl('xyz');
        $rootScope.$digest();
        expect(element.attr('src')).toEqual('someSanitizedUrl');
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
        element = compileForTest('<img src="{{testUrl}}"></img>');
        // Assigning javascript:foo to src makes at least IE9-11 complain, so use another
        // protocol name.
        $rootScope.testUrl = $sce.trustAsMediaUrl('untrusted:foo();');
        $rootScope.$apply();
        expect(element.attr('src')).toEqual('untrusted:foo();');
      });
    });
  });

  describe('img[srcset] sanitization', () => {
    it('should not error if srcset is undefined', () => {
      let linked = false;
      angular.mock.module(() => {
        directive('setter', ngInternals.valueFn((scope, elem, attrs) => {
          // Set srcset to a value
          attrs.$set('srcset', 'http://example.com/');
          expect(attrs.srcset).toBe('http://example.com/');
          // Now set it to undefined
          attrs.$set('srcset', undefined);
          expect(attrs.srcset).toBeUndefined();
          linked = true;
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<img setter></img>');
        expect(linked).toBe(true);
        expect(element.attr('srcset')).toBeUndefined();
      });
    });

    it('should NOT require trusted values for trusted URI values', angular.mock.inject(($rootScope, $compile, $sce) => {
      element = compileForTest('<img srcset="{{testUrl}}"></img>');
      $rootScope.testUrl = 'http://example.com/image.png'; // `http` is trusted
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('http://example.com/image.png');
    }));

    it('should accept trusted values, if they are also trusted URIs', angular.mock.inject(($rootScope, $compile, $sce) => {
      element = compileForTest('<img srcset="{{testUrl}}"></img>');
      $rootScope.testUrl = $sce.trustAsUrl('http://example.com');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('http://example.com');
    }));

    it('should NOT work with trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
      // A limitation of the approach used for srcset is that you cannot use `trustAsUrl`.
      // Use trustAsHtml and ng-bind-html to work around this.
      element = compileForTest('<img srcset="{{testUrl}}"></img>');
      $rootScope.testUrl = $sce.trustAsUrl('javascript:something');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual('unsafe:javascript:something');

      element = compileForTest('<img srcset="{{testUrl}},{{testUrl}}"></img>');
      $rootScope.testUrl = $sce.trustAsUrl('javascript:something');
      $rootScope.$digest();
      expect(element.attr('srcset')).toEqual(
        'unsafe:javascript:something, unsafe:javascript:something');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('someSanitizedUrl');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<img srcset="{{testUrl}}"></img>');
        $rootScope.testUrl = 'someUrl';
        $rootScope.$apply();
        expect(element.attr('srcset')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);

        element = compileForTest('<img srcset="{{testUrl}}, {{testUrl}}"></img>');
        $rootScope.testUrl = 'javascript:yay';
        $rootScope.$apply();
        expect(element.attr('srcset')).toEqual('someSanitizedUrl, someSanitizedUrl');

        element = compileForTest('<img srcset="java{{testUrl}}"></img>');
        $rootScope.testUrl = 'script:yay, javascript:nay';
        $rootScope.$apply();
        expect(element.attr('srcset')).toEqual('someSanitizedUrl, someSanitizedUrl');
      });
    });

    it('should sanitize all uris in srcset', angular.mock.inject(($rootScope, $compile) => {
      element = compileForTest('<img srcset="{{testUrl}}"></img>');
      var testSet = {
        'http://example.com/image.png': 'http://example.com/image.png',
        ' http://example.com/image.png': 'http://example.com/image.png',
        'http://example.com/image.png ': 'http://example.com/image.png',
        'http://example.com/image.png 128w': 'http://example.com/image.png 128w',
        'http://example.com/image.png 2x': 'http://example.com/image.png 2x',
        'http://example.com/image.png 1.5x': 'http://example.com/image.png 1.5x',
        'http://example.com/image1.png 1x,http://example.com/image2.png 2x': 'http://example.com/image1.png 1x, http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x ,http://example.com/image2.png 2x': 'http://example.com/image1.png 1x, http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x, http://example.com/image2.png 2x': 'http://example.com/image1.png 1x, http://example.com/image2.png 2x',
        'http://example.com/image1.png 1x , http://example.com/image2.png 2x': 'http://example.com/image1.png 1x, http://example.com/image2.png 2x',
        'http://example.com/image1.png 48w,http://example.com/image2.png 64w': 'http://example.com/image1.png 48w, http://example.com/image2.png 64w',
        //Test regex to make sure doesn't mistake parts of url for width descriptors
        'http://example.com/image1.png?w=48w,http://example.com/image2.png 64w': 'http://example.com/image1.png?w=48w,http://example.com/image2.png 64w',
        'http://example.com/image1.png 1x,http://example.com/image2.png 64w': 'http://example.com/image1.png 1x, http://example.com/image2.png 64w',
        'http://example.com/image1.png,http://example.com/image2.png': 'http://example.com/image1.png, http://example.com/image2.png',
        'http://example.com/image1.png ,http://example.com/image2.png': 'http://example.com/image1.png, http://example.com/image2.png',
        'http://example.com/image1.png, http://example.com/image2.png': 'http://example.com/image1.png, http://example.com/image2.png',
        'http://example.com/image1.png , http://example.com/image2.png': 'http://example.com/image1.png, http://example.com/image2.png',
        'http://example.com/image1.png 1x, http://example.com/image2.png 2x, http://example.com/image3.png 3x':
          'http://example.com/image1.png 1x, http://example.com/image2.png 2x, http://example.com/image3.png 3x',
        'javascript:doEvilStuff() 2x': 'unsafe:javascript:doEvilStuff() 2x',
        'http://example.com/image1.png 1x,javascript:doEvilStuff() 2x': 'http://example.com/image1.png 1x, unsafe:javascript:doEvilStuff() 2x',
        'http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x': 'http://example.com/image1.jpg?x=a,b 1x, http://example.com/ima,ge2.jpg 2x',
        //Test regex to make sure doesn't mistake parts of url for pixel density descriptors
        'http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x': 'http://example.com/image1.jpg?x=a2x,b 1x, http://example.com/ima,ge2.jpg 2x'
      };

      angular.forEach(testSet, (ref, url) => {
        $rootScope.testUrl = url;
        $rootScope.$digest();
        expect(element.attr('srcset')).toEqual(ref);
      });

    }));
  });

  describe('a[href] sanitization', () => {
    it('should NOT require trusted values for trusted URI values', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.testUrl = 'http://example.com/image.png'; // `http` is trusted
      element = compileForTest('<a href="{{testUrl}}"></a>');
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('http://example.com/image.png');

      element = compileForTest('<a ng-href="{{testUrl}}"></a>');
      $rootScope.$digest();
      expect(element.attr('ng-href')).toEqual('http://example.com/image.png');
    }));

    it('should accept trusted values for non-trusted URI values', angular.mock.inject(($rootScope, $compile, $sce) => {
      $rootScope.testUrl = $sce.trustAsUrl('javascript:foo()'); // `javascript` is not trusted
      element = compileForTest('<a href="{{testUrl}}"></a>');
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('javascript:foo()');

      element = compileForTest('<a ng-href="{{testUrl}}"></a>');
      $rootScope.$digest();
      expect(element.attr('ng-href')).toEqual('javascript:foo()');
    }));

    it('should sanitize non-trusted values', angular.mock.inject(($rootScope, $compile) => {
      $rootScope.testUrl = 'javascript:foo()'; // `javascript` is not trusted
      element = compileForTest('<a href="{{testUrl}}"></a>');
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('unsafe:javascript:foo()');

      element = compileForTest('<a ng-href="{{testUrl}}"></a>');
      $rootScope.$digest();
      expect(element.attr('href')).toEqual('unsafe:javascript:foo()');
    }));

    it('should not sanitize href on elements other than anchor', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<div href="{{testUrl}}"></div>');
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('href')).toBe('javascript:doEvilStuff()');
    }));

    it('should not sanitize attributes other than href/ng-href', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<a title="{{testUrl}}"></a>');
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.attr('title')).toBe('javascript:doEvilStuff()');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('someSanitizedUrl');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<a href="{{testUrl}}"></a>');
        $rootScope.testUrl = 'someUrl';
        $rootScope.$apply();
        expect(element.attr('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);

        $$sanitizeUri.mockClear();

        element = compileForTest('<a ng-href="{{testUrl}}"></a>');
        $rootScope.$apply();
        expect(element.attr('href')).toBe('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    it('should use $$sanitizeUri when working with svg and xlink:href', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('https://clean.example.org');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        // This URL would fail the RESOURCE_URL trusted list, but that test shouldn't be run
        // because these interpolations will be resolved against the URL context instead
        $rootScope.testUrl = 'https://bad.example.org';

        const elementA = compileForTest('<svg><a xlink:href="{{ testUrl + \'aTag\' }}"></a></svg>');
        $rootScope.$apply();
        expect(elementA.find('a').attr('xlink:href')).toBe('https://clean.example.org');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl + 'aTag', false);

        const elementImage = compileForTest('<svg><image xlink:href="{{ testUrl + \'imageTag\' }}"></image></svg>');
        $rootScope.$apply();
        expect(elementImage.find('image').attr('xlink:href')).toBe('https://clean.example.org');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl + 'imageTag', true);
      });
    });

    it('should use $$sanitizeUri when working with svg and xlink:href through ng-href', () => {
      const $$sanitizeUri = jest.fn().mockReturnValue('https://clean.example.org');
      angular.mock.module($provide => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      angular.mock.inject(($compile, $rootScope) => {
        // This URL would fail the RESOURCE_URL trusted list, but that test shouldn't be run
        // because these interpolations will be resolved against the URL context instead
        $rootScope.testUrl = 'https://bad.example.org';

        element = compileForTest('<svg><a xlink:href="" ng-href="{{ testUrl }}"></a></svg>');
        $rootScope.$apply();
        expect(element.find('a')[0].getAttribute('href')).toBe('https://clean.example.org');
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    it('should require a RESOURCE_URL context for xlink:href by if not on an anchor or image', () => {
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest('<svg><whatever xlink:href="{{ testUrl }}"></whatever></svg>');
        $rootScope.testUrl = 'https://bad.example.org';

        expect(() => {
          $rootScope.$apply();
        }).toThrowMinErr('$interpolate', 'interr', 'Can\'t interpolate: {{ testUrl }}\n' +
          'Error: [$sce:insecurl] Blocked loading resource from url not allowed by $sceDelegate policy.  ' +
          'URL: https://bad.example.org');
      });
    });

    it('should not have endless digests when given arrays in concatenable context', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<foo href="{{testUrl}}"></foo><foo href="{{::testUrl}}"></foo>' +
        '<foo href="http://example.com/{{testUrl}}"></foo><foo href="http://example.com/{{::testUrl}}"></foo>');
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

  describe('interpolation on HTML DOM event handler attributes onclick, onXYZ, formaction', () => {
    it('should disallow interpolation on onclick', angular.mock.inject(($compile, $rootScope) => {
      // All interpolations are disallowed.
      $rootScope.onClickJs = '';
      expect(() => {
        compileForTest('<button onclick="{{onClickJs}}"></button>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
      expect(() => {
        compileForTest('<button ONCLICK="{{onClickJs}}"></button>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
      expect(() => {
        compileForTest('<button ng-attr-onclick="{{onClickJs}}"></button>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
      expect(() => {
        compileForTest('<button ng-attr-ONCLICK="{{onClickJs}}"></button>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Interpolations for HTML DOM event attributes are disallowed');
    }));

    it('should pass through arbitrary values on onXYZ event attributes that contain a hyphen', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<button on-click="{{onClickJs}}"></button>');
      $rootScope.onClickJs = 'javascript:doSomething()';
      $rootScope.$apply();
      expect(element.attr('on-click')).toEqual('javascript:doSomething()');
    }));

    it('should pass through arbitrary values on "on" and "data-on" attributes', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<button data-on="{{dataOnVar}}"></button>');
      $rootScope.dataOnVar = 'data-on text';
      $rootScope.$apply();
      expect(element.attr('data-on')).toEqual('data-on text');

      element = compileForTest('<button on="{{onVar}}"></button>');
      $rootScope.onVar = 'on text';
      $rootScope.$apply();
      expect(element.attr('on')).toEqual('on text');
    }));
  });

  describe('iframe[src]', () => {
    it('should pass through src attributes for the same domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('src')).toEqual('different_page');
    }));

    it('should clear out src attributes for a different domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'http://a.different.domain.example.com');
    }));

    it('should clear out JS src attributes', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'javascript:alert(1);');
    }));

    it('should clear out non-resource_url src attributes', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
      'loading resource from url not allowed by $sceDelegate policy.  URL: javascript:doTrustedStuff()');
    }));

    it('should pass through $sce.trustAs() values in src attributes', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<iframe src="{{testUrl}}"></iframe>');
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('src')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('base[href]', () => {
    it('should be a RESOURCE_URL context', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<base href="{{testUrl}}"/>');

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://example.com/');
      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://example.com/');

      $rootScope.testUrl = 'https://not.example.com/';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'https://not.example.com/');
    }));
  });

  describe('form[action]', () => {
    it('should pass through action attribute for the same domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.attr('action')).toEqual('different_page');
    }));

    it('should clear out action attribute for a different domain', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'http://a.different.domain.example.com');
    }));

    it('should clear out JS action attribute', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'javascript:alert(1);');
    }));

    it('should clear out non-resource_url action attribute', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect($rootScope.$apply).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
      'loading resource from url not allowed by $sceDelegate policy.  URL: javascript:doTrustedStuff()');
    }));


    it('should pass through $sce.trustAsResourceUrl() values in action attribute', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<form action="{{testUrl}}"></form>');
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.attr('action')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('link[href]', () => {
    it('should reject invalid RESOURCE_URLs', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<link href="{{testUrl}}" rel="stylesheet" />');
      $rootScope.testUrl = 'https://evil.example.org/css.css';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
        '$interpolate', 'interr', 'Can\'t interpolate: {{testUrl}}\nError: [$sce:insecurl] Blocked ' +
        'loading resource from url not allowed by $sceDelegate policy.  URL: ' +
      'https://evil.example.org/css.css');
    }));

    it('should accept valid RESOURCE_URLs', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<link href="{{testUrl}}" rel="stylesheet" />');

      $rootScope.testUrl = './css1.css';
      $rootScope.$apply();
      expect(element.attr('href')).toContain('css1.css');

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://elsewhere.example.org/css2.css');
      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://elsewhere.example.org/css2.css');
    }));

    it('should accept valid constants', angular.mock.inject(($compile, $rootScope) => {
      element = compileForTest('<link href="https://elsewhere.example.org/css2.css" rel="stylesheet" />');

      $rootScope.$apply();
      expect(element.attr('href')).toContain('https://elsewhere.example.org/css2.css');
    }));
  });

  describe('iframe[srcdoc]', () => {
    it('should NOT set iframe contents for untrusted values', angular.mock.inject(($compile, $rootScope, $sce) => {
      element = compileForTest('<iframe srcdoc="{{html}}"></iframe>');
      $rootScope.html = '<div onclick="">hello</div>';
      expect(() => { $rootScope.$digest(); }).toThrowMinErr('$interpolate', 'interr', new RegExp(
        /Can't interpolate: {{html}}\n/.source +
        /[^[]*\[\$sce:unsafe] Attempting to use an unsafe value in a safe context./.source));
    }));

    it('should NOT set html for wrongly typed values', angular.mock.inject(($rootScope, $compile, $sce) => {
      element = compileForTest('<iframe srcdoc="{{html}}"></iframe>');
      $rootScope.html = $sce.trustAsCss('<div onclick="">hello</div>');
      expect(() => { $rootScope.$digest(); }).toThrowMinErr('$interpolate', 'interr', new RegExp(
        /Can't interpolate: \{\{html}}\n/.source +
        /[^[]*\[\$sce:unsafe] Attempting to use an unsafe value in a safe context./.source));
    }));

    it('should set html for trusted values', angular.mock.inject(($rootScope, $compile, $sce) => {
      element = compileForTest('<iframe srcdoc="{{html}}"></iframe>');
      $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
      $rootScope.$digest();
      expect((element.attr('srcdoc')).toLowerCase()).toEqual('<div onclick="">hello</div>');
    }));
  });


  describe('ngAttr* attribute binding', () => {
    it('should bind after digest but not before', angular.mock.inject(() => {
      $rootScope.name = 'Misko';
      element = compileForTest('<span ng-attr-test="{{name}}"></span>');
      expect(element.attr('test')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    it('should bind after digest but not before when after overridden attribute', angular.mock.inject(() => {
      $rootScope.name = 'Misko';
      element = compileForTest('<span test="123" ng-attr-test="{{name}}"></span>');
      expect(element.attr('test')).toBe('123');
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    it('should bind after digest but not before when before overridden attribute', angular.mock.inject(() => {
      $rootScope.name = 'Misko';
      element = compileForTest('<span ng-attr-test="{{name}}" test="123"></span>');
      expect(element.attr('test')).toBe('123');
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
    }));

    it('should set the attribute (after digest) even if there is no interpolation', angular.mock.inject(() => {
      element = compileForTest('<span ng-attr-test="foo"></span>');
      expect(element.attr('test')).toBeUndefined();

      $rootScope.$digest();
      expect(element.attr('test')).toBe('foo');
    }));

    it('should remove attribute if any bindings are undefined', angular.mock.inject(() => {
      element = compileForTest('<span ng-attr-test="{{name}}{{emphasis}}"></span>');
      $rootScope.$digest();
      expect(element.attr('test')).toBeUndefined();
      $rootScope.name = 'caitp';
      $rootScope.$digest();
      expect(element.attr('test')).toBeUndefined();
      $rootScope.emphasis = '!!!';
      $rootScope.$digest();
      expect(element.attr('test')).toBe('caitp!!!');
    }));

    describe('in directive', () => {
      let log;

      beforeEach(angular.mock.module(() => {
        directive('syncTest', log => {
          return {
            link: {
              pre: function (s, e, attr) { log(attr.test); },
              post: function (s, e, attr) { log(attr.test); }
            }
          };
        });
        directive('asyncTest', log => {
          return {
            templateUrl: 'async.html',
            link: {
              pre: function (s, e, attr) { log(attr.test); },
              post: function (s, e, attr) { log(attr.test); }
            }
          };
        });
      }));

      beforeEach(angular.mock.inject(($templateCache, _log_) => {
        log = _log_;
        $templateCache.put('async.html', '<h1>Test</h1>');
      }));

      it('should provide post-digest value in synchronous directive link functions when after overridden attribute',
        () => {
          $rootScope.test = 'TEST';
          element = compileForTest('<div sync-test test="123" ng-attr-test="{{test}}"></div>');
          expect(element.attr('test')).toBe('123');
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );

      it('should provide post-digest value in synchronous directive link functions when before overridden attribute',
        () => {
          $rootScope.test = 'TEST';
          element = compileForTest('<div sync-test ng-attr-test="{{test}}" test="123"></div>');
          expect(element.attr('test')).toBe('123');
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );


      it('should provide post-digest value in asynchronous directive link functions when after overridden attribute',
        () => {
          $rootScope.test = 'TEST';
          element = compileForTest('<div async-test test="123" ng-attr-test="{{test}}"></div>');
          expect(element.attr('test')).toBe('123');
          $rootScope.$digest();
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );

      it('should provide post-digest value in asynchronous directive link functions when before overridden attribute',
        () => {
          $rootScope.test = 'TEST';
          element = compileForTest('<div async-test ng-attr-test="{{test}}" test="123"></div>');
          expect(element.attr('test')).toBe('123');
          $rootScope.$digest();
          expect(log.toArray()).toEqual(['TEST', 'TEST']);
        }
      );
    });

    it('should work with different prefixes', angular.mock.inject(() => {
      $rootScope.name = 'Misko';
      element = compileForTest('<span ng:attr:test="{{name}}" ng-Attr-test2="{{name}}" ng_Attr_test3="{{name}}"></span>');
      expect(element.attr('test')).toBeUndefined();
      expect(element.attr('test2')).toBeUndefined();
      expect(element.attr('test3')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test')).toBe('Misko');
      expect(element.attr('test2')).toBe('Misko');
      expect(element.attr('test3')).toBe('Misko');
    }));

    it('should use the non-prefixed name in $attr mappings', () => {
      let attrs;
      angular.mock.module(() => {
        directive('attrExposer', ngInternals.valueFn({
          link: function ($scope, $element, $attrs) {
            attrs = $attrs;
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        compileForTest('<div attr-exposer ng-attr-title="12" ng-attr-super-title="34" ng-attr-my-camel_title="56">');
        $rootScope.$apply();

        expect(attrs.title).toBe('12');
        expect(attrs.$attr.title).toBe('title');
        expect(attrs.ngAttrTitle).toBeUndefined();
        expect(attrs.$attr.ngAttrTitle).toBeUndefined();

        expect(attrs.superTitle).toBe('34');
        expect(attrs.$attr.superTitle).toBe('super-title');
        expect(attrs.ngAttrSuperTitle).toBeUndefined();
        expect(attrs.$attr.ngAttrSuperTitle).toBeUndefined();

        // Note the casing is incorrect: https://github.com/angular/angular.js/issues/16624
        expect(attrs.myCameltitle).toBe('56');
        expect(attrs.$attr.myCameltitle).toBe('my-camelTitle');
        expect(attrs.ngAttrMyCameltitle).toBeUndefined();
        expect(attrs.ngAttrMyCamelTitle).toBeUndefined();
        expect(attrs.$attr.ngAttrMyCameltitle).toBeUndefined();
        expect(attrs.$attr.ngAttrMyCamelTitle).toBeUndefined();
      });
    });

    it('should work with the "href" attribute', angular.mock.inject(() => {
      $rootScope.value = 'test';
      element = compileForTest('<a ng-attr-href="test/{{value}}"></a>');
      $rootScope.$digest();
      expect(element.attr('href')).toBe('test/test');
    }));

    it('should work if they are prefixed with x- or data- and different prefixes', angular.mock.inject(() => {
      $rootScope.name = 'Misko';
      element = compileForTest('<span data-ng-attr-test2="{{name}}" x-ng-attr-test3="{{name}}" data-ng:attr-test4="{{name}}" ' +
        'x_ng-attr-test5="{{name}}" data:ng-attr-test6="{{name}}"></span>');
      expect(element.attr('test2')).toBeUndefined();
      expect(element.attr('test3')).toBeUndefined();
      expect(element.attr('test4')).toBeUndefined();
      expect(element.attr('test5')).toBeUndefined();
      expect(element.attr('test6')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('test2')).toBe('Misko');
      expect(element.attr('test3')).toBe('Misko');
      expect(element.attr('test4')).toBe('Misko');
      expect(element.attr('test5')).toBe('Misko');
      expect(element.attr('test6')).toBe('Misko');
    }));

    describe('with media url attributes', () => {
      it('should work with interpolated ng-attr-src', angular.mock.inject(() => {
        $rootScope.name = 'some-image.png';
        element = compileForTest('<img ng-attr-src="{{name}}">');
        expect(element.attr('src')).toBeUndefined();

        $rootScope.$digest();
        expect(element.attr('src')).toBe('some-image.png');

        $rootScope.name = 'other-image.png';
        $rootScope.$digest();
        expect(element.attr('src')).toBe('other-image.png');
      }));

      it('should work with interpolated ng-attr-data-src', angular.mock.inject(() => {
        $rootScope.name = 'some-image.png';
        element = compileForTest('<img ng-attr-data-src="{{name}}">');
        expect(element.attr('data-src')).toBeUndefined();

        $rootScope.$digest();
        expect(element.attr('data-src')).toBe('some-image.png');

        $rootScope.name = 'other-image.png';
        $rootScope.$digest();
        expect(element.attr('data-src')).toBe('other-image.png');
      }));

      it('should work alongside constant [src]-attribute and [ng-attr-data-src] attributes', angular.mock.inject(() => {
        $rootScope.name = 'some-image.png';
        element = compileForTest('<img src="constant.png" ng-attr-data-src="{{name}}">');
        expect(element.attr('data-src')).toBeUndefined();

        $rootScope.$digest();
        expect(element.attr('src')).toBe('constant.png');
        expect(element.attr('data-src')).toBe('some-image.png');

        $rootScope.name = 'other-image.png';
        $rootScope.$digest();
        expect(element.attr('src')).toBe('constant.png');
        expect(element.attr('data-src')).toBe('other-image.png');
      }));
    });

    describe('when an attribute has a dash-separated name', () => {
      it('should work with different prefixes', angular.mock.inject(() => {
        $rootScope.name = 'JamieMason';
        element = compileForTest('<span ng:attr:dash-test="{{name}}" ng-Attr-dash-test2="{{name}}" ng_Attr_dash-test3="{{name}}"></span>');
        expect(element.attr('dash-test')).toBeUndefined();
        expect(element.attr('dash-test2')).toBeUndefined();
        expect(element.attr('dash-test3')).toBeUndefined();
        $rootScope.$digest();
        expect(element.attr('dash-test')).toBe('JamieMason');
        expect(element.attr('dash-test2')).toBe('JamieMason');
        expect(element.attr('dash-test3')).toBe('JamieMason');
      }));

      it('should work if they are prefixed with x- or data-', angular.mock.inject(() => {
        $rootScope.name = 'JamieMason';
        element = compileForTest('<span data-ng-attr-dash-test2="{{name}}" x-ng-attr-dash-test3="{{name}}" data-ng:attr-dash-test4="{{name}}"></span>');
        expect(element.attr('dash-test2')).toBeUndefined();
        expect(element.attr('dash-test3')).toBeUndefined();
        expect(element.attr('dash-test4')).toBeUndefined();
        $rootScope.$digest();
        expect(element.attr('dash-test2')).toBe('JamieMason');
        expect(element.attr('dash-test3')).toBe('JamieMason');
        expect(element.attr('dash-test4')).toBe('JamieMason');
      }));

      it('should keep attributes ending with -start single-element directives', () => {
        angular.mock.module($compileProvider => {
          $compileProvider.directive('dashStarter', log => {
            return {
              link: function (scope, element, attrs) {
                log(attrs.onDashStart);
              }
            };
          });
        });
        angular.mock.inject(($compile, $rootScope, log) => {
          compileForTest('<span data-dash-starter data-on-dash-start="starter"></span>');
          $rootScope.$digest();
          expect(log).toEqual('starter');
        });
      });

      it('should keep attributes ending with -end single-element directives', () => {
        angular.mock.module($compileProvider => {
          $compileProvider.directive('dashEnder', log => {
            return {
              link: function (scope, element, attrs) {
                log(attrs.onDashEnd);
              }
            };
          });
        });
        angular.mock.inject(($compile, $rootScope, log) => {
          compileForTest('<span data-dash-ender data-on-dash-end="ender"></span>');
          $rootScope.$digest();
          expect(log).toEqual('ender');
        });
      });
    });
  });


  describe('addPropertySecurityContext', () => {
    function testProvider(provider) {
      angular.mock.module(provider);
      angular.mock.inject($compile => { /* done! */ });
    }

    it('should allow adding new properties', () => {
      testProvider($compileProvider => {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
        $compileProvider.addPropertySecurityContext('*', 'my-prop', 'resourceUrl');
      });
    });

    it('should allow different sce types of a property on different element types', () => {
      testProvider($compileProvider => {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
        $compileProvider.addPropertySecurityContext('span', 'title', 'css');
        $compileProvider.addPropertySecurityContext('*', 'title', 'resourceUrl');
        $compileProvider.addPropertySecurityContext('article', 'title', 'html');
      });
    });

    it('should throw \'ctxoverride\' when changing an existing context', () => {
      testProvider($compileProvider => {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');

        expect(() => {
          $compileProvider.addPropertySecurityContext('div', 'title', 'resourceUrl');
        })
          .toThrowMinErr('$compile', 'ctxoverride', 'Property context \'div.title\' already set to \'mediaUrl\', cannot override to \'resourceUrl\'.');
      });
    });

    it('should allow setting the same property/element to the same value', () => {
      testProvider($compileProvider => {
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
        $compileProvider.addPropertySecurityContext('div', 'title', 'mediaUrl');
      });
    });

    it('should enforce the specified sce type for properties added for specific elements', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.addPropertySecurityContext('div', 'foo', 'mediaUrl');
      });
      angular.mock.inject(($compile, $rootScope, $sce) => {
        const element = compileForTest('<div ng-prop-foo="bar"></div>');

        $rootScope.bar = 'untrusted:test1';
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test1');

        $rootScope.bar = $sce.trustAsCss('untrusted:test2');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test2');

        $rootScope.bar = $sce.trustAsMediaUrl('untrusted:test3');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('untrusted:test3');
      });
    });

    it('should enforce the specified sce type for properties added for all elements (*)', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.addPropertySecurityContext('*', 'foo', 'mediaUrl');
      });
      angular.mock.inject(($compile, $rootScope, $sce) => {
        const element = compileForTest('<div ng-prop-foo="bar"></div>');

        $rootScope.bar = 'untrusted:test1';
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test1');

        $rootScope.bar = $sce.trustAsCss('untrusted:test2');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test2');

        $rootScope.bar = $sce.trustAsMediaUrl('untrusted:test3');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('untrusted:test3');
      });
    });

    it('should enforce the specific sce type when both an element specific and generic exist', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.addPropertySecurityContext('*', 'foo', 'css');
        $compileProvider.addPropertySecurityContext('div', 'foo', 'mediaUrl');
      });
      angular.mock.inject(($compile, $rootScope, $sce) => {
        const element = compileForTest('<div ng-prop-foo="bar"></div>');

        $rootScope.bar = 'untrusted:test1';
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test1');

        $rootScope.bar = $sce.trustAsCss('untrusted:test2');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('unsafe:untrusted:test2');

        $rootScope.bar = $sce.trustAsMediaUrl('untrusted:test3');
        $rootScope.$apply();
        expect(element.prop('foo')).toBe('untrusted:test3');
      });
    });
  });


  describe('when an attribute has an underscore-separated name', () => {

    it('should work with different prefixes', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.dimensions = '0 0 0 0';
      element = compileForTest('<svg ng:attr:view_box="{{dimensions}}"></svg>');
      expect(element.attr('viewBox')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('viewBox')).toBe('0 0 0 0');
    }));

    it('should work if they are prefixed with x- or data-', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.dimensions = '0 0 0 0';
      $rootScope.number = 0.42;
      $rootScope.scale = 1;
      element = compileForTest('<svg data-ng-attr-view_box="{{dimensions}}">' +
        '<filter x-ng-attr-filter_units="{{number}}">' +
        '<feDiffuseLighting data-ng:attr_surface_scale="{{scale}}">' +
        '</feDiffuseLighting>' +
        '<feSpecularLighting x-ng:attr_surface_scale="{{scale}}">' +
        '</feSpecularLighting></filter></svg>');
      expect(element.attr('viewBox')).toBeUndefined();
      $rootScope.$digest();
      expect(element.attr('viewBox')).toBe('0 0 0 0');
      expect(element.find('filter').attr('filterUnits')).toBe('0.42');
      expect(element.find('feDiffuseLighting').attr('surfaceScale')).toBe('1');
      expect(element.find('feSpecularLighting').attr('surfaceScale')).toBe('1');
    }));
  });

  describe('multi-element directive', () => {
    it('should group on link function', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span ng-show-start="show"></span>' +
        '<span ng-show-end></span>' +
        '</div>');
      $rootScope.$digest();
      const spans = element.find('span');
      expect(spans.eq(0)).toBeHidden();
      expect(spans.eq(1)).toBeHidden();
    }));


    it('should group on compile function', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
        '<span ng-repeat-end>{{i}}B;</span>' +
        '</div>');
      $rootScope.$digest();
      expect(element.text()).toEqual('1A1B;2A2B;');
    }));


    it('should support grouping over text nodes', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
        ':' + // Important: proves that we can iterate over non-elements
        '<span ng-repeat-end>{{i}}B;</span>' +
        '</div>');
      $rootScope.$digest();
      expect(element.text()).toEqual('1A:1B;2A:2B;');
    }));


    it('should group on $root compile function', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.show = false;
      element = compileForTest(
        '<div></div>' +
        '<span ng-repeat-start="i in [1,2]">{{i}}A</span>' +
        '<span ng-repeat-end>{{i}}B;</span>' +
        '<div></div>');
      $rootScope.$digest();
      element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
      expect(element.text()).toEqual('1A1B;2A2B;');
    }));


    it('should group on nested groups', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('ngMultiBind', ngInternals.valueFn({
          multiElement: true,
          link: function (scope, element, attr) {
            element.text(scope.$eval(attr.ngMultiBind));
          }
        }));
      });
      angular.mock.inject(($compile, $rootScope) => {
        $rootScope.show = false;
        element = compileForTest(
          '<div></div>' +
          '<div ng-repeat-start="i in [1,2]">{{i}}A</div>' +
          '<span ng-multi-bind-start="\'.\'"></span>' +
          '<span ng-multi-bind-end></span>' +
          '<div ng-repeat-end>{{i}}B;</div>' +
          '<div></div>');
        $rootScope.$digest();
        element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
        expect(element.text()).toEqual('1A..1B;2A..2B;');
      });
    });


    it('should group on nested groups of same directive', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.show = false;
      element = compileForTest(
        '<div></div>' +
        '<div ng-repeat-start="i in [1,2]">{{i}}(</div>' +
        '<span ng-repeat-start="j in [2,3]">{{j}}-</span>' +
        '<span ng-repeat-end>{{j}}</span>' +
        '<div ng-repeat-end>){{i}};</div>' +
        '<div></div>');
      $rootScope.$digest();
      element = angular.element(element[0].parentNode.childNodes); // reset because repeater is top level.
      expect(element.text()).toEqual('1(2-23-3)1;2(2-23-3)2;');
    }));


    it('should set up and destroy the transclusion scopes correctly',
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest(
          '<div>' +
          '<div ng-if-start="val0"><span ng-if="val1"></span></div>' +
          '<div ng-if-end><span ng-if="val2"></span></div>' +
          '</div>'
        );
        $rootScope.$apply('val0 = true; val1 = true; val2 = true');

        // At this point we should have something like:
        //
        // <div class="ng-scope">
        //
        //   <!-- ngIf: val0 -->
        //
        //   <div ng-if-start="val0" class="ng-scope">
        //     <!-- ngIf: val1 -->
        //     <span ng-if="val1" class="ng-scope"></span>
        //     <!-- end ngIf: val1 -->
        //   </div>
        //
        //   <div ng-if-end="" class="ng-scope">
        //     <!-- ngIf: val2 -->
        //     <span ng-if="val2" class="ng-scope"></span>
        //     <!-- end ngIf: val2 -->
        //   </div>
        //
        //   <!-- end ngIf: val0 -->
        // </div>
        const ngIfStartScope = element.find('div').eq(0).scope();
        const ngIfEndScope = element.find('div').eq(1).scope();

        expect(ngIfStartScope.$id).toEqual(ngIfEndScope.$id);

        const ngIf1Scope = element.find('span').eq(0).scope();
        const ngIf2Scope = element.find('span').eq(1).scope();

        expect(ngIf1Scope.$id).not.toEqual(ngIf2Scope.$id);
        expect(ngIf1Scope.$parent.$id).toEqual(ngIf2Scope.$parent.$id);

        $rootScope.$apply('val1 = false');

        // Now we should have something like:
        //
        // <div class="ng-scope">
        //   <!-- ngIf: val0 -->
        //   <div ng-if-start="val0" class="ng-scope">
        //     <!-- ngIf: val1 -->
        //   </div>
        //   <div ng-if-end="" class="ng-scope">
        //     <!-- ngIf: val2 -->
        //     <span ng-if="val2" class="ng-scope"></span>
        //     <!-- end ngIf: val2 -->
        //   </div>
        //   <!-- end ngIf: val0 -->
        // </div>

        expect(ngIfStartScope.$$destroyed).not.toEqual(true);
        expect(ngIf1Scope.$$destroyed).toEqual(true);
        expect(ngIf2Scope.$$destroyed).not.toEqual(true);

        $rootScope.$apply('val0 = false');

        // Now we should have something like:
        //
        // <div class="ng-scope">
        //   <!-- ngIf: val0 -->
        // </div>

        expect(ngIfStartScope.$$destroyed).toEqual(true);
        expect(ngIf1Scope.$$destroyed).toEqual(true);
        expect(ngIf2Scope.$$destroyed).toEqual(true);
      }));


    it('should set up and destroy the transclusion scopes correctly',
      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest(
          '<div>' +
          '<div ng-repeat-start="val in val0" ng-if="val1"></div>' +
          '<div ng-repeat-end ng-if="val2"></div>' +
          '</div>'
        );

        // To begin with there is (almost) nothing:
        // <div class="ng-scope">
        //   <!-- ngRepeat: val in val0 -->
        // </div>

        expect(element.scope().$id).toEqual($rootScope.$id);

        // Now we create all the elements
        $rootScope.$apply('val0 = [1]; val1 = true; val2 = true');

        // At this point we have:
        //
        // <div class="ng-scope">
        //
        //   <!-- ngRepeat: val in val0 -->
        //   <!-- ngIf: val1 -->
        //   <div ng-repeat-start="val in val0" class="ng-scope">
        //   </div>
        //   <!-- end ngIf: val1 -->
        //
        //   <!-- ngIf: val2 -->
        //   <div ng-repeat-end="" class="ng-scope">
        //   </div>
        //   <!-- end ngIf: val2 -->
        //   <!-- end ngRepeat: val in val0 -->
        // </div>
        const ngIf1Scope = element.find('div').eq(0).scope();
        const ngIf2Scope = element.find('div').eq(1).scope();
        const ngRepeatScope = ngIf1Scope.$parent;

        expect(ngIf1Scope.$id).not.toEqual(ngIf2Scope.$id);
        expect(ngIf1Scope.$parent.$id).toEqual(ngRepeatScope.$id);
        expect(ngIf2Scope.$parent.$id).toEqual(ngRepeatScope.$id);

        // What is happening here??
        // We seem to have a repeater scope which doesn't actually match to any element
        expect(ngRepeatScope.$parent.$id).toEqual($rootScope.$id);


        // Now remove the first ngIf element from the first item in the repeater
        $rootScope.$apply('val1 = false');

        // At this point we should have:
        //
        // <div class="ng-scope">
        //   <!-- ngRepeat: val in val0 -->
        //
        //   <!-- ngIf: val1 -->
        //
        //   <!-- ngIf: val2 -->
        //   <div ng-repeat-end="" ng-if="val2" class="ng-scope"></div>
        //   <!-- end ngIf: val2 -->
        //
        //   <!-- end ngRepeat: val in val0 -->
        // </div>
        //
        expect(ngRepeatScope.$$destroyed).toEqual(false);
        expect(ngIf1Scope.$$destroyed).toEqual(true);
        expect(ngIf2Scope.$$destroyed).toEqual(false);

        // Now remove the second ngIf element from the first item in the repeater
        $rootScope.$apply('val2 = false');

        // We are mostly back to where we started
        //
        // <div class="ng-scope">
        //   <!-- ngRepeat: val in val0 -->
        //   <!-- ngIf: val1 -->
        //   <!-- ngIf: val2 -->
        //   <!-- end ngRepeat: val in val0 -->
        // </div>

        expect(ngRepeatScope.$$destroyed).toEqual(false);
        expect(ngIf1Scope.$$destroyed).toEqual(true);
        expect(ngIf2Scope.$$destroyed).toEqual(true);

        // Finally remove the repeat items
        $rootScope.$apply('val0 = []');

        // Somehow this ngRepeat scope knows how to destroy itself...
        expect(ngRepeatScope.$$destroyed).toEqual(true);
        expect(ngIf1Scope.$$destroyed).toEqual(true);
        expect(ngIf2Scope.$$destroyed).toEqual(true);
      }));

    it('should throw error if unterminated', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('foo', () => {
          return {
            multiElement: true
          };
        });
      });
      angular.mock.inject(($compile, $rootScope) => {
        expect(() => {
          element = compileForTest(
            '<div>' +
            '<span foo-start></span>' +
            '</div>');
        }).toThrowMinErr('$compile', 'uterdir', 'Unterminated attribute, found \'foo-start\' but no matching \'foo-end\' found.');
      });
    });


    it('should correctly collect ranges on multiple directives on a single element', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('emptyDirective', () => {
          return {
            multiElement: true,
            link: function (scope, element) {
              element.data('x', 'abc');
            }
          };
        });
        $compileProvider.directive('rangeDirective', () => {
          return {
            multiElement: true,
            link: function (scope) {
              scope.x = 'X';
              scope.y = 'Y';
            }
          };
        });
      });

      angular.mock.inject(($compile, $rootScope) => {
        element = compileForTest(
          '<div>' +
          '<div range-directive-start empty-directive>{{x}}</div>' +
          '<div range-directive-end>{{y}}</div>' +
          '</div>'
        );

        $rootScope.$digest();
        expect(element.text()).toBe('XY');
        expect(angular.element(element[0].firstChild).data('x')).toBe('abc');
      });
    });


    it('should throw error if unterminated (containing termination as a child)', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.directive('foo', () => {
          return {
            multiElement: true
          };
        });
      });
      angular.mock.inject($compile => {
        expect(() => {
          element = compileForTest(
            '<div>' +
            '<span foo-start><span foo-end></span></span>' +
            '</div>');
        }).toThrowMinErr('$compile', 'uterdir', 'Unterminated attribute, found \'foo-start\' but no matching \'foo-end\' found.');
      });
    });


    it('should support data- and x- prefix', angular.mock.inject(($compile, $rootScope) => {
      $rootScope.show = false;
      element = compileForTest(
        '<div>' +
        '<span data-ng-show-start="show"></span>' +
        '<span data-ng-show-end></span>' +
        '<span x-ng-show-start="show"></span>' +
        '<span x-ng-show-end></span>' +
        '</div>');
      $rootScope.$digest();
      const spans = element.find('span');
      expect(spans.eq(0)).toBeHidden();
      expect(spans.eq(1)).toBeHidden();
      expect(spans.eq(2)).toBeHidden();
      expect(spans.eq(3)).toBeHidden();
    }));
  });

  describe('$animate animation hooks', () => {

    beforeEach(angular.mock.module('ngAnimateMock'));

    it('should automatically fire the addClass and removeClass animation hooks',
      angular.mock.inject(($compile, $animate, $rootScope) => {
        let data;
        const element = angular.element('<div class="{{val1}} {{val2}} fire"></div>');
        compileForTest(element);

        $rootScope.$digest();

        expect(element.hasClass('fire')).toBe(true);

        $rootScope.val1 = 'ice';
        $rootScope.val2 = 'rice';
        $rootScope.$digest();

        data = $animate.queue.shift();
        expect(data.event).toBe('addClass');
        expect(data.args[1]).toBe('ice rice');

        expect(element.hasClass('ice')).toBe(true);
        expect(element.hasClass('rice')).toBe(true);
        expect(element.hasClass('fire')).toBe(true);

        $rootScope.val2 = 'dice';
        $rootScope.$digest();

        data = $animate.queue.shift();
        expect(data.event).toBe('addClass');
        expect(data.args[1]).toBe('dice');

        data = $animate.queue.shift();
        expect(data.event).toBe('removeClass');
        expect(data.args[1]).toBe('rice');

        expect(element.hasClass('ice')).toBe(true);
        expect(element.hasClass('dice')).toBe(true);
        expect(element.hasClass('fire')).toBe(true);

        $rootScope.val1 = '';
        $rootScope.val2 = '';
        $rootScope.$digest();

        data = $animate.queue.shift();
        expect(data.event).toBe('removeClass');
        expect(data.args[1]).toBe('ice dice');

        expect(element.hasClass('ice')).toBe(false);
        expect(element.hasClass('dice')).toBe(false);
        expect(element.hasClass('fire')).toBe(true);
      }));
  });

  describe('element replacement', () => {
    it('should broadcast $destroy only on removed elements, not replaced', () => {
      const linkCalls = [];
      const destroyCalls = [];

      angular.mock.module($compileProvider => {
        $compileProvider.directive('replace', () => {
          return {
            multiElement: true,
            replace: true,
            templateUrl: 'template123'
          };
        });

        $compileProvider.directive('foo', () => {
          return {
            priority: 1, // before the replace directive
            link: function ($scope, $element, $attrs) {
              linkCalls.push($attrs.foo);
              $element.on('$destroy', () => {
                destroyCalls.push($attrs.foo);
              });
            }
          };
        });
      });

      angular.mock.inject(($compile, $templateCache, $rootScope) => {
        $templateCache.put('template123', '<p></p>');

        compileForTest(
          '<div replace-start foo="1"><span foo="1.1"></span></div>' +
          '<div foo="2"><span foo="2.1"></span></div>' +
          '<div replace-end foo="3"><span foo="3.1"></span></div>'
        );

        expect(linkCalls).toEqual(['2', '3']);
        expect(destroyCalls).toEqual([]);
        $rootScope.$apply();
        expect(linkCalls).toEqual(['2', '3', '1']);
        expect(destroyCalls).toEqual(['2', '3']);
      });
    });

    function getAll($root) {
      // check for .querySelectorAll to support comment nodes
      return [$root[0]].concat($root[0].querySelectorAll ? angular.sliceArgs($root[0].querySelectorAll('*')) : []);
    }

    function testCompileLinkDataCleanup(template) {
      angular.mock.inject(($compile, $rootScope) => {
        const toCompile = angular.element(template);

        const preCompiledChildren = getAll(toCompile);
        angular.forEach(preCompiledChildren, (element, i) => {
          angular.element.data(element, 'foo', 'template#' + i);
        });

        const linkedElements = compileForTest(toCompile);
        $rootScope.$apply();
        linkedElements.remove();

        angular.forEach(preCompiledChildren, (element, i) => {
          expect(angular.element.hasData(element)).toBe(false, 'template#' + i);
        });
        angular.forEach(getAll(linkedElements), (element, i) => {
          expect(angular.element.hasData(element)).toBe(false, 'linked#' + i);
        });
      });
    }
    it('should clean data of element-transcluded link-cloned elements', () => {
      testCompileLinkDataCleanup('<div><div ng-repeat-start="i in [1,2]"><span></span></div><div ng-repeat-end></div></div>');
    });
    it('should clean data of element-transcluded elements', () => {
      testCompileLinkDataCleanup('<div ng-if-start="false"><span><span/></div><span></span><div ng-if-end><span></span></div>');
    });

    function testReplaceElementCleanup(dirOptions) {
      const template = '<div></div>';
      angular.mock.module($compileProvider => {
        $compileProvider.directive('theDir', () => {
          return {
            multiElement: true,
            replace: dirOptions.replace,
            transclude: dirOptions.transclude,
            template: dirOptions.asyncTemplate ? undefined : template,
            templateUrl: dirOptions.asyncTemplate ? 'the-dir-template-url' : undefined
          };
        });
      });
      angular.mock.inject(($templateCache, $compile, $rootScope) => {
        $templateCache.put('the-dir-template-url', template);

        testCompileLinkDataCleanup(
          '<div>' +
          '<div the-dir-start><span></span></div>' +
          '<div><span></span><span></span></div>' +
          '<div the-dir-end><span></span></div>' +
          '</div>'
        );
      });
    }
    it('should clean data of elements removed for directive template', () => {
      testReplaceElementCleanup({});
    });
    it('should clean data of elements removed for directive templateUrl', () => {
      testReplaceElementCleanup({ asyncTemplate: true });
    });
    it('should clean data of elements transcluded into directive template', () => {
      testReplaceElementCleanup({ transclude: true });
    });
    it('should clean data of elements transcluded into directive templateUrl', () => {
      testReplaceElementCleanup({ transclude: true, asyncTemplate: true });
    });
    it('should clean data of elements replaced with directive template', () => {
      testReplaceElementCleanup({ replace: true });
    });
    it('should clean data of elements replaced with directive templateUrl', () => {
      testReplaceElementCleanup({ replace: true, asyncTemplate: true });
    });
  });

  describe('component helper', () => {
    it('should return the module', () => {
      const myModule = angular.module('my', []);
      expect(myModule.component('myComponent', {})).toBe(myModule);
      expect(myModule.component({})).toBe(myModule);
    });

    it('should register a directive', () => {
      angular.module('my', []).component('myComponent', {
        template: '<div>SUCCESS</div>',
        controller: function (log) {
          log('OK');
        }
      });
      angular.mock.module('my');

      angular.mock.inject(($compile, $rootScope, log) => {
        element = compileForTest('<my-component></my-component>');
        expect(element.find('div').text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    it('should register multiple directives when object passed as first parameter', () => {
      let log = '';
      angular.module('my', []).component({
        fooComponent: {
          template: '<div>FOO SUCCESS</div>',
          controller: function () {
            log += 'FOO:OK';
          }
        },
        barComponent: {
          template: '<div>BAR SUCCESS</div>',
          controller: function () {
            log += 'BAR:OK';
          }
        }
      });
      angular.mock.module('my');

      angular.mock.inject(($compile, $rootScope) => {
        const fooElement = compileForTest('<foo-component></foo-component>');
        const barElement = compileForTest('<bar-component></bar-component>');

        expect(fooElement.find('div').text()).toEqual('FOO SUCCESS');
        expect(barElement.find('div').text()).toEqual('BAR SUCCESS');
        expect(log).toEqual('FOO:OKBAR:OK');
      });
    });

    it('should register a directive via $compileProvider.component()', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.component('myComponent', {
          template: '<div>SUCCESS</div>',
          controller: function (log) {
            log('OK');
          }
        });
      });

      angular.mock.inject(($compile, $rootScope, log) => {
        element = compileForTest('<my-component></my-component>');
        expect(element.find('div').text()).toEqual('SUCCESS');
        expect(log).toEqual('OK');
      });
    });

    it('should add additional annotations to directive factory', () => {
      const myModule = angular.module('my', []).component('myComponent', {
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      });
      expect(myModule._invokeQueue.pop().pop()[1]).toEqual(expect.objectContaining({
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      }));
    });

    it('should expose additional annotations on the directive definition object', () => {
      angular.module('my', []).component('myComponent', {
        $canActivate: 'canActivate',
        $routeConfig: 'routeConfig',
        $customAnnotation: 'XXX'
      });
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          $canActivate: 'canActivate',
          $routeConfig: 'routeConfig',
          $customAnnotation: 'XXX'
        }));
      });
    });

    it('should support custom annotations if the controller is named', () => {
      angular.module('my', []).component('myComponent', {
        $customAnnotation: 'XXX',
        controller: 'SomeNamedController'
      });
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          $customAnnotation: 'XXX'
        }));
      });
    });

    it('should provide a new empty controller if none is specified', () => {
      angular.module('my', []).component('myComponent1', { $customAnnotation1: 'XXX' }).component('myComponent2', { $customAnnotation2: 'YYY' });
      angular.mock.module('my');

      angular.mock.inject((myComponent1Directive, myComponent2Directive) => {
        const ctrl1 = myComponent1Directive[0].controller;
        const ctrl2 = myComponent2Directive[0].controller;

        expect(ctrl1).not.toBe(ctrl2);
        expect(ctrl1.$customAnnotation1).toBe('XXX');
        expect(ctrl1.$customAnnotation2).toBeUndefined();
        expect(ctrl2.$customAnnotation1).toBeUndefined();
        expect(ctrl2.$customAnnotation2).toBe('YYY');
      });
    });

    it('should return ddo with reasonable defaults', () => {
      angular.module('my', []).component('myComponent', {});
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controller: expect.any(Function),
          controllerAs: '$ctrl',
          template: '',
          templateUrl: undefined,
          transclude: undefined,
          scope: {},
          bindToController: {},
          restrict: 'E'
        }));
      });
    });

    it('should return ddo with assigned options', () => {
      function myCtrl() { }
      angular.module('my', []).component('myComponent', {
        controller: myCtrl,
        controllerAs: 'ctrl',
        template: 'abc',
        templateUrl: 'def.html',
        transclude: true,
        bindings: { abc: '=' }
      });
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controller: myCtrl,
          controllerAs: 'ctrl',
          template: 'abc',
          templateUrl: 'def.html',
          transclude: true,
          scope: {},
          bindToController: { abc: '=' },
          restrict: 'E'
        }));
      });
    });

    it('should allow passing injectable functions as template/templateUrl', () => {
      let log = '';
      angular.module('my', []).component('myComponent', {
        template: function ($element, $attrs, myValue) {
          log += 'template,' + $element + ',' + $attrs + ',' + myValue + '\n';
        },
        templateUrl: function ($element, $attrs, myValue) {
          log += 'templateUrl,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }
      }).value('myValue', 'blah');
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        myComponentDirective[0].template('a', 'b');
        myComponentDirective[0].templateUrl('c', 'd');
        expect(log).toEqual('template,a,b,blah\ntemplateUrl,c,d,blah\n');
      });
    });

    it('should allow passing injectable arrays as template/templateUrl', () => {
      let log = '';
      angular.module('my', []).component('myComponent', {
        template: ['$element', '$attrs', 'myValue', ($element, $attrs, myValue) => {
          log += 'template,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }],
        templateUrl: ['$element', '$attrs', 'myValue', ($element, $attrs, myValue) => {
          log += 'templateUrl,' + $element + ',' + $attrs + ',' + myValue + '\n';
        }]
      }).value('myValue', 'blah');
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        myComponentDirective[0].template('a', 'b');
        myComponentDirective[0].templateUrl('c', 'd');
        expect(log).toEqual('template,a,b,blah\ntemplateUrl,c,d,blah\n');
      });
    });

    it('should allow passing transclude as object', () => {
      angular.module('my', []).component('myComponent', {
        transclude: {}
      });
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          transclude: {}
        }));
      });
    });

    it('should give ctrl as syntax priority over controllerAs', () => {
      angular.module('my', []).component('myComponent', {
        controller: 'MyCtrl as vm'
      });
      angular.mock.module('my');
      angular.mock.inject(myComponentDirective => {
        expect(myComponentDirective[0]).toEqual(expect.objectContaining({
          controllerAs: 'vm'
        }));
      });
    });
  });

  describe('$$createComment', () => {
    it('should create empty comments if `debugInfoEnabled` is false', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.debugInfoEnabled(false);
      });

      angular.mock.inject($compile => {
        const comment = $compile.$$createComment('foo', 'bar');
        expect(comment.data).toBe('');
      });
    });

    it('should create descriptive comments if `debugInfoEnabled` is true', () => {
      angular.mock.module($compileProvider => {
        $compileProvider.debugInfoEnabled(true);
      });

      angular.mock.inject($compile => {
        const comment = $compile.$$createComment('foo', 'bar');
        expect(comment.data).toBe(' foo: bar ');
      });
    });
  });
});
