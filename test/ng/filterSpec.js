'use strict';

describe('$filter', () => {
  let $filterProvider, $filter;

  beforeEach(angular.mock.module(_$filterProvider_ => {
    $filterProvider = _$filterProvider_;
  }));

  beforeEach(angular.mock.inject(_$filter_ => {
    $filter = _$filter_;
  }));

  describe('provider', () => {
    it('should allow registration of filters', () => {
      const FooFilter = () => {
        return () => { return 'foo'; };
      };

      $filterProvider.register('foo', FooFilter);

      const fooFilter = $filter('foo');
      expect(fooFilter()).toBe('foo');
    });

    it('should allow registration of a map of filters', () => {
      const FooFilter = () => {
        return () => { return 'foo'; };
      };

      const BarFilter = () => {
        return () => { return 'bar'; };
      };

      $filterProvider.register({
        'foo': FooFilter,
        'bar': BarFilter
      });

      const fooFilter = $filter('foo');
      expect(fooFilter()).toBe('foo');

      const barFilter = $filter('bar');
      expect(barFilter()).toBe('bar');
    });
  });
});
