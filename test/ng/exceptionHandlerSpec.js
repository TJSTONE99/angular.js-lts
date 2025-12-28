'use strict';

describe('$exceptionHandler', () => {
  /* global ngInternals.$ExceptionHandlerProvider:false */
  it('should log errors with single argument', () => {
    angular.mock.module($provide => {
      $provide.provider('$exceptionHandler', ngInternals.$ExceptionHandlerProvider);
    });
    angular.mock.inject(($log, $exceptionHandler) => {
      $exceptionHandler('myError');
      expect($log.error.logs.shift()).toEqual(['myError']);
    });
  });


  it('should log errors with multiple arguments', () => {
    angular.mock.module($provide => {
      $provide.provider('$exceptionHandler', ngInternals.$ExceptionHandlerProvider);
    });
    angular.mock.inject(($log, $exceptionHandler) => {
      $exceptionHandler('myError', 'comment');
      expect($log.error.logs.shift()).toEqual(['myError', 'comment']);
    });
  });
});
