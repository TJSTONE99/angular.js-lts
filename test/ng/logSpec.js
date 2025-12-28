/* global ngInternals.$LogProvider: false */
'use strict';

describe('$log', () => {
  let $window, logger, log, warn, info, error, debug;

  beforeEach(angular.mock.module($provide => {
    $window = {
      navigator: { userAgent: window.navigator.userAgent },
      document: {}
    };
    logger = '';
    log = () => { logger += 'log;'; };
    warn = () => { logger += 'warn;'; };
    info = () => { logger += 'info;'; };
    error = () => { logger += 'error;'; };
    debug = () => { logger += 'debug;'; };

    $provide.provider('$log', ngInternals.$LogProvider);
    $provide.value('$exceptionHandler', angular.mock.rethrow);
    $provide.value('$window', $window);
  }));

  it('should use console if present', angular.mock.inject(
    () => {
      $window.console = {
        log: log,
        warn: warn,
        info: info,
        error: error,
        debug: debug
      };
    },
    $log => {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
      expect(logger).toEqual('log;warn;info;error;debug;');
    }
  ));


  it('should use console.log() if other not present', angular.mock.inject(
    () => {
      $window.console = { log: log };
    },
    $log => {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
      expect(logger).toEqual('log;log;log;log;log;');
    }
  ));


  it('should use noop if no console', angular.mock.inject(
    $log => {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
    }
  ));

  runTests({ ie9Mode: false });
  runTests({ ie9Mode: true });

  function runTests(options) {
    const ie9Mode = options.ie9Mode;

    function attachMockConsoleTo$window() {
      // Support: IE 9 only
      // Simulate missing apply on console methods in IE 9.
      if (ie9Mode) {
        log.apply = log.call =
          warn.apply = warn.call =
          info.apply = info.call =
          error.apply = error.call =
          debug.apply = debug.call = null;
      }

      $window.console = {
        log: log,
        warn: warn,
        info: info,
        error: error,
        debug: debug
      };
    }

    describe(ie9Mode ? 'IE 9 logging behavior' : 'Modern browsers\' logging behavior', () => {
      beforeEach(angular.mock.module(attachMockConsoleTo$window));

      it('should work if $window.navigator not defined', angular.mock.inject(
        () => {
          delete $window.navigator;
        },
        $log => { }
      ));

      it('should have a working apply method', angular.mock.inject($log => {
        $log.log.apply($log);
        $log.warn.apply($log);
        $log.info.apply($log);
        $log.error.apply($log);
        $log.debug.apply($log);
        expect(logger).toEqual('log;warn;info;error;debug;');
      }));

      // Support: Safari 9.1 only, iOS 9.3 only
      // For some reason Safari thinks there is always 1 parameter passed here.
      if (!/\b9\.\d(\.\d+)* safari/i.test(window.navigator.userAgent) &&
        !/\biphone os 9_/i.test(window.navigator.userAgent)) {
        it('should not attempt to log the second argument in IE if it is not specified', angular.mock.inject(
          () => {
            log = function (arg1, arg2) { logger += 'log,' + arguments.length + ';'; };
            warn = function (arg1, arg2) { logger += 'warn,' + arguments.length + ';'; };
            info = function (arg1, arg2) { logger += 'info,' + arguments.length + ';'; };
            error = function (arg1, arg2) { logger += 'error,' + arguments.length + ';'; };
            debug = function (arg1, arg2) { logger += 'debug,' + arguments.length + ';'; };
          },
          attachMockConsoleTo$window,
          $log => {
            $log.log();
            $log.warn();
            $log.info();
            $log.error();
            $log.debug();
            expect(logger).toEqual('log,0;warn,0;info,0;error,0;debug,0;');
          })
        );
      }

      describe('$log.debug', () => {

        beforeEach(initService(false));

        it('should skip debugging output if disabled', angular.mock.inject(
          () => {
            $window.console = {
              log: log,
              warn: warn,
              info: info,
              error: error,
              debug: debug
            };
          },
          $log => {
            $log.log();
            $log.warn();
            $log.info();
            $log.error();
            $log.debug();
            expect(logger).toEqual('log;warn;info;error;');
          }
        ));

      });

      describe('$log.error', () => {
        let e, $log;

        function TestError() {
          Error.prototype.constructor.apply(this, arguments);
          this.message = undefined;
          this.sourceURL = undefined;
          this.line = undefined;
          this.stack = undefined;
        }
        TestError.prototype = Object.create(Error.prototype);
        TestError.prototype.constructor = TestError;

        beforeEach(angular.mock.inject(
          () => {
            e = new TestError('');
            $window.console = {
              error: jest.fn()
            };
          },

          _$log_ => {
            $log = _$log_;
          }
        ));

        it('should pass error if does not have trace', () => {
          $log.error('abc', e);
          expect($window.console.error).toHaveBeenCalledWith('abc', e);
        });

        if (ngInternals.msie || /\bEdge\//.test(window.navigator.userAgent)) {
          it('should print stack', () => {
            e.stack = 'stack';
            $log.error('abc', e);
            expect($window.console.error).toHaveBeenCalledWith('abc', 'stack');
          });
        } else {
          it('should print a raw error', () => {
            e.stack = 'stack';
            $log.error('abc', e);
            expect($window.console.error).toHaveBeenCalledWith('abc', e);
          });
        }

        it('should print line', () => {
          e.message = 'message';
          e.sourceURL = 'sourceURL';
          e.line = '123';
          $log.error('abc', e);
          expect($window.console.error).toHaveBeenCalledWith('abc', 'message\nsourceURL:123');
        });
      });
    });
  }


  function initService(debugEnabled) {
    return angular.mock.module($logProvider => {
      $logProvider.debugEnabled(debugEnabled);
    });
  }
});
