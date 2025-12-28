'use strict';

describe('module loader', () => {
  let window;

  beforeEach(() => {
    window = {};
    ngInternals.setupModuleLoader(window);
  });


  it('should set up namespace', () => {
    expect(window.angular).toBeDefined();
    expect(window.angular.module).toBeDefined();
  });


  it('should not override existing namespace', () => {
    const angular = window.angular;
    const module = angular.module;

    ngInternals.setupModuleLoader(window);
    expect(window.angular).toBe(angular);
    expect(window.angular.module).toBe(module);
  });


  it('should record calls', () => {
    const otherModule = window.angular.module('other', []);
    otherModule.config('otherInit');

    const myModule = window.angular.module('my', ['other'], 'config');

    expect(myModule.
      decorator('dk', 'dv').
      provider('sk', 'sv').
      factory('fk', 'fv').
      service('a', 'aa').
      value('k', 'v').
      filter('f', 'ff').
      directive('d', 'dd').
      component('c', 'cc').
      controller('ctrl', 'ccc').
      config('init2').
      constant('abc', 123).
      run('runBlock')).toBe(myModule);

    expect(myModule.requires).toEqual(['other']);
    expect(myModule._invokeQueue).toEqual([
      ['$provide', 'constant', expect.objectContaining(['abc', 123])],
      ['$provide', 'provider', expect.objectContaining(['sk', 'sv'])],
      ['$provide', 'factory', expect.objectContaining(['fk', 'fv'])],
      ['$provide', 'service', expect.objectContaining(['a', 'aa'])],
      ['$provide', 'value', expect.objectContaining(['k', 'v'])],
      ['$filterProvider', 'register', expect.objectContaining(['f', 'ff'])],
      ['$compileProvider', 'directive', expect.objectContaining(['d', 'dd'])],
      ['$compileProvider', 'component', expect.objectContaining(['c', 'cc'])],
      ['$controllerProvider', 'register', expect.objectContaining(['ctrl', 'ccc'])]
    ]);
    expect(myModule._configBlocks).toEqual([
      ['$injector', 'invoke', expect.objectContaining(['config'])],
      ['$provide', 'decorator', expect.objectContaining(['dk', 'dv'])],
      ['$injector', 'invoke', expect.objectContaining(['init2'])]
    ]);
    expect(myModule._runBlocks).toEqual(['runBlock']);
  });


  it('should not throw error when `module.decorator` is declared before provider that it decorates', () => {
    angular.module('theModule', []).
      decorator('theProvider', $delegate => { return $delegate; }).
      factory('theProvider', () => { return {}; });

    expect(() => {
      ngInternals.createInjector(['theModule']);
    }).not.toThrow();
  });


  it('should run decorators in order of declaration, even when mixed with provider.decorator', () => {
    let log = '';

    angular.module('theModule', [])
      .factory('theProvider', () => {
        return { api: 'provider' };
      })
      .decorator('theProvider', $delegate => {
        $delegate.api = $delegate.api + '-first';
        return $delegate;
      })
      .config($provide => {
        $provide.decorator('theProvider', $delegate => {
          $delegate.api = $delegate.api + '-second';
          return $delegate;
        });
      })
      .decorator('theProvider', $delegate => {
        $delegate.api = $delegate.api + '-third';
        return $delegate;
      })
      .run(theProvider => {
        log = theProvider.api;
      });

    ngInternals.createInjector(['theModule']);
    expect(log).toBe('provider-first-second-third');
  });


  it('should decorate the last declared provider if multiple have been declared', () => {
    let log = '';

    angular.module('theModule', []).
      factory('theProvider', () => {
        return {
          api: 'firstProvider'
        };
      }).
      decorator('theProvider', $delegate => {
        $delegate.api = $delegate.api + '-decorator';
        return $delegate;
      }).
      factory('theProvider', () => {
        return {
          api: 'secondProvider'
        };
      }).
      run(theProvider => {
        log = theProvider.api;
      });

    ngInternals.createInjector(['theModule']);
    expect(log).toBe('secondProvider-decorator');
  });


  it('should allow module redefinition', () => {
    expect(window.angular.module('a', [])).not.toBe(window.angular.module('a', []));
  });


  it('should complain of no module', () => {
    expect(() => {
      window.angular.module('dontExist');
    }).toThrowMinErr('$injector', 'nomod', 'Module \'dontExist\' is not available! You either misspelled the module name ' +
      'or forgot to load it. If registering a module ensure that you specify the dependencies as the second ' +
      'argument.');
  });

  it('should complain if a module is called "hasOwnProperty', () => {
    expect(() => {
      window.angular.module('hasOwnProperty', []);
    }).toThrowMinErr('ng', 'badname', 'hasOwnProperty is not a valid module name');
  });

  it('should expose `$$minErr` on the `angular` object', () => {
    expect(window.angular.$$minErr).toEqual(expect.any(Function));
  });

  describe('Module', () => {
    describe('info()', () => {
      let theModule;

      beforeEach(() => {
        theModule = angular.module('theModule', []);
      });

      it('should default to an empty object', () => {
        expect(theModule.info()).toEqual({});
      });

      it('should store the object passed as a param', () => {
        theModule.info({ version: '1.2' });
        expect(theModule.info()).toEqual({ version: '1.2' });
      });

      it('should throw if the parameter is not an object', () => {
        expect(() => {
          theModule.info('some text');
        }).toThrowMinErr('ng', 'aobj');
      });

      it('should completely replace the previous info object', () => {
        theModule.info({ value: 'X' });
        theModule.info({ newValue: 'Y' });
        expect(theModule.info()).toEqual({ newValue: 'Y' });
      });
    });
  });
});
