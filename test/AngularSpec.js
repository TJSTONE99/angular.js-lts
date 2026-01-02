'use strict';

// Lots of typed array globals are used in this file and ESLint is
// not smart enough to understand the `typeof !== 'undefined'` guards.
/* globals Blob, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array,
Float32Array, Float64Array,  */

describe('angular', () => {
  let element, document;

  beforeEach(() => {
    document = window.document;
  });

  afterEach(() => {
    dealoc(element);
  });

  describe('copy', () => {
    it('should return same object', () => {
      const obj = {};
      const arr = [];
      expect(angular.copy({}, obj)).toBe(obj);
      expect(angular.copy([], arr)).toBe(arr);
    });

    it('should preserve prototype chaining', () => {
      const GrandParentProto = {};
      const ParentProto = Object.create(GrandParentProto);
      const obj = Object.create(ParentProto);
      expect(ParentProto.isPrototypeOf(angular.copy(obj))).toBe(true);
      expect(GrandParentProto.isPrototypeOf(angular.copy(obj))).toBe(true);
      const Foo = function () { };
      expect(angular.copy(new Foo()) instanceof Foo).toBe(true);
    });

    it('should copy Date', () => {
      const date = new Date(123);
      expect(angular.copy(date) instanceof Date).toBeTruthy();
      expect(angular.copy(date).getTime()).toEqual(123);
      expect(angular.copy(date) === date).toBeFalsy();
    });

    it('should copy RegExp', () => {
      const re = new RegExp('.*');
      expect(angular.copy(re) instanceof RegExp).toBeTruthy();
      expect(angular.copy(re).source).toBe('.*');
      expect(angular.copy(re) === re).toBe(false);
    });

    it('should copy literal RegExp', () => {
      const re = /.*/;
      expect(angular.copy(re) instanceof RegExp).toBeTruthy();
      expect(angular.copy(re).source).toEqual('.*');
      expect(angular.copy(re) === re).toBeFalsy();
    });

    it('should copy RegExp with flags', () => {
      const re = new RegExp('.*', 'gim');
      expect(angular.copy(re).global).toBe(true);
      expect(angular.copy(re).ignoreCase).toBe(true);
      expect(angular.copy(re).multiline).toBe(true);
    });

    it('should copy RegExp with lastIndex', () => {
      const re = /a+b+/g;
      const str = 'ab aabb';
      expect(re.exec(str)[0]).toEqual('ab');
      expect(angular.copy(re).exec(str)[0]).toEqual('aabb');
    });

    it('should deeply copy literal RegExp', () => {
      const objWithRegExp = {
        re: /.*/
      };
      expect(angular.copy(objWithRegExp).re instanceof RegExp).toBeTruthy();
      expect(angular.copy(objWithRegExp).re.source).toEqual('.*');
      expect(angular.copy(objWithRegExp.re) === objWithRegExp.re).toBeFalsy();
    });

    it('should copy a Uint8Array with no destination', () => {
      if (typeof Uint8Array !== 'undefined') {
        const src = new Uint8Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint8Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Uint8ClampedArray with no destination', () => {
      if (typeof Uint8ClampedArray !== 'undefined') {
        const src = new Uint8ClampedArray(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint8ClampedArray).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Uint16Array with no destination', () => {
      if (typeof Uint16Array !== 'undefined') {
        const src = new Uint16Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint16Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Uint32Array with no destination', () => {
      if (typeof Uint32Array !== 'undefined') {
        const src = new Uint32Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Uint32Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Int8Array with no destination', () => {
      if (typeof Int8Array !== 'undefined') {
        const src = new Int8Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Int8Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Int16Array with no destination', () => {
      if (typeof Int16Array !== 'undefined') {
        const src = new Int16Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Int16Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Int32Array with no destination', () => {
      if (typeof Int32Array !== 'undefined') {
        const src = new Int32Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Int32Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Float32Array with no destination', () => {
      if (typeof Float32Array !== 'undefined') {
        const src = new Float32Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Float32Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy a Float64Array with no destination', () => {
      if (typeof Float64Array !== 'undefined') {
        const src = new Float64Array(2);
        src[1] = 1;
        const dst = angular.copy(src);
        expect(angular.copy(src) instanceof Float64Array).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should copy an ArrayBuffer with no destination', () => {
      if (typeof ArrayBuffer !== 'undefined') {
        const src = new ArrayBuffer(8);
        new Int32Array(src).set([1, 2]);

        const dst = angular.copy(src);
        expect(dst instanceof ArrayBuffer).toBeTruthy();
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
      }
    });

    it('should handle ArrayBuffer objects with multiple references', () => {
      if (typeof ArrayBuffer !== 'undefined') {
        const buffer = new ArrayBuffer(8);
        const src = [new Int32Array(buffer), new Float32Array(buffer)];
        src[0].set([1, 2]);

        const dst = angular.copy(src);
        expect(dst).toEqual(src);
        expect(dst[0]).not.toBe(src[0]);
        expect(dst[1]).not.toBe(src[1]);
        expect(dst[0].buffer).toBe(dst[1].buffer);
        expect(dst[0].buffer).not.toBe(buffer);
      }
    });

    it('should handle Int32Array objects with multiple references', () => {
      if (typeof Int32Array !== 'undefined') {
        const arr = new Int32Array(2);
        const src = [arr, arr];
        arr.set([1, 2]);

        const dst = angular.copy(src);
        expect(dst).toEqual(src);
        expect(dst).not.toBe(src);
        expect(dst[0]).not.toBe(src[0]);
        expect(dst[0]).toBe(dst[1]);
        expect(dst[0].buffer).toBe(dst[1].buffer);
      }
    });

    it('should handle Blob objects', () => {
      if (typeof Blob !== 'undefined') {
        const src = new Blob(['foo'], { type: 'bar' });
        const dst = angular.copy(src);

        expect(dst).not.toBe(src);
        expect(dst.size).toBe(3);
        expect(dst.type).toBe('bar');
        expect(angular.isBlob(dst)).toBe(true);
      }
    });

    it('should handle Uint16Array subarray', () => {
      if (typeof Uint16Array !== 'undefined') {
        const arr = new Uint16Array(4);
        arr[1] = 1;
        const src = arr.subarray(1, 2);
        const dst = angular.copy(src);
        expect(dst instanceof Uint16Array).toBeTruthy();
        expect(dst.length).toEqual(1);
        expect(dst[0]).toEqual(1);
        expect(dst).not.toBe(src);
        expect(dst.buffer).not.toBe(src.buffer);
      }
    });

    it('should throw an exception if a Uint8Array is the destination', () => {
      if (typeof Uint8Array !== 'undefined') {
        const src = new Uint8Array();
        const dst = new Uint8Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Uint8ClampedArray is the destination', () => {
      if (typeof Uint8ClampedArray !== 'undefined') {
        const src = new Uint8ClampedArray();
        const dst = new Uint8ClampedArray(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Uint16Array is the destination', () => {
      if (typeof Uint16Array !== 'undefined') {
        const src = new Uint16Array();
        const dst = new Uint16Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Uint32Array is the destination', () => {
      if (typeof Uint32Array !== 'undefined') {
        const src = new Uint32Array();
        const dst = new Uint32Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Int8Array is the destination', () => {
      if (typeof Int8Array !== 'undefined') {
        const src = new Int8Array();
        const dst = new Int8Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Int16Array is the destination', () => {
      if (typeof Int16Array !== 'undefined') {
        const src = new Int16Array();
        const dst = new Int16Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Int32Array is the destination', () => {
      if (typeof Int32Array !== 'undefined') {
        const src = new Int32Array();
        const dst = new Int32Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Float32Array is the destination', () => {
      if (typeof Float32Array !== 'undefined') {
        const src = new Float32Array();
        const dst = new Float32Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if a Float64Array is the destination', () => {
      if (typeof Float64Array !== 'undefined') {
        const src = new Float64Array();
        const dst = new Float64Array(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should throw an exception if an ArrayBuffer is the destination', () => {
      if (typeof ArrayBuffer !== 'undefined') {
        const src = new ArrayBuffer(5);
        const dst = new ArrayBuffer(5);
        expect(() => { angular.copy(src, dst); })
          .toThrowMinErr('ng', 'cpta', 'Can\'t copy! TypedArray destination cannot be mutated.');
      }
    });

    it('should deeply copy an array into an existing array', () => {
      const src = [1, { name: 'value' }];
      const dst = [{ key: 'v' }];
      expect(angular.copy(src, dst)).toBe(dst);
      expect(dst).toEqual([1, { name: 'value' }]);
      expect(dst[1]).toEqual({ name: 'value' });
      expect(dst[1]).not.toBe(src[1]);
    });

    it('should deeply copy an array into a new array', () => {
      const src = [1, { name: 'value' }];
      const dst = angular.copy(src);
      expect(src).toEqual([1, { name: 'value' }]);
      expect(dst).toEqual(src);
      expect(dst).not.toBe(src);
      expect(dst[1]).not.toBe(src[1]);
    });

    it('should copy empty array', () => {
      const src = [];
      const dst = [{ key: 'v' }];
      expect(angular.copy(src, dst)).toEqual([]);
      expect(dst).toEqual([]);
    });

    it('should deeply copy an object into an existing object', () => {
      const src = { a: { name: 'value' } };
      const dst = { b: { key: 'v' } };
      expect(angular.copy(src, dst)).toBe(dst);
      expect(dst).toEqual({ a: { name: 'value' } });
      expect(dst.a).toEqual(src.a);
      expect(dst.a).not.toBe(src.a);
    });

    it('should deeply copy an object into a non-existing object', () => {
      const src = { a: { name: 'value' } };
      const dst = angular.copy(src, undefined);
      expect(src).toEqual({ a: { name: 'value' } });
      expect(dst).toEqual(src);
      expect(dst).not.toBe(src);
      expect(dst.a).toEqual(src.a);
      expect(dst.a).not.toBe(src.a);
    });

    it('should copy primitives', () => {
      expect(angular.copy(null)).toEqual(null);
      expect(angular.copy('')).toBe('');
      expect(angular.copy('lala')).toBe('lala');
      expect(angular.copy(123)).toEqual(123);
      expect(angular.copy([{ key: null }])).toEqual([{ key: null }]);
    });

    it('should throw an exception if a Scope is being copied', angular.mock.inject($rootScope => {
      expect(() => { angular.copy($rootScope.$new()); }).
        toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(() => { angular.copy({ child: $rootScope.$new() }, {}); }).
        toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(() => { angular.copy([$rootScope.$new()]); }).
        toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
    }));

    it('should throw an exception if a Window is being copied', () => {
      expect(() => { angular.copy(window); }).
        toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(() => { angular.copy({ child: window }); }).
        toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
      expect(() => { angular.copy([window], []); }).
        toThrowMinErr('ng', 'cpws', 'Can\'t copy! Making copies of Window or Scope instances is not supported.');
    });

    it('should throw an exception when source and destination are equivalent', () => {
      let src, dst;
      src = dst = { key: 'value' };
      expect(() => { angular.copy(src, dst); }).toThrowMinErr('ng', 'cpi', 'Can\'t copy! Source and destination are identical.');
      src = dst = [2, 4];
      expect(() => { angular.copy(src, dst); }).toThrowMinErr('ng', 'cpi', 'Can\'t copy! Source and destination are identical.');
    });

    it('should not copy the private $$hashKey', () => {
      let src, dst;
      src = {};
      ngInternals.hashKey(src);
      dst = angular.copy(src);
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));

      src = { foo: {} };
      ngInternals.hashKey(src.foo);
      dst = angular.copy(src);
      expect(ngInternals.hashKey(src.foo)).not.toEqual(ngInternals.hashKey(dst.foo));
    });

    it('should retain the previous $$hashKey when copying object with hashKey', () => {
      let src, dst, h;
      src = {};
      dst = {};
      // force creation of a hashkey
      h = ngInternals.hashKey(dst);
      ngInternals.hashKey(src);
      dst = angular.copy(src, dst);

      // make sure we don't copy the key
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));
      // make sure we retain the old key
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });

    it('should retain the previous $$hashKey when copying non-object', () => {
      const dst = {};
      const h = ngInternals.hashKey(dst);

      angular.copy(null, dst);
      expect(ngInternals.hashKey(dst)).toEqual(h);

      angular.copy(42, dst);
      expect(ngInternals.hashKey(dst)).toEqual(h);

      angular.copy(new Date(), dst);
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });

    it('should handle circular references', () => {
      const a = { b: { a: null }, self: null, selfs: [null, null, [null]] };
      a.b.a = a;
      a.self = a;
      a.selfs = [a, a.b, [a]];

      let aCopy = angular.copy(a, null);
      expect(aCopy).toEqual(a);

      expect(aCopy).not.toBe(a);
      expect(aCopy).toBe(aCopy.self);
      expect(aCopy).toBe(aCopy.selfs[2][0]);
      expect(aCopy.selfs[2]).not.toBe(a.selfs[2]);

      const copyTo = [];
      aCopy = angular.copy(a, copyTo);
      expect(aCopy).toBe(copyTo);
      expect(aCopy).not.toBe(a);
      expect(aCopy).toBe(aCopy.self);
    });

    it('should deeply copy XML nodes', () => {
      const anElement = document.createElement('foo');
      anElement.appendChild(document.createElement('bar'));
      const theCopy = anElement.cloneNode(true);
      expect(angular.copy(anElement).outerHTML).toEqual(theCopy.outerHTML);
      expect(angular.copy(anElement)).not.toBe(anElement);
    });

    it('should not try to call a non-function called `cloneNode`', () => {
      expect(angular.copy.bind(null, { cloneNode: 100 })).not.toThrow();
    });

    it('should handle objects with multiple references', () => {
      const b = {};
      const a = [b, -1, b];

      let aCopy = angular.copy(a);
      expect(aCopy[0]).not.toBe(a[0]);
      expect(aCopy[0]).toBe(aCopy[2]);

      const copyTo = [];
      aCopy = angular.copy(a, copyTo);
      expect(aCopy).toBe(copyTo);
      expect(aCopy[0]).not.toBe(a[0]);
      expect(aCopy[0]).toBe(aCopy[2]);
    });

    it('should handle date/regex objects with multiple references', () => {
      const re = /foo/;
      const d = new Date();
      const o = { re: re, re2: re, d: d, d2: d };

      let oCopy = angular.copy(o);
      expect(oCopy.re).toBe(oCopy.re2);
      expect(oCopy.d).toBe(oCopy.d2);

      oCopy = angular.copy(o, {});
      expect(oCopy.re).toBe(oCopy.re2);
      expect(oCopy.d).toBe(oCopy.d2);
    });

    it('should clear destination arrays correctly when source is non-array', () => {
      expect(angular.copy(null, [1, 2, 3])).toEqual([]);
      expect(angular.copy(undefined, [1, 2, 3])).toEqual([]);
      expect(angular.copy({ 0: 1, 1: 2 }, [1, 2, 3])).toEqual([1, 2]);
      expect(angular.copy(new Date(), [1, 2, 3])).toEqual([]);
      expect(angular.copy(/a/, [1, 2, 3])).toEqual([]);
      expect(angular.copy(true, [1, 2, 3])).toEqual([]);
    });

    it('should clear destination objects correctly when source is non-array', () => {
      expect(angular.copy(null, { 0: 1, 1: 2, 2: 3 })).toEqual({});
      expect(angular.copy(undefined, { 0: 1, 1: 2, 2: 3 })).toEqual({});
      expect(angular.copy(new Date(), { 0: 1, 1: 2, 2: 3 })).toEqual({});
      expect(angular.copy(/a/, { 0: 1, 1: 2, 2: 3 })).toEqual({});
      expect(angular.copy(true, { 0: 1, 1: 2, 2: 3 })).toEqual({});
    });

    it('should copy objects with no prototype parent', () => {
      const obj = angular.extend(Object.create(null), {
        a: 1,
        b: 2,
        c: 3
      });
      const dest = angular.copy(obj);

      expect(Object.getPrototypeOf(dest)).toBe(null);
      expect(dest.a).toBe(1);
      expect(dest.b).toBe(2);
      expect(dest.c).toBe(3);
      expect(Object.keys(dest)).toEqual(['a', 'b', 'c']);
    });

    it('should copy String() objects', () => {
      // eslint-disable-next-line no-new-wrappers
      const obj = new String('foo');
      const dest = angular.copy(obj);
      expect(dest).not.toBe(obj);
      expect(angular.isObject(dest)).toBe(true);
      expect(dest.valueOf()).toBe(obj.valueOf());
    });

    it('should copy Boolean() objects', () => {
      // eslint-disable-next-line no-new-wrappers
      const obj = new Boolean(true);
      const dest = angular.copy(obj);
      expect(dest).not.toBe(obj);
      expect(angular.isObject(dest)).toBe(true);
      expect(dest.valueOf()).toBe(obj.valueOf());
    });

    it('should copy Number() objects', () => {
      // eslint-disable-next-line no-new-wrappers
      const obj = new Number(42);
      const dest = angular.copy(obj);
      expect(dest).not.toBe(obj);
      expect(angular.isObject(dest)).toBe(true);
      expect(dest.valueOf()).toBe(obj.valueOf());
    });

    it('should copy falsy String/Boolean/Number objects', () => {
      /* eslint-disable no-new-wrappers */
      expect(angular.copy(new String('')).valueOf()).toBe('');
      expect(angular.copy(new Boolean(false)).valueOf()).toBe(false);
      expect(angular.copy(new Number(0)).valueOf()).toBe(0);
      expect(angular.copy(new Number(NaN)).valueOf()).toBeNaN();
      /* eslint-enable */
    });

    it('should copy source until reaching a given max depth', () => {
      const source = { a1: 1, b1: { b2: { b3: 1 } }, c1: [1, { c2: 1 }], d1: { d2: 1 } };
      let dest;

      dest = angular.copy(source, {}, 1);
      expect(dest).toEqual({ a1: 1, b1: '...', c1: '...', d1: '...' });

      dest = angular.copy(source, {}, 2);
      expect(dest).toEqual({ a1: 1, b1: { b2: '...' }, c1: [1, '...'], d1: { d2: 1 } });

      dest = angular.copy(source, {}, 3);
      expect(dest).toEqual({ a1: 1, b1: { b2: { b3: 1 } }, c1: [1, { c2: 1 }], d1: { d2: 1 } });

      dest = angular.copy(source, {}, 4);
      expect(dest).toEqual({ a1: 1, b1: { b2: { b3: 1 } }, c1: [1, { c2: 1 }], d1: { d2: 1 } });
    });

    they('should copy source and ignore max depth when maxDepth = $prop',
      [NaN, null, undefined, true, false, -1, 0], maxDepth => {
        const source = { a1: 1, b1: { b2: { b3: 1 } }, c1: [1, { c2: 1 }], d1: { d2: 1 } };
        const dest = angular.copy(source, {}, maxDepth);
        expect(dest).toEqual({ a1: 1, b1: { b2: { b3: 1 } }, c1: [1, { c2: 1 }], d1: { d2: 1 } });
      }
    );
  });

  describe('extend', () => {

    it('should not copy the private $$hashKey', () => {
      let src, dst;
      src = {};
      dst = {};
      ngInternals.hashKey(src);
      dst = angular.extend(dst, src);
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));
    });


    it('should copy the properties of the source object onto the destination object', () => {
      let destination, source;
      destination = {};
      source = { foo: true };
      destination = angular.extend(destination, source);
      expect(angular.isDefined(destination.foo)).toBe(true);
    });


    it('ISSUE #4751 - should copy the length property of an object source to the destination object', () => {
      let destination, source;
      destination = {};
      source = { radius: 30, length: 0 };
      destination = angular.extend(destination, source);
      expect(angular.isDefined(destination.length)).toBe(true);
      expect(angular.isDefined(destination.radius)).toBe(true);
    });

    it('should retain the previous $$hashKey', () => {
      let src, dst, h;
      src = {};
      dst = {};
      h = ngInternals.hashKey(dst);
      ngInternals.hashKey(src);
      dst = angular.extend(dst, src);
      // make sure we don't copy the key
      expect(ngInternals.hashKey(dst)).not.toEqual(ngInternals.hashKey(src));
      // make sure we retain the old key
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });


    it('should work when extending with itself', () => {
      let src, dst, h;
      dst = src = {};
      h = ngInternals.hashKey(dst);
      dst = angular.extend(dst, src);
      // make sure we retain the old key
      expect(ngInternals.hashKey(dst)).toEqual(h);
    });


    it('should copy dates by reference', () => {
      const src = { date: new Date() };
      const dst = {};

      angular.extend(dst, src);

      expect(dst.date).toBe(src.date);
    });

    it('should copy elements by reference', () => {
      const src = {
        element: document.createElement('div'),
        jqObject: angular.element('<p><span>s1</span><span>s2</span></p>').find('span')
      };
      const dst = {};

      angular.extend(dst, src);

      expect(dst.element).toBe(src.element);
      expect(dst.jqObject).toBe(src.jqObject);
    });
  });


  describe('merge', () => {
    it('should recursively copy objects into dst from left to right', () => {
      const dst = { foo: { bar: 'foobar' } };
      const src1 = { foo: { bazz: 'foobazz' } };
      const src2 = { foo: { bozz: 'foobozz' } };
      angular.merge(dst, src1, src2);
      expect(dst).toEqual({
        foo: {
          bar: 'foobar',
          bazz: 'foobazz',
          bozz: 'foobozz'
        }
      });
    });


    it('should replace primitives with objects', () => {
      const dst = { foo: 'bloop' };
      const src = { foo: { bar: { baz: 'bloop' } } };
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: {
          bar: {
            baz: 'bloop'
          }
        }
      });
    });


    it('should replace null values in destination with objects', () => {
      const dst = { foo: null };
      const src = { foo: { bar: { baz: 'bloop' } } };
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: {
          bar: {
            baz: 'bloop'
          }
        }
      });
    });


    it('should copy references to functions by value rather than merging', () => {
      function fn() { }
      const dst = { foo: 1 };
      const src = { foo: fn };
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: fn
      });
    });


    it('should create a new array if destination property is a non-object and source property is an array', () => {
      const dst = { foo: NaN };
      const src = { foo: [1, 2, 3] };
      angular.merge(dst, src);
      expect(dst).toEqual({
        foo: [1, 2, 3]
      });
      expect(dst.foo).not.toBe(src.foo);
    });


    it('should copy dates by value', () => {
      const src = { date: new Date() };
      const dst = {};

      angular.merge(dst, src);

      expect(dst.date).not.toBe(src.date);
      expect(angular.isDate(dst.date)).toBeTruthy();
      expect(dst.date.valueOf()).toEqual(src.date.valueOf());
    });

    it('should copy regexp by value', () => {
      const src = { regexp: /blah/ };
      const dst = {};

      angular.merge(dst, src);

      expect(dst.regexp).not.toBe(src.regexp);
      expect(angular.isRegExp(dst.regexp)).toBe(true);
      expect(dst.regexp.toString()).toBe(src.regexp.toString());
    });


    it('should angular.copy(clone) elements', () => {
      const src = {
        element: document.createElement('div'),
        jqObject: angular.element('<p><span>s1</span><span>s2</span></p>').find('span')
      };
      const dst = {};

      angular.merge(dst, src);

      expect(dst.element).not.toBe(src.element);
      expect(dst.jqObject).not.toBe(src.jqObject);

      expect(angular.isElement(dst.element)).toBeTruthy();
      expect(dst.element.nodeName).toBeDefined(); // i.e it is a DOM element
      expect(angular.isElement(dst.jqObject)).toBeTruthy();
      expect(dst.jqObject.nodeName).toBeUndefined(); // i.e it is a jqLite/jQuery object
    });

    it('should not merge the __proto__ property', () => {
      const src = JSON.parse('{ "__proto__": { "xxx": "polluted" } }');
      const dst = {};

      angular.merge(dst, src);

      if (typeof dst.__proto__ !== 'undefined') { // eslint-disable-line
        // Should not overwrite the __proto__ property or pollute the Object prototype
        expect(dst.__proto__).toBe(Object.prototype); // eslint-disable-line
      }
      expect(({}).xxx).toBeUndefined();
    });
  });


  describe('shallow copy', () => {
    it('should make a copy', () => {
      const original = { key: {} };
      const copy = angular.shallowCopy(original);
      expect(copy).toEqual(original);
      expect(copy.key).toBe(original.key);
    });

    it('should omit "$$"-prefixed properties', () => {
      const original = { $$some: true, $$: true };
      const clone = {};

      expect(angular.shallowCopy(original, clone)).toBe(clone);
      expect(clone.$$some).toBeUndefined();
      expect(clone.$$).toBeUndefined();
    });

    it('should copy "$"-prefixed properties from copy', () => {
      const original = { $some: true };
      const clone = {};

      expect(angular.shallowCopy(original, clone)).toBe(clone);
      expect(clone.$some).toBe(original.$some);
    });

    it('should handle arrays', () => {
      const original = [{}, 1], clone = [];

      const aCopy = angular.shallowCopy(original);
      expect(aCopy).not.toBe(original);
      expect(aCopy).toEqual(original);
      expect(aCopy[0]).toBe(original[0]);

      expect(angular.shallowCopy(original, clone)).toBe(clone);
      expect(clone).toEqual(original);
    });

    it('should handle primitives', () => {
      expect(angular.shallowCopy('test')).toBe('test');
      expect(angular.shallowCopy(3)).toBe(3);
      expect(angular.shallowCopy(true)).toBe(true);
    });
  });

  describe('elementHTML', () => {
    it('should dump element', () => {
      expect(angular.$$startingTag('<div attr="123">something<span></span></div>')).
        toEqual('<div attr="123">');
    });
  });

  describe('equals', () => {
    it('should return true if same object', () => {
      const o = {};
      expect(angular.equals(o, o)).toEqual(true);
      expect(angular.equals(o, {})).toEqual(true);
      expect(angular.equals(1, '1')).toEqual(false);
      expect(angular.equals(1, '2')).toEqual(false);
    });

    it('should recurse into object', () => {
      expect(angular.equals({}, {})).toEqual(true);
      expect(angular.equals({ name: 'misko' }, { name: 'misko' })).toEqual(true);
      expect(angular.equals({ name: 'misko', age: 1 }, { name: 'misko' })).toEqual(false);
      expect(angular.equals({ name: 'misko' }, { name: 'misko', age: 1 })).toEqual(false);
      expect(angular.equals({ name: 'misko' }, { name: 'adam' })).toEqual(false);
      expect(angular.equals(['misko'], ['misko'])).toEqual(true);
      expect(angular.equals(['misko'], ['adam'])).toEqual(false);
      expect(angular.equals(['misko'], ['misko', 'adam'])).toEqual(false);
    });

    it('should ignore undefined member variables during comparison', () => {
      const obj1 = { name: 'misko' }, obj2 = { name: 'misko', undefinedvar: undefined };

      expect(angular.equals(obj1, obj2)).toBe(true);
      expect(angular.equals(obj2, obj1)).toBe(true);
    });

    it('should ignore $ member variables', () => {
      expect(angular.equals({ name: 'misko', $id: 1 }, { name: 'misko', $id: 2 })).toEqual(true);
      expect(angular.equals({ name: 'misko' }, { name: 'misko', $id: 2 })).toEqual(true);
      expect(angular.equals({ name: 'misko', $id: 1 }, { name: 'misko' })).toEqual(true);
    });

    it('should ignore functions', () => {
      expect(angular.equals({ func: function () { } }, { bar: function () { } })).toEqual(true);
    });

    it('should work well with nulls', () => {
      expect(angular.equals(null, '123')).toBe(false);
      expect(angular.equals('123', null)).toBe(false);

      const obj = { foo: 'bar' };
      expect(angular.equals(null, obj)).toBe(false);
      expect(angular.equals(obj, null)).toBe(false);

      expect(angular.equals(null, null)).toBe(true);
    });

    it('should work well with undefined', () => {
      expect(angular.equals(undefined, '123')).toBe(false);
      expect(angular.equals('123', undefined)).toBe(false);

      const obj = { foo: 'bar' };
      expect(angular.equals(undefined, obj)).toBe(false);
      expect(angular.equals(obj, undefined)).toBe(false);

      expect(angular.equals(undefined, undefined)).toBe(true);
    });

    it('should treat two NaNs as equal', () => {
      expect(angular.equals(NaN, NaN)).toBe(true);
    });

    it('should compare Scope instances only by identity', angular.mock.inject($rootScope => {
      const scope1 = $rootScope.$new(), scope2 = $rootScope.$new();

      expect(angular.equals(scope1, scope1)).toBe(true);
      expect(angular.equals(scope1, scope2)).toBe(false);
      expect(angular.equals($rootScope, scope1)).toBe(false);
      expect(angular.equals(undefined, scope1)).toBe(false);
    }));

    it('should compare Window instances only by identity', () => {
      expect(angular.equals(window, window)).toBe(true);
      expect(angular.equals(window, window.parent)).toBe(true);
      expect(angular.equals(window, undefined)).toBe(false);
    });

    it('should compare dates', () => {
      expect(angular.equals(new Date(0), new Date(0))).toBe(true);
      expect(angular.equals(new Date(0), new Date(1))).toBe(false);
      expect(angular.equals(new Date(0), 0)).toBe(false);
      expect(angular.equals(0, new Date(0))).toBe(false);

      expect(angular.equals(new Date(undefined), new Date(undefined))).toBe(true);
      expect(angular.equals(new Date(undefined), new Date(0))).toBe(false);
      expect(angular.equals(new Date(undefined), new Date(null))).toBe(false);
      expect(angular.equals(new Date(undefined), new Date('wrong'))).toBe(true);
      expect(angular.equals(new Date(), /abc/)).toBe(false);
    });

    it('should correctly test for keys that are present on Object.prototype', () => {
      expect(angular.equals({}, { hasOwnProperty: 1 })).toBe(false);
      expect(angular.equals({}, { toString: null })).toBe(false);
    });

    it('should compare regular expressions', () => {
      expect(angular.equals(/abc/, /abc/)).toBe(true);
      expect(angular.equals(/abc/i, new RegExp('abc', 'i'))).toBe(true);
      expect(angular.equals(new RegExp('abc', 'i'), new RegExp('abc', 'i'))).toBe(true);
      expect(angular.equals(new RegExp('abc', 'i'), new RegExp('abc'))).toBe(false);
      expect(angular.equals(/abc/i, /abc/)).toBe(false);
      expect(angular.equals(/abc/, /def/)).toBe(false);
      expect(angular.equals(/^abc/, /abc/)).toBe(false);
      expect(angular.equals(/^abc/, '/^abc/')).toBe(false);
      expect(angular.equals(/abc/, new Date())).toBe(false);
    });

    it('should return false when comparing an object and an array', () => {
      expect(angular.equals({}, [])).toBe(false);
      expect(angular.equals([], {})).toBe(false);
    });

    it('should return false when comparing an object and a RegExp', () => {
      expect(angular.equals({}, /abc/)).toBe(false);
      expect(angular.equals({}, new RegExp('abc', 'i'))).toBe(false);
    });

    it('should return false when comparing an object and a Date', () => {
      expect(angular.equals({}, new Date())).toBe(false);
    });

    it('should safely compare objects with no prototype parent', () => {
      const o1 = angular.extend(Object.create(null), {
        a: 1, b: 2, c: 3
      });
      const o2 = angular.extend(Object.create(null), {
        a: 1, b: 2, c: 3
      });
      expect(angular.equals(o1, o2)).toBe(true);
      o2.c = 2;
      expect(angular.equals(o1, o2)).toBe(false);
    });


    it('should safely compare objects which shadow Object.prototype.hasOwnProperty', () => {
      const o1 = {
        hasOwnProperty: true,
        a: 1,
        b: 2,
        c: 3
      };
      const o2 = {
        hasOwnProperty: true,
        a: 1,
        b: 2,
        c: 3
      };
      expect(angular.equals(o1, o2)).toBe(true);
      o1.hasOwnProperty = () => { };
      expect(angular.equals(o1, o2)).toBe(false);
    });
  });


  describe('csp', () => {

    function mockCspElement(cspAttrName, cspAttrValue) {
      return jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[' + cspAttrName + ']') {
          const html = '<div ' + cspAttrName + (cspAttrValue ? ('="' + cspAttrValue + '" ') : '') + '></div>';
          return angular.element(html)[0];
        }
      });

    }

    const originalPrototype = window.Function.prototype;

    beforeEach(() => {
      jest.spyOn(window, 'Function');
      // Jasmine 2.7+ doesn't support spying on Function, so we have restore the prototype
      // as Jasmine will use Function internally
      window.Function.prototype = originalPrototype;
    });

    afterEach(() => {
      jest.restoreAllMocks();
      delete angular.$$csp.rules;
    });


    it('should return the false for all rules when CSP is not enabled (the default)', () => {
      expect(angular.$$csp()).toEqual({ noUnsafeEval: false });
    });


    it('should return true for noUnsafeEval if eval causes a CSP security policy error', () => {
      window.Function.mockImplementation(() => { throw new Error('CSP test'); });
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(window.Function).toHaveBeenCalledWith('');
    });


    it('should return true for all rules when CSP is enabled manually via empty `ng-csp` attribute', () => {
      const spy = mockCspElement('ng-csp');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });


    it('should return true when CSP is enabled manually via [data-ng-csp]', () => {
      const spy = mockCspElement('data-ng-csp');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[data-ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });


    it('should return true for noUnsafeEval if it is specified in the `ng-csp` attribute value', () => {
      const spy = mockCspElement('ng-csp', 'no-unsafe-eval');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });


    it('should return true for all styles if they are all specified in the `ng-csp` attribute value', () => {
      const spy = mockCspElement('ng-csp', 'no-inline-style;no-unsafe-eval');
      expect(angular.$$csp()).toEqual({ noUnsafeEval: true });
      expect(spy).toHaveBeenCalledWith('[ng-csp]');
      expect(window.Function).not.toHaveBeenCalled();
    });
  });


  describe('jq', () => {
    let element;

    beforeEach(() => {
      element = document.createElement('html');
    });

    afterEach(() => {
      delete jq.name_;
    });

    it('should return undefined when jq is not set, no jQuery found (the default)', () => {
      expect(jq()).toBeUndefined();
    });

    it('should return empty string when jq is enabled manually via [ng-jq] with empty string', () => {
      element.setAttribute('ng-jq', '');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[ng-jq]') return element;
      });
      expect(jq()).toBe('');
    });

    it('should return empty string when jq is enabled manually via [data-ng-jq] with empty string', () => {
      element.setAttribute('data-ng-jq', '');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[data-ng-jq]') return element;
      });
      expect(jq()).toBe('');
      expect(document.querySelector).toHaveBeenCalledWith('[data-ng-jq]');
    });

    it('should return empty string when jq is enabled manually via [x-ng-jq] with empty string', () => {
      element.setAttribute('x-ng-jq', '');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[x-ng-jq]') return element;
      });
      expect(jq()).toBe('');
      expect(document.querySelector).toHaveBeenCalledWith('[x-ng-jq]');
    });

    it('should return empty string when jq is enabled manually via [ng:jq] with empty string', () => {
      element.setAttribute('ng:jq', '');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[ng\\:jq]') return element;
      });
      expect(jq()).toBe('');
      expect(document.querySelector).toHaveBeenCalledWith('[ng\\:jq]');
    });

    it('should return "jQuery" when jq is enabled manually via [ng-jq] with value "jQuery"', () => {
      element.setAttribute('ng-jq', 'jQuery');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[ng-jq]') return element;
      });
      expect(jq()).toBe('jQuery');
      expect(document.querySelector).toHaveBeenCalledWith('[ng-jq]');
    });

    it('should return "jQuery" when jq is enabled manually via [data-ng-jq] with value "jQuery"', () => {
      element.setAttribute('data-ng-jq', 'jQuery');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[data-ng-jq]') return element;
      });
      expect(jq()).toBe('jQuery');
      expect(document.querySelector).toHaveBeenCalledWith('[data-ng-jq]');
    });

    it('should return "jQuery" when jq is enabled manually via [x-ng-jq] with value "jQuery"', () => {
      element.setAttribute('x-ng-jq', 'jQuery');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[x-ng-jq]') return element;
      });
      expect(jq()).toBe('jQuery');
      expect(document.querySelector).toHaveBeenCalledWith('[x-ng-jq]');
    });

    it('should return "jQuery" when jq is enabled manually via [ng:jq] with value "jQuery"', () => {
      element.setAttribute('ng:jq', 'jQuery');
      jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[ng\\:jq]') return element;
      });
      expect(jq()).toBe('jQuery');
      expect(document.querySelector).toHaveBeenCalledWith('[ng\\:jq]');
    });
  });


  describe('parseKeyValue', () => {
    it('should parse a string into key-value pairs', () => {
      expect(ngInternals.parseKeyValue('')).toEqual({});
      expect(ngInternals.parseKeyValue('simple=pair')).toEqual({ simple: 'pair' });
      expect(ngInternals.parseKeyValue('first=1&second=2')).toEqual({ first: '1', second: '2' });
      expect(ngInternals.parseKeyValue('escaped%20key=escaped%20value')).
        toEqual({ 'escaped key': 'escaped value' });
      expect(ngInternals.parseKeyValue('emptyKey=')).toEqual({ emptyKey: '' });
      expect(ngInternals.parseKeyValue('flag1&key=value&flag2')).
        toEqual({ flag1: true, key: 'value', flag2: true });
    });
    it('should ignore key values that are not valid URI components', () => {
      expect(() => { ngInternals.parseKeyValue('%'); }).not.toThrow();
      expect(ngInternals.parseKeyValue('%')).toEqual({});
      expect(ngInternals.parseKeyValue('invalid=%')).toEqual({ invalid: undefined });
      expect(ngInternals.parseKeyValue('invalid=%&valid=good')).toEqual({ invalid: undefined, valid: 'good' });
    });
    it('should parse a string into key-value pairs with duplicates grouped in an array', () => {
      expect(ngInternals.parseKeyValue('')).toEqual({});
      expect(ngInternals.parseKeyValue('duplicate=pair')).toEqual({ duplicate: 'pair' });
      expect(ngInternals.parseKeyValue('first=1&first=2')).toEqual({ first: ['1', '2'] });
      expect(ngInternals.parseKeyValue('escaped%20key=escaped%20value&&escaped%20key=escaped%20value2')).
        toEqual({ 'escaped key': ['escaped value', 'escaped value2'] });
      expect(ngInternals.parseKeyValue('flag1&key=value&flag1')).
        toEqual({ flag1: [true, true], key: 'value' });
      expect(ngInternals.parseKeyValue('flag1&flag1=value&flag1=value2&flag1')).
        toEqual({ flag1: [true, 'value', 'value2', true] });
    });


    it('should ignore properties higher in the prototype chain', () => {
      expect(ngInternals.parseKeyValue('toString=123')).toEqual({
        'toString': '123'
      });
    });

    it('should ignore badly escaped = characters', () => {
      expect(ngInternals.parseKeyValue('test=a=b')).toEqual({
        'test': 'a=b'
      });
    });
  });

  describe('toKeyValue', () => {
    it('should serialize key-value pairs into string', () => {
      expect(ngInternals.toKeyValue({})).toEqual('');
      expect(ngInternals.toKeyValue({ simple: 'pair' })).toEqual('simple=pair');
      expect(ngInternals.toKeyValue({ first: '1', second: '2' })).toEqual('first=1&second=2');
      expect(ngInternals.toKeyValue({ 'escaped key': 'escaped value' })).
        toEqual('escaped%20key=escaped%20value');
      expect(ngInternals.toKeyValue({ emptyKey: '' })).toEqual('emptyKey=');
    });

    it('should serialize true values into flags', () => {
      expect(ngInternals.toKeyValue({ flag1: true, key: 'value', flag2: true })).toEqual('flag1&key=value&flag2');
    });

    it('should serialize duplicates into duplicate param strings', () => {
      expect(ngInternals.toKeyValue({ key: [323, 'value', true] })).toEqual('key=323&key=value&key');
      expect(ngInternals.toKeyValue({ key: [323, 'value', true, 1234] })).
        toEqual('key=323&key=value&key&key=1234');
    });
  });

  describe('isArray', () => {

    it('should return true if passed an `Array`', () => {
      expect(angular.isArray([])).toBe(true);
    });

    it('should return true if passed an `Array` from a different window context', () => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);  // No `contentWindow` if not attached to the DOM.
      const arr = new iframe.contentWindow.Array();
      document.body.removeChild(iframe);  // Clean up.

      expect(arr instanceof Array).toBe(false);
      expect(angular.isArray(arr)).toBe(true);
    });

    it('should return true if passed an object prototypically inherited from `Array`', () => {
      function FooArray() { }
      FooArray.prototype = [];

      expect(angular.isArray(new FooArray())).toBe(true);
    });

    it('should return false if passed non-array objects', () => {
      expect(angular.isArray(document.body.childNodes)).toBe(false);
      expect(angular.isArray({ length: 0 })).toBe(false);
      expect(angular.isArray({ length: 2, 0: 'one', 1: 'two' })).toBe(false);
    });

  });

  describe('isArrayLike', () => {

    it('should return false if passed a number', () => {
      expect(ngInternals.isArrayLike(10)).toBe(false);
    });

    it('should return true if passed an array', () => {
      expect(ngInternals.isArrayLike([1, 2, 3, 4])).toBe(true);
    });

    it('should return true if passed an object', () => {
      expect(ngInternals.isArrayLike({ 0: 'test', 1: 'bob', 2: 'tree', length: 3 })).toBe(true);
    });

    it('should return true if passed arguments object', () => {
      function test(a, b, c) {
        expect(ngInternals.isArrayLike(arguments)).toBe(true);
      }
      test(1, 2, 3);
    });

    it('should return true if passed a nodelist', () => {
      const nodes1 = document.body.childNodes;
      expect(ngInternals.isArrayLike(nodes1)).toBe(true);

      const nodes2 = document.getElementsByTagName('nonExistingTagName');
      expect(ngInternals.isArrayLike(nodes2)).toBe(true);
    });

    it('should return false for objects with `length` but no matching indexable items', () => {
      const obj1 = {
        a: 'a',
        b: 'b',
        length: 10
      };
      expect(ngInternals.isArrayLike(obj1)).toBe(false);

      const obj2 = {
        length: 0
      };
      expect(ngInternals.isArrayLike(obj2)).toBe(false);
    });

    it('should return true for empty instances of an Array subclass', () => {
      function ArrayLike() { }
      ArrayLike.prototype = Array.prototype;

      const arrLike = new ArrayLike();
      expect(arrLike.length).toBe(0);
      expect(ngInternals.isArrayLike(arrLike)).toBe(true);

      arrLike.push(1, 2, 3);
      expect(arrLike.length).toBe(3);
      expect(ngInternals.isArrayLike(arrLike)).toBe(true);
    });
  });


  describe('forEach', () => {
    it('should iterate over *own* object properties', () => {
      function MyObj() {
        this.bar = 'barVal';
        this.baz = 'bazVal';
      }
      MyObj.prototype.foo = 'fooVal';

      const obj = new MyObj(), log = [];

      angular.forEach(obj, (value, key) => { log.push(key + ':' + value); });

      expect(log).toEqual(['bar:barVal', 'baz:bazVal']);
    });


    it('should not break if obj is an array we override hasOwnProperty', () => {
      const obj = [];
      obj[0] = 1;
      obj[1] = 2;
      obj.hasOwnProperty = null;
      const log = [];
      angular.forEach(obj, (value, key) => {
        log.push(key + ':' + value);
      });
      expect(log).toEqual(['0:1', '1:2']);
    });



    it('should handle JQLite and jQuery objects like arrays', () => {
      let jqObject = angular.element('<p><span>s1</span><span>s2</span></p>').find('span'), log = [];

      angular.forEach(jqObject, (value, key) => { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:s1', '1:s2']);

      log = [];
      jqObject = angular.element('<pane></pane>');
      angular.forEach(jqObject.children(), (value, key) => { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual([]);
    });


    it('should handle NodeList objects like arrays', () => {
      const nodeList = angular.element('<p><span>a</span><span>b</span><span>c</span></p>')[0].childNodes, log = [];


      angular.forEach(nodeList, (value, key) => { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:a', '1:b', '2:c']);
    });


    it('should handle HTMLCollection objects like arrays', () => {
      document.body.innerHTML = '<p>' +
        '<a name=\'x\'>a</a>' +
        '<a name=\'y\'>b</a>' +
        '<a name=\'x\'>c</a>' +
        '</p>';

      const htmlCollection = document.getElementsByName('x'), log = [];

      angular.forEach(htmlCollection, (value, key) => { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:a', '1:c']);
    });

    it('should handle arguments objects like arrays', () => {
      let args;
      const log = [];

      (function () { args = arguments; })('a', 'b', 'c');

      angular.forEach(args, (value, key) => { log.push(key + ':' + value); });
      expect(log).toEqual(['0:a', '1:b', '2:c']);
    });

    it('should handle string values like arrays', () => {
      const log = [];

      angular.forEach('bar', (value, key) => { log.push(key + ':' + value); });
      expect(log).toEqual(['0:b', '1:a', '2:r']);
    });


    it('should handle objects with length property as objects', () => {
      const obj = {
        'foo': 'bar',
        'length': 2
      },
        log = [];

      angular.forEach(obj, (value, key) => { log.push(key + ':' + value); });
      expect(log).toEqual(['foo:bar', 'length:2']);
    });


    it('should handle objects of custom types with length property as objects', () => {
      function CustomType() {
        this.length = 2;
        this.foo = 'bar';
      }

      const obj = new CustomType(), log = [];

      angular.forEach(obj, (value, key) => { log.push(key + ':' + value); });
      expect(log).toEqual(['length:2', 'foo:bar']);
    });


    it('should not invoke the iterator for indexed properties which are not present in the collection', () => {
      const log = [];
      const collection = [];
      collection[5] = 'SPARSE';
      angular.forEach(collection, (item, index) => {
        log.push(item + index);
      });
      expect(log.length).toBe(1);
      expect(log[0]).toBe('SPARSE5');
    });


    it('should safely iterate through objects with no prototype parent', () => {
      const obj = angular.extend(Object.create(null), {
        a: 1, b: 2, c: 3
      });
      const log = [];
      const self = {};
      angular.forEach(obj, function (val, key, collection) {
        expect(this).toBe(self);
        expect(collection).toBe(obj);
        log.push(key + '=' + val);
      }, self);
      expect(log.length).toBe(3);
      expect(log).toEqual(['a=1', 'b=2', 'c=3']);
    });


    it('should safely iterate through objects which shadow Object.prototype.hasOwnProperty', () => {
      const obj = {
        hasOwnProperty: true,
        a: 1,
        b: 2,
        c: 3
      };
      const log = [];
      const self = {};
      angular.forEach(obj, function (val, key, collection) {
        expect(this).toBe(self);
        expect(collection).toBe(obj);
        log.push(key + '=' + val);
      }, self);
      expect(log.length).toBe(4);
      expect(log).toEqual(['hasOwnProperty=true', 'a=1', 'b=2', 'c=3']);
    });


    describe('ES spec api compliance', () => {

      function testForEachSpec(expectedSize, collection) {
        const that = {};

        angular.forEach(collection, function (value, key, collectionArg) {
          expect(collectionArg).toBe(collection);
          expect(collectionArg[key]).toBe(value);

          expect(this).toBe(that);

          expectedSize--;
        }, that);

        expect(expectedSize).toBe(0);
      }


      it('should follow the ES spec when called with array', () => {
        testForEachSpec(2, [1, 2]);
      });


      it('should follow the ES spec when called with arguments', () => {
        testForEachSpec(2, (function () { return arguments; })(1, 2));
      });


      it('should follow the ES spec when called with string', () => {
        testForEachSpec(2, '12');
      });


      it('should follow the ES spec when called with jQuery/jqLite', () => {
        testForEachSpec(2, angular.element('<span>a</span><span>b</span>'));
      });


      it('should follow the ES spec when called with childNodes NodeList', () => {
        testForEachSpec(2, angular.element('<p><span>a</span><span>b</span></p>')[0].childNodes);
      });


      it('should follow the ES spec when called with getElementsByTagName HTMLCollection', () => {
        testForEachSpec(2, angular.element('<p><span>a</span><span>b</span></p>')[0].getElementsByTagName('*'));
      });


      it('should follow the ES spec when called with querySelectorAll HTMLCollection', () => {
        testForEachSpec(2, angular.element('<p><span>a</span><span>b</span></p>')[0].querySelectorAll('*'));
      });


      it('should follow the ES spec when called with JSON', () => {
        testForEachSpec(2, { a: 1, b: 2 });
      });


      it('should follow the ES spec when called with function', () => {
        function f() { }
        f.a = 1;
        f.b = 2;
        testForEachSpec(2, f);
      });
    });
  });


  describe('encodeUriSegment', () => {
    it('should correctly encode uri segment and not encode chars defined as pchar set in rfc3986',
      () => {
        //don't encode alphanum
        expect(ngInternals.encodeUriSegment('asdf1234asdf')).
          toEqual('asdf1234asdf');

        //don't encode unreserved'
        expect(ngInternals.encodeUriSegment('-_.!~*\'(); -_.!~*\'();')).
          toEqual('-_.!~*\'();%20-_.!~*\'();');

        //don't encode the rest of pchar'
        expect(ngInternals.encodeUriSegment(':@&=+$, :@&=+$,')).
          toEqual(':@&=+$,%20:@&=+$,');

        //encode '/' and ' ''
        expect(ngInternals.encodeUriSegment('/; /;')).
          toEqual('%2F;%20%2F;');
      });
  });


  describe('encodeUriQuery', () => {
    it('should correctly encode uri query and not encode chars defined as pchar set in rfc3986',
      () => {
        //don't encode alphanum
        expect(ngInternals.encodeUriQuery('asdf1234asdf')).
          toEqual('asdf1234asdf');

        //don't encode unreserved
        expect(ngInternals.encodeUriQuery('-_.!~*\'() -_.!~*\'()')).
          toEqual('-_.!~*\'()+-_.!~*\'()');

        //don't encode the rest of pchar
        expect(ngInternals.encodeUriQuery(':@$, :@$,')).
          toEqual(':@$,+:@$,');

        //encode '&', ';', '=', '+', and '#'
        expect(ngInternals.encodeUriQuery('&;=+# &;=+#')).
          toEqual('%26;%3D%2B%23+%26;%3D%2B%23');

        //encode ' ' as '+'
        expect(ngInternals.encodeUriQuery('  ')).
          toEqual('++');

        //encode ' ' as '%20' when a flag is used
        expect(ngInternals.encodeUriQuery('  ', true)).
          toEqual('%20%20');

        //do not encode `null` as '+' when flag is used
        expect(ngInternals.encodeUriQuery('null', true)).
          toEqual('null');

        //do not encode `null` with no flag
        expect(ngInternals.encodeUriQuery('null')).
          toEqual('null');
      });
  });

  describe('AngularJS service', () => {
    it('should override services', () => {
      angular.mock.module($provide => {
        $provide.value('fake', 'old');
        $provide.value('fake', 'new');
      });
      angular.mock.inject(fake => {
        expect(fake).toEqual('new');
      });
    });

    it('should inject dependencies specified by $inject and ignore function argument name', () => {
      expect(angular.injector([$provide => {
        $provide.factory('svc1', () => { return 'svc1'; });
        $provide.factory('svc2', ['svc1', s => { return 'svc2-' + s; }]);
      }]).get('svc2')).toEqual('svc2-svc1');
    });

  });


  describe('isDate', () => {
    it('should return true for Date object', () => {
      expect(angular.isDate(new Date())).toBe(true);
    });

    it('should return false for non Date objects', () => {
      expect(angular.isDate([])).toBe(false);
      expect(angular.isDate('')).toBe(false);
      expect(angular.isDate(23)).toBe(false);
      expect(angular.isDate({})).toBe(false);
    });
  });

  describe('isError', () => {
    function testErrorFromDifferentContext(createError) {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      try {
        const error = createError(iframe.contentWindow);
        expect(ngInternals.isError(error)).toBe(true);
      } finally {
        iframe.parentElement.removeChild(iframe);
      }
    }

    it('should not assume objects are errors', () => {
      const fakeError = { message: 'A fake error', stack: 'no stack here' };
      expect(ngInternals.isError(fakeError)).toBe(false);
    });

    it('should detect simple error instances', () => {
      expect(ngInternals.isError(new Error())).toBe(true);
    });

    it('should detect errors from another context', () => {
      testErrorFromDifferentContext(win => {
        return new win.Error();
      });
    });

    it('should detect DOMException errors from another context', () => {
      testErrorFromDifferentContext(win => {
        try {
          win.document.querySelectorAll('');
        } catch (e) {
          return e;
        }
      });
    });
  });

  describe('isRegExp', () => {
    it('should return true for RegExp object', () => {
      expect(angular.isRegExp(/^foobar$/)).toBe(true);
      expect(angular.isRegExp(new RegExp('^foobar$/'))).toBe(true);
    });

    it('should return false for non RegExp objects', () => {
      expect(angular.isRegExp([])).toBe(false);
      expect(angular.isRegExp('')).toBe(false);
      expect(angular.isRegExp(23)).toBe(false);
      expect(angular.isRegExp({})).toBe(false);
      expect(angular.isRegExp(new Date())).toBe(false);
    });
  });


  describe('isWindow', () => {
    it('should return true for the Window object', () => {
      expect(ngInternals.isWindow(window)).toBe(true);
    });

    it('should return false for any object that is not a Window', () => {
      expect(ngInternals.isWindow([])).toBe(false);
      expect(ngInternals.isWindow('')).toBeFalsy();
      expect(ngInternals.isWindow(23)).toBe(false);
      expect(ngInternals.isWindow({})).toBe(false);
      expect(ngInternals.isWindow(new Date())).toBe(false);
      expect(ngInternals.isWindow(document)).toBe(false);
    });
  });


  describe('compile', () => {
    it('should link to existing node and create scope', angular.mock.inject(($rootScope, $compile) => {
      const template = angular.element('<div>{{greeting = "hello world"}}</div>');
      element = $compile(template)($rootScope);
      $rootScope.$digest();
      expect(template.text()).toEqual('hello world');
      expect($rootScope.greeting).toEqual('hello world');
    }));

    it('should link to existing node and given scope', angular.mock.inject(($rootScope, $compile) => {
      const template = angular.element('<div>{{greeting = "hello world"}}</div>');
      element = $compile(template)($rootScope);
      $rootScope.$digest();
      expect(template.text()).toEqual('hello world');
    }));

    it('should link to new node and given scope', angular.mock.inject(($rootScope, $compile) => {
      const template = angular.element('<div>{{greeting = "hello world"}}</div>');

      const compile = $compile(template);
      let templateClone = template.clone();

      element = compile($rootScope, clone => {
        templateClone = clone;
      });
      $rootScope.$digest();

      expect(template.text()).toEqual('{{greeting = "hello world"}}');
      expect(element.text()).toEqual('hello world');
      expect(element).toEqual(templateClone);
      expect($rootScope.greeting).toEqual('hello world');
    }));

    it('should link to cloned node and create scope', angular.mock.inject(($rootScope, $compile) => {
      const template = angular.element('<div>{{greeting = "hello world"}}</div>');
      element = $compile(template)($rootScope, angular.noop);
      $rootScope.$digest();
      expect(template.text()).toEqual('{{greeting = "hello world"}}');
      expect(element.text()).toEqual('hello world');
      expect($rootScope.greeting).toEqual('hello world');
    }));
  });


  describe('nodeName_', () => {
    it('should correctly detect node name with "namespace" when xmlns is defined', () => {
      const div = angular.element('<div xmlns:ngtest="http://angularjs.org/">' +
        '<ngtest:foo ngtest:attr="bar"></ngtest:foo>' +
        '</div>')[0];
      expect(ngInternals.nodeName_(div.childNodes[0])).toBe('ngtest:foo');
      expect(div.childNodes[0].getAttribute('ngtest:attr')).toBe('bar');
    });

    it('should correctly detect node name with "namespace" when xmlns is NOT defined', () => {
      const div = angular.element('<div xmlns:ngtest="http://angularjs.org/">' +
        '<ngtest:foo ngtest:attr="bar"></ng-test>' +
        '</div>')[0];
      expect(ngInternals.nodeName_(div.childNodes[0])).toBe('ngtest:foo');
      expect(div.childNodes[0].getAttribute('ngtest:attr')).toBe('bar');
    });

    it('should return undefined for elements without the .nodeName property', () => {
      //some elements, like SVGElementInstance don't have .nodeName property
      expect(ngInternals.nodeName_({})).toBeUndefined();
    });
  });


  describe('nextUid()', () => {
    it('should return new id per call', () => {
      const seen = {};
      let count = 100;

      while (count--) {
        const current = ngInternals.nextUid();
        expect(typeof current).toBe('number');
        expect(seen[current]).toBeFalsy();
        seen[current] = true;
      }
    });
  });


  describe('version', () => {
    it('version should have full/major/minor/dot/codeName properties', () => {
      expect(ngInternals.version).toBeDefined();
      expect(ngInternals.version.full).toBe('"NG_VERSION_FULL"');
      expect(ngInternals.version.major).toBe('NG_VERSION_MAJOR');
      expect(ngInternals.version.minor).toBe('NG_VERSION_MINOR');
      expect(ngInternals.version.dot).toBe('NG_VERSION_DOT');
      expect(ngInternals.version.codeName).toBe('"NG_VERSION_CODENAME"');
    });
  });

  describe('bootstrap', () => {
    beforeEach(() => {
      window.name = "";
    });

    it('should bootstrap app', () => {
      const element = angular.element('<div>{{1+2}}</div>');
      const injector = angular.bootstrap(element);

      expect(injector).toBeDefined();
      expect(element.injector()).toBe(injector);
      dealoc(element);
    });

    it('should complain if app module can\'t be found', () => {
      const element = angular.element('<div>{{1+2}}</div>');

      expect(() => {
        angular.bootstrap(element, ['doesntexist']);
      }).toThrowMinErr('$injector', 'modulerr',
        new RegExp('Failed to instantiate module doesntexist due to:\\n' +
          '.*\\[\\$injector:nomod\\] Module \'doesntexist\' is not available! You either ' +
          'misspelled the module name or forgot to load it\\.'));

      expect(element.html()).toBe('{{1+2}}');
      dealoc(element);
    });


    describe('deferred bootstrap', () => {
      const originalName = window.name;
      let element;

      beforeEach(() => {
        window.name = '';
        element = angular.element('<div>{{1+2}}</div>');
      });

      afterEach(() => {
        dealoc(element);
        window.name = originalName;
      });

      it('should provide injector for deferred bootstrap', () => {
        let injector;
        window.name = 'NG_DEFER_BOOTSTRAP!';

        injector = angular.bootstrap(element);
        expect(injector).toBeUndefined();

        injector = angular.resumeBootstrap();
        expect(injector).toBeDefined();
      });

      it('should resume deferred bootstrap, if defined', () => {
        let injector;
        window.name = 'NG_DEFER_BOOTSTRAP!';

        angular.resumeDeferredBootstrap = angular.noop;
        const spy = jest.spyOn(angular, 'resumeDeferredBootstrap');
        injector = angular.bootstrap(element);
        expect(spy).toHaveBeenCalled();
      });

      it('should wait for extra modules', () => {
        window.name = 'NG_DEFER_BOOTSTRAP!';
        angular.bootstrap(element);

        expect(element.html()).toBe('{{1+2}}');

        angular.resumeBootstrap();

        expect(element.html()).toBe('3');
        expect(window.name).toEqual('');
      });


      it('should load extra modules', () => {
        element = angular.element('<div>{{1+2}}</div>');
        window.name = 'NG_DEFER_BOOTSTRAP!';

        const bootstrapping = jest.fn();
        angular.bootstrap(element, [bootstrapping]);

        expect(bootstrapping).not.toHaveBeenCalled();
        expect(element.injector()).toBeUndefined();

        angular.module('addedModule', []).value('foo', 'bar');
        angular.resumeBootstrap(['addedModule']);

        expect(bootstrapping).toHaveBeenCalledTimes(1);
        expect(element.injector().get('foo')).toEqual('bar');
      });


      it('should not defer bootstrap without window.name cue', () => {
        angular.bootstrap(element, []);
        angular.module('addedModule', []).value('foo', 'bar');

        expect(() => {
          element.injector().get('foo');
        }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: fooProvider <- foo');

        expect(element.injector().get('$http')).toBeDefined();
      });


      it('should restore the original window.name after bootstrap', () => {
        window.name = 'NG_DEFER_BOOTSTRAP!my custom name';
        angular.bootstrap(element);

        expect(element.html()).toBe('{{1+2}}');

        angular.resumeBootstrap();

        expect(element.html()).toBe('3');
        expect(window.name).toEqual('my custom name');
      });
    });
  });


  describe('startingElementHtml', () => {
    it('should show starting element tag only', () => {
      expect(angular.$$startingTag('<ng-abc x="2A"><div>text</div></ng-abc>')).
        toBe('<ng-abc x="2A">');
    });
  });

  describe('startingTag', () => {
    it('should allow passing in Nodes instead of Elements', () => {
      const txtNode = document.createTextNode('some text');
      expect(angular.$$startingTag(txtNode)).toBe('some text');
    });
  });

  describe('snake_case', () => {
    it('should convert to snake_case', () => {
      expect(ngInternals.snake_case('ABC')).toEqual('a_b_c');
      expect(ngInternals.snake_case('alanBobCharles')).toEqual('alan_bob_charles');
    });


    it('should allow separator to be overridden', () => {
      expect(ngInternals.snake_case('ABC', '&')).toEqual('a&b&c');
      expect(ngInternals.snake_case('alanBobCharles', '&')).toEqual('alan&bob&charles');
    });
  });


  describe('fromJson', () => {

    it('should delegate to JSON.parse', () => {
      const spy = jest.spyOn(JSON, 'parse');

      expect(angular.fromJson('{}')).toEqual({});
      expect(spy).toHaveBeenCalled();
    });
  });


  describe('toJson', () => {

    it('should delegate to JSON.stringify', () => {
      const spy = jest.spyOn(JSON, 'stringify');

      expect(angular.toJson({})).toEqual('{}');
      expect(spy).toHaveBeenCalled();
    });


    it('should format objects pretty', () => {
      expect(angular.toJson({ a: 1, b: 2 }, true)).
        toBe('{\n  "a": 1,\n  "b": 2\n}');
      expect(angular.toJson({ a: { b: 2 } }, true)).
        toBe('{\n  "a": {\n    "b": 2\n  }\n}');
      expect(angular.toJson({ a: 1, b: 2 }, false)).
        toBe('{"a":1,"b":2}');
      expect(angular.toJson({ a: 1, b: 2 }, 0)).
        toBe('{"a":1,"b":2}');
      expect(angular.toJson({ a: 1, b: 2 }, 1)).
        toBe('{\n "a": 1,\n "b": 2\n}');
      expect(angular.toJson({ a: 1, b: 2 }, {})).
        toBe('{\n  "a": 1,\n  "b": 2\n}');
    });


    it('should not serialize properties starting with $$', () => {
      expect(angular.toJson({ $$some: 'value' }, false)).toEqual('{}');
    });


    it('should serialize properties starting with $', () => {
      expect(angular.toJson({ $few: 'v' }, false)).toEqual('{"$few":"v"}');
    });


    it('should not serialize $window object', () => {
      expect(angular.toJson(window)).toEqual('"$WINDOW"');
    });


    it('should not serialize $document object', () => {
      expect(angular.toJson(document)).toEqual('"$DOCUMENT"');
    });


    it('should not serialize scope instances', angular.mock.inject($rootScope => {
      expect(angular.toJson({ key: $rootScope })).toEqual('{"key":"$SCOPE"}');
    }));

    it('should serialize undefined as undefined', () => {
      expect(angular.toJson(undefined)).toEqual(undefined);
    });
  });

  describe('isElement', () => {
    it('should return a boolean value', angular.mock.inject(($compile, $document, $rootScope) => {
      const element = $compile('<p>Hello, world!</p>')($rootScope), body = $document.find('body')[0], expected = [false, false, false, false, false, false, false, true, true], tests = [null, undefined, 'string', 1001, {}, 0, false, body, element];

      dealoc(element);
      angular.forEach(tests, (value, idx) => {
        const result = angular.isElement(value);
        expect(typeof result).toEqual('boolean');
        expect(result).toEqual(expected[idx]);
      });
    }));

    // Issue #4805
    it('should return false for objects resembling a Backbone Collection', () => {
      // Backbone stuff is sort of hard to mock, if you have a better way of doing this,
      // please fix this.
      const fakeBackboneCollection = {
        children: [{}, {}, {}],
        find: function () { },
        on: function () { },
        off: function () { },
        bind: function () { }
      };
      expect(angular.isElement(fakeBackboneCollection)).toBe(false);
    });

    it('should return false for arrays with node-like properties', () => {
      const array = [1, 2, 3];
      array.on = true;
      expect(angular.isElement(array)).toBe(false);
    });
  });
});

describe('angular.copy ReDoS mitigations', function () {
  it('should cap copy depth by default (returns "..." beyond depth budget)', function () {
    // Build a deeply nested object with depth 60.
    const depth = 60;
    const obj = {};
    let cursor = obj;
    for (var i = 0; i < depth; i++) {
      cursor.a = {};
      cursor = cursor.a;
    }

    const cloned = angular.copy(obj); // default maxDepth enforced in fork

    // Walk down up to 50 levels; the next level should be the sentinel '...'.
    const maxBudget = 50; // set in src/Angular.js
    let node = cloned;
    for (var d = 0; d < maxBudget; d++) {
      expect(typeof node).toBe('object');
      expect(node).not.toBe(null);
      node = node.a;
    }
    expect(node).toBe('...');
  });

  it('should clone RegExp preserving source, flags and lastIndex', function () {
    const re = /ab+c/gi;
    re.lastIndex = 2;

    const cloned = angular.copy(re);

    expect(cloned instanceof RegExp).toBe(true);
    expect(cloned.source).toBe('ab+c');

    // Use .flags if available, otherwise check individual booleans.
    if (typeof cloned.flags === 'string') {
      expect(cloned.flags.indexOf('g') !== -1).toBe(true);
      expect(cloned.flags.indexOf('i') !== -1).toBe(true);
    } else {
      expect(cloned.global).toBe(true);
      expect(cloned.ignoreCase).toBe(true);
    }

    expect(cloned.lastIndex).toBe(2);
  });
});
