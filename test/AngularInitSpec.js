describe('angularInit', () => {
  let document;
  let bootstrapSpy;
  let element;

  beforeEach(() => {
    document = window.document;
  });

  afterEach(() => {
    dealoc(element);
  });

  beforeEach(() => {
    element = {
      hasAttribute: function (name) {
        return !!element[name];
      },

      querySelector: function (arg) {
        return element.querySelector[arg] || null;
      },

      getAttribute: function (name) {
        return element[name];
      }
    };

    bootstrapSpy = jest.fn();
    window.name = "";
  });

  it('should do nothing when not found', () => {
    ngInternals.angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).not.toHaveBeenCalled();
  });


  it('should look for ngApp directive as attr', () => {
    const appElement = angular.element('<div ng-app="ABC"></div>')[0];
    element.querySelector['[ng-app]'] = appElement;
    ngInternals.angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, ['ABC'], expect.any(Object));
  });


  it('should look for ngApp directive using querySelectorAll', () => {
    const appElement = angular.element('<div x-ng-app="ABC"></div>')[0];
    element.querySelector['[x-ng-app]'] = appElement;
    ngInternals.angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, ['ABC'], expect.any(Object));
  });


  it('should bootstrap anonymously', () => {
    const appElement = angular.element('<div x-ng-app></div>')[0];
    element.querySelector['[x-ng-app]'] = appElement;
    ngInternals.angularInit(element, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, [], expect.any(Object));
  });


  it('should bootstrap if the annotation is on the root element', () => {
    const appElement = angular.element('<div ng-app=""></div>')[0];
    ngInternals.angularInit(appElement, bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledOnceWith(appElement, [], expect.any(Object));
  });


  it('should complain if app module cannot be found', () => {
    const appElement = angular.element('<div ng-app="doesntexist"></div>')[0];

    expect(() => {
      ngInternals.angularInit(appElement, angular.bootstrap);
    }).toThrowMinErr('$injector', 'modulerr',
      new RegExp('Failed to instantiate module doesntexist due to:\\n' +
        '.*\\[\\$injector:nomod] Module \'doesntexist\' is not available! You either ' +
        'misspelled the module name or forgot to load it\\.')
    );
  });


  it('should complain if an element has already been bootstrapped', () => {
    const element = angular.element('<div>bootstrap me!</div>');
    angular.bootstrap(element);

    expect(() => {
      angular.bootstrap(element);
    }).toThrowMinErr('ng', 'btstrpd',
      /App Already Bootstrapped with this Element '&lt;div class="?ng-scope"?( ng\d+="?\d+"?)?&gt;'/i);

    dealoc(element);
  });


  it('should complain if manually bootstrapping a document whose <html> element has already been bootstrapped', () => {
    angular.bootstrap(document.getElementsByTagName('html')[0]);
    expect(() => {
      angular.bootstrap(document);
    }).toThrowMinErr('ng', 'btstrpd', /App Already Bootstrapped with this Element 'document'/i);

    dealoc(document);
  });


  it('should bootstrap in strict mode when ng-strict-di attribute is specified', () => {
    bootstrapSpy = jest.spyOn(angular, 'bootstrap');
    const appElement = angular.element('<div ng-app="" ng-strict-di></div>');
    ngInternals.angularInit(angular.element('<div></div>').append(appElement[0])[0], bootstrapSpy);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
    expect(bootstrapSpy.mock.calls[bootstrapSpy.mock.calls.length - 1][2].strictDi).toBe(true);

    const injector = appElement.injector();
    function testFactory($rootScope) { }
    expect(() => {
      injector.instantiate(testFactory);
    }).toThrowMinErr('$injector', 'strictdi');

    dealoc(appElement);
  });

  describe('auto bootstrap restrictions', () => {

    function createFakeDoc(attrs, protocol, currentScript) {

      protocol = protocol || 'http:';
      const origin = protocol + '//something';

      if (currentScript === undefined) {
        currentScript = document.createElement('script');
        Object.keys(attrs).forEach(key => { currentScript.setAttribute(key, attrs[key]); });
      }

      // Fake a minimal document object (the actual document.currentScript is readonly).
      return {
        currentScript: currentScript,
        location: { protocol: protocol, origin: origin },
        createElement: document.createElement.bind(document)
      };
    }

    it('should bootstrap from a script with no source (e.g. src, href or xlink:href attributes)', () => {
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ src: null }))).toBe(true);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ href: null }))).toBe(true);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ 'xlink:href': null }))).toBe(true);
    });

    it('should not bootstrap from a script with an empty source (e.g. `src=""`)', () => {
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ src: '' }))).toBe(false);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ href: '' }))).toBe(false);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ 'xlink:href': '' }))).toBe(false);
    });


    it('should not bootstrap from an extension into a non-extension document', () => {

      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ src: 'resource://something' }))).toBe(false);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ src: 'file://whatever' }))).toBe(true);
    });

    it('should not bootstrap from an extension into a non-extension document, via SVG script', () => {

      // SVG script tags don't use the `src` attribute to load their source.
      // Instead they use `href` or the deprecated `xlink:href` attributes.

      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ href: 'resource://something' }))).toBe(false);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ 'xlink:href': 'resource://something' }))).toBe(false);

      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ src: 'http://something', href: 'resource://something' }))).toBe(false);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ href: 'http://something', 'xlink:href': 'resource://something' }))).toBe(false);
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({ src: 'resource://something', href: 'http://something', 'xlink:href': 'http://something' }))).toBe(false);
    });

    it('should not bootstrap if the currentScript property has been clobbered', () => {

      const img = document.createElement('img');
      img.setAttribute('src', '');
      expect(ngInternals.allowAutoBootstrap(createFakeDoc({}, 'http:', img))).toBe(false);
    });
  });
});
