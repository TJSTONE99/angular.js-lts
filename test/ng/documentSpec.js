'use strict';

describe('$document', () => {


  it('should inject $document', angular.mock.inject($document => {
    expect($document).toEqual(angular.element(window.document));
  }));


  it('should be able to mock $document object', () => {
    angular.mock.module({ $document: {} });
    angular.mock.inject(($httpBackend, $http) => {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });


  it('should be able to mock $document array', () => {
    angular.mock.module({ $document: [{}] });
    angular.mock.inject(($httpBackend, $http) => {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });
});


describe('$$isDocumentHidden', () => {
  it('should listen on the visibilitychange event', () => {
    let doc;

    const spy = jest.spyOn(window.document, 'addEventListener');

    angular.mock.inject(($$isDocumentHidden, $document) => {
      expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBe('visibilitychange');
      expect(spy.mock.calls[spy.mock.calls.length - 1][1]).toEqual(expect.any(Function));
      expect($$isDocumentHidden()).toBeFalsy(); // undefined in browsers that don't support visibility
    });

  });

  it('should remove the listener when the $rootScope is destroyed', () => {
    const spy = jest.spyOn(window.document, 'removeEventListener');

    angular.mock.inject(($$isDocumentHidden, $rootScope) => {
      $rootScope.$destroy();
      expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBe('visibilitychange');
      expect(spy.mock.calls[spy.mock.calls.length - 1][1]).toEqual(expect.any(Function));
    });
  });
});
