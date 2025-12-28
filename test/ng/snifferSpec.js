'use strict';

describe('$sniffer', () => {
  function sniffer($window, $document) {
    /* global ngInternals.$SnifferProvider: false */
    $window.navigator = $window.navigator || {};
    $document = angular.element($document || {});
    if (!$document[0].body) {
      $document[0].body = window.document.body;
    }
    return new ngInternals.$SnifferProvider().$get[2]($window, $document);
  }


  describe('history', () => {
    it('should be true if history.pushState defined', () => {
      const mockWindow = {
        history: {
          pushState: angular.noop,
          replaceState: angular.noop
        }
      };

      expect(sniffer(mockWindow).history).toBe(true);
    });


    it('should be false if history or pushState not defined', () => {
      expect(sniffer({}).history).toBe(false);
      expect(sniffer({ history: {} }).history).toBe(false);
    });


    it('should be false on Boxee box with an older version of Webkit', () => {
      const mockWindow = {
        history: {
          pushState: angular.noop
        },
        navigator: {
          userAgent: 'boxee (alpha/Darwin 8.7.1 i386 - 0.9.11.5591)'
        }
      };

      expect(sniffer(mockWindow).history).toBe(false);
    });


    it('should be true on NW.js apps (which look similar to Chrome Packaged Apps)', () => {
      const mockWindow = {
        history: {
          pushState: angular.noop
        },
        chrome: {
          app: {
            runtime: {}
          }
        },
        nw: {
          process: {}
        }
      };

      expect(sniffer(mockWindow).history).toBe(true);
    });


    it('should be false on Chrome Packaged Apps', () => {
      // Chrome Packaged Apps are not allowed to access `window.history.pushState`.
      // In Chrome, `window.app` might be available in "normal" webpages, but `window.app.runtime`
      // only exists in the context of a packaged app.

      expect(sniffer(createMockWindow()).history).toBe(true);
      expect(sniffer(createMockWindow(true)).history).toBe(true);
      expect(sniffer(createMockWindow(true, true)).history).toBe(false);

      function createMockWindow(isChrome, isPackagedApp) {
        const mockWindow = {
          history: {
            pushState: angular.noop
          }
        };

        if (isChrome) {
          const chromeAppObj = isPackagedApp ? { runtime: {} } : {};
          mockWindow.chrome = { app: chromeAppObj };
        }

        return mockWindow;
      }
    });


    it('should not try to access `history.pushState` in Chrome Packaged Apps', () => {
      let pushStateAccessCount = 0;

      const mockHistory = Object.create(Object.prototype, {
        pushState: { get: function () { pushStateAccessCount++; return angular.noop; } }
      });
      const mockWindow = {
        chrome: {
          app: {
            runtime: {}
          }
        },
        history: mockHistory
      };

      sniffer(mockWindow);

      expect(pushStateAccessCount).toBe(0);
    });

    it('should not try to access `history.pushState` in sandboxed Chrome Packaged Apps',
      () => {
        let pushStateAccessCount = 0;

        const mockHistory = Object.create(Object.prototype, {
          pushState: { get: function () { pushStateAccessCount++; return angular.noop; } }
        });
        const mockWindow = {
          chrome: {
            runtime: {
              id: 'x'
            }
          },
          history: mockHistory
        };

        sniffer(mockWindow);

        expect(pushStateAccessCount).toBe(0);
      }
    );
  });


  describe('hasEvent', () => {
    let mockDocument, mockDivElement, $sniffer;

    beforeEach(() => {
      const mockCreateElementFn = elm => { if (elm === 'div') return mockDivElement; };
      const createElementSpy = jest.fn(mockCreateElementFn);

      mockDocument = { createElement: createElementSpy };
      $sniffer = sniffer({}, mockDocument);
    });


    it('should return true if "onchange" is present in a div element', () => {
      mockDivElement = { onchange: angular.noop };

      expect($sniffer.hasEvent('change')).toBe(true);
    });


    it('should return false if "oninput" is not present in a div element', () => {
      mockDivElement = {};

      expect($sniffer.hasEvent('input')).toBe(false);
    });


    it('should only create the element once', () => {
      mockDivElement = {};

      $sniffer.hasEvent('change');
      $sniffer.hasEvent('change');
      $sniffer.hasEvent('change');

      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });


    it('should claim that IE9 doesn\'t have support for "oninput"', () => {
      // Support: IE 9-11 only
      // IE9 implementation is fubared, so it's better to pretend that it doesn't have the support
      // IE10+ implementation is fubared when mixed with placeholders
      mockDivElement = { oninput: angular.noop };

      expect($sniffer.hasEvent('input')).toBe(!ngInternals.msie);
    });
  });


  describe('csp', () => {
    it('should have all rules set to false by default', () => {
      const csp = sniffer({}).csp;
      angular.forEach(Object.keys(csp), key => {
        expect(csp[key]).toEqual(false);
      });
    });
  });


  describe('animations', () => {
    it('should be either true or false', angular.mock.inject($sniffer => {
      expect($sniffer.animations).toBeDefined();
    }));


    it('should be false when there is no animation style', () => {
      const mockDocument = {
        body: {
          style: {}
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(false);
    });


    it('should be true with -webkit-prefixed animations', () => {
      const animationStyle = 'some_animation 2s linear';
      const mockDocument = {
        body: {
          style: {
            webkitAnimation: animationStyle
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(true);
    });


    it('should be true with w3c-style animations', () => {
      const mockDocument = {
        body: {
          style: {
            animation: 'some_animation 2s linear'
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(true);
    });


    it('should be true on android with older body style properties', () => {
      const mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };
      const mockDocument = {
        body: {
          style: {
            webkitAnimation: ''
          }
        }
      };

      expect(sniffer(mockWindow, mockDocument).animations).toBe(true);
    });


    it('should be true when an older version of Webkit is used', () => {
      const mockDocument = {
        body: {
          style: {
            WebkitOpacity: '0'
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(false);
    });
  });


  describe('transitions', () => {
    it('should be either true or false', angular.mock.inject($sniffer => {
      expect($sniffer.transitions).toBeOneOf(true, false);
    }));


    it('should be false when there is no transition style', () => {
      const mockDocument = {
        body: {
          style: {}
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(false);
    });


    it('should be true with -webkit-prefixed transitions', () => {
      const transitionStyle = '1s linear all';
      const mockDocument = {
        body: {
          style: {
            webkitTransition: transitionStyle
          }
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(true);
    });


    it('should be true with w3c-style transitions', () => {
      const mockDocument = {
        body: {
          style: {
            transition: '1s linear all'
          }
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(true);
    });


    it('should be true on android with older body style properties', () => {
      const mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };
      const mockDocument = {
        body: {
          style: {
            webkitTransition: ''
          }
        }
      };

      expect(sniffer(mockWindow, mockDocument).transitions).toBe(true);
    });
  });


  describe('android', () => {
    it('should provide the android version', () => {
      const mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };

      expect(sniffer(mockWindow).android).toBe(2);
    });
  });
});
