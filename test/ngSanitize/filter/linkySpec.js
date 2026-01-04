'use strict';

describe('linky', () => {
  let linky;

  beforeEach(angular.mock.module('ngSanitize'));

  beforeEach(angular.mock.inject($filter => {
    linky = $filter('linky');
  }));

  it('should do basic filter', () => {
    expect(linky('http://ab/ (http://a/) <http://a/> http://1.2/v:~-123. c “http://example.com” ‘http://me.com’')).
      toEqual('<a href="http://ab/">http://ab/</a> ' +
        '(<a href="http://a/">http://a/</a>) ' +
        '&lt;<a href="http://a/">http://a/</a>&gt; ' +
        '<a href="http://1.2/v:~-123">http://1.2/v:~-123</a>. c ' +
        '&#8220;<a href="http://example.com">http://example.com</a>&#8221; ' +
        '&#8216;<a href="http://me.com">http://me.com</a>&#8217;');
    expect(linky(undefined)).not.toBeDefined();
  });

  it('should return `undefined`/`null`/`""` values unchanged', () => {
    expect(linky(undefined)).toBeUndefined();
    expect(linky(null)).toBe(null);
    expect(linky('')).toBe('');
  });

  it('should throw an error when used with a non-string value (other than `undefined`/`null`)',
    () => {
      expect(() => { linky(false); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: false');

      expect(() => { linky(true); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: true');

      expect(() => { linky(0); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: 0');

      expect(() => { linky(42); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: 42');

      expect(() => { linky({}); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: {}');

      expect(() => { linky([]); }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: []');

      expect(() => {
        linky(angular.noop);
      }).
        toThrowMinErr('linky', 'notstring', 'Expected string but received: function noop()');
    }
  );

  it('should be case-insensitive', () => {
    expect(linky('WWW.example.com')).toEqual('<a href="http://WWW.example.com">WWW.example.com</a>');
    expect(linky('WWW.EXAMPLE.COM')).toEqual('<a href="http://WWW.EXAMPLE.COM">WWW.EXAMPLE.COM</a>');
    expect(linky('HTTP://www.example.com')).toEqual('<a href="HTTP://www.example.com">HTTP://www.example.com</a>');
    expect(linky('HTTP://example.com')).toEqual('<a href="HTTP://example.com">HTTP://example.com</a>');
    expect(linky('HTTPS://www.example.com')).toEqual('<a href="HTTPS://www.example.com">HTTPS://www.example.com</a>');
    expect(linky('HTTPS://example.com')).toEqual('<a href="HTTPS://example.com">HTTPS://example.com</a>');
    expect(linky('FTP://www.example.com')).toEqual('<a href="FTP://www.example.com">FTP://www.example.com</a>');
    expect(linky('FTP://example.com')).toEqual('<a href="FTP://example.com">FTP://example.com</a>');
    expect(linky('SFTP://www.example.com')).toEqual('<a href="SFTP://www.example.com">SFTP://www.example.com</a>');
    expect(linky('SFTP://example.com')).toEqual('<a href="SFTP://example.com">SFTP://example.com</a>');
  });

  it('should handle www.', () => {
    expect(linky('www.example.com')).toEqual('<a href="http://www.example.com">www.example.com</a>');
  });

  it('should handle mailto:', () => {
    expect(linky('mailto:me@example.com')).
      toEqual('<a href="mailto:me@example.com">me@example.com</a>');
    expect(linky('me@example.com')).
      toEqual('<a href="mailto:me@example.com">me@example.com</a>');
    expect(linky('send email to me@example.com, but')).
      toEqual('send email to <a href="mailto:me@example.com">me@example.com</a>, but');
    expect(linky('my email is "me@example.com"')).
      toEqual('my email is &#34;<a href="mailto:me@example.com">me@example.com</a>&#34;');
  });

  it('should handle quotes in the email', () => {
    expect(linky('foo@"bar".com')).toEqual('<a href="mailto:foo@&#34;bar&#34;.com">foo@&#34;bar&#34;.com</a>');
  });

  it('should handle target:', () => {
    expect(linky('http://example.com', '_blank')).
      toBeOneOf('<a target="_blank" href="http://example.com">http://example.com</a>',
        '<a href="http://example.com" target="_blank">http://example.com</a>');
    expect(linky('http://example.com', 'someNamedIFrame')).
      toBeOneOf('<a target="someNamedIFrame" href="http://example.com">http://example.com</a>',
        '<a href="http://example.com" target="someNamedIFrame">http://example.com</a>');
  });

  describe('custom attributes', () => {

    it('should optionally add custom attributes', () => {
      expect(linky('http://example.com', '_self', { rel: 'nofollow' })).
        toBeOneOf('<a rel="nofollow" target="_self" href="http://example.com">http://example.com</a>',
          '<a href="http://example.com" target="_self" rel="nofollow">http://example.com</a>');
    });


    it('should override target parameter with custom attributes', () => {
      expect(linky('http://example.com', '_self', { target: '_blank' })).
        toBeOneOf('<a target="_blank" href="http://example.com">http://example.com</a>',
          '<a href="http://example.com" target="_blank">http://example.com</a>');
    });


    it('should optionally add custom attributes from function', () => {
      expect(linky('http://example.com', '_self', () => { return { 'class': 'blue' }; })).
        toBeOneOf('<a class="blue" target="_self" href="http://example.com">http://example.com</a>',
          '<a href="http://example.com" target="_self" class="blue">http://example.com</a>',
          '<a class="blue" href="http://example.com" target="_self">http://example.com</a>');
    });


    it('should pass url as parameter to custom attribute function', () => {
      const linkParameters = jest.fn().mockReturnValue({ 'class': 'blue' });
      linky('http://example.com', '_self', linkParameters);
      expect(linkParameters).toHaveBeenCalledWith('http://example.com');
    });


    it('should call the attribute function for all links in the input', () => {
      const attributeFn = jest.fn().mockReturnValue({});
      linky('http://example.com and http://google.com', '_self', attributeFn);
      expect(attributeFn.mock.calls).toEqual([['http://example.com'], ['http://google.com']]);
    });


    it('should strip unsafe attributes', () => {
      expect(linky('http://example.com', '_self', { 'class': 'blue', 'onclick': 'alert(\'Hi\')' })).
        toBeOneOf('<a class="blue" target="_self" href="http://example.com">http://example.com</a>',
          '<a href="http://example.com" target="_self" class="blue">http://example.com</a>',
          '<a class="blue" href="http://example.com" target="_self">http://example.com</a>');
    });
  });

  describe('CVE-2025-4690 ReDoS protection', () => {

    it('should handle malicious input designed to cause ReDoS via catastrophic backtracking', () => {
      // Long string with repeated patterns that could cause backtracking
      const maliciousInput1 = 'http://' + 'a'.repeat(1000) + '.com' + '/'.repeat(1000);
      const startTime = Date.now();
      const result1 = linky(maliciousInput1);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result1).toContain('<a href="');
    });

    it('should handle input with nested quantifiers that could trigger ReDoS', () => {
      // Pattern designed to exploit nested quantifiers in URL regex
      const maliciousInput2 = 'http://example.com/' + 'a'.repeat(500) + '?' + 'b='.repeat(500) + 'c';
      const startTime = Date.now();
      const result2 = linky(maliciousInput2);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result2).toContain('<a href="');
    });

    it('should handle alternation patterns that could cause exponential backtracking', () => {
      // Input designed to exploit alternation in the regex
      const maliciousInput3 = 'www.' + 'x'.repeat(100) + 'y'.repeat(100) + '.com';
      const startTime = Date.now();
      const result3 = linky(maliciousInput3);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result3).toContain('<a href="');
    });

    it('should handle email patterns that could trigger ReDoS', () => {
      // Malicious email pattern
      const maliciousInput4 = 'a'.repeat(100) + '@' + 'b'.repeat(100) + '.' + 'c'.repeat(100);
      const startTime = Date.now();
      const result4 = linky(maliciousInput4);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result4).toContain('<a href="mailto:');
    });

    it('should handle mixed content with potential ReDoS patterns', () => {
      // Mixed content with multiple potential ReDoS triggers
      // Using simpler patterns that work with current regex behavior
      const maliciousInput5 = 'Check out www.' + 'a'.repeat(200) + '.example.com and email me at ' +
        'user'.repeat(50) + '@' + 'domain'.repeat(50) + '.com';
      const startTime = Date.now();
      const result5 = linky(maliciousInput5);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200);
      // Now that regex is fixed, www. URLs are correctly treated as HTTP URLs
      expect(result5).toContain('<a href="http://');
      expect(result5).toContain('<a href="mailto:');
    });

    it('should handle edge case with unicode characters that could cause ReDoS', () => {
      // Unicode characters mixed with potential ReDoS patterns
      const maliciousInput6 = 'http://example.com/' + '\u201d'.repeat(100) + 'path' + '\u2019'.repeat(100);
      const startTime = Date.now();
      const result6 = linky(maliciousInput6);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      // Should not create a link due to unicode characters breaking the URL
      expect(result6).not.toContain('<a href="http://example.com/' + '\u201d'.repeat(100));
    });

    it('should handle extremely long input without ReDoS', () => {
      // Very long input that should be processed efficiently
      const longText = 'Visit '.repeat(1000) + 'www.example.com ' + 'for more info '.repeat(1000);
      const startTime = Date.now();
      const result7 = linky(longText);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
      // Now that regex is fixed, www. URLs are correctly treated as HTTP URLs
      expect(result7).toContain('<a href="http://www.example.com">www.example.com</a>');
    });

    it('should handle input with many potential false matches efficiently', () => {
      // Input with many patterns that look like URLs but aren't
      const falseMatches = 'http:// '.repeat(100) + 'www. '.repeat(100) + 'ftp:// '.repeat(100);
      const startTime = Date.now();
      const result8 = linky(falseMatches);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result8).not.toContain('<a href="');
    });

    it('should handle pathological ReDoS input with repeated character classes', () => {
      // Specific pattern that could exploit character class repetition
      const pathologicalInput = 'http://' + 'a'.repeat(50) + '.' + 'b'.repeat(50) + '.' + 'c'.repeat(50) +
        '/' + 'd'.repeat(100) + '?' + 'e='.repeat(100) + 'f';
      const startTime = Date.now();
      const result9 = linky(pathologicalInput);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result9).toContain('<a href="');
    });

    it('should handle input designed to exploit email regex backtracking', () => {
      // Email pattern with potential for catastrophic backtracking
      const emailBacktrackInput = 'Contact ' + 'a'.repeat(100) + 'b'.repeat(100) + '@' +
        'c'.repeat(100) + 'd'.repeat(100) + '.com for help';
      const startTime = Date.now();
      const result10 = linky(emailBacktrackInput);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(result10).toContain('<a href="mailto:');
    });

    it('should handle extremely long input efficiently with regex fix (CVE-2025-4690)', () => {
      // Very long input should be processed efficiently with the new regex
      const veryLongInput = 'Visit http://example.com ' + 'x'.repeat(15000);
      const startTime = Date.now();
      const result11 = linky(veryLongInput);
      const endTime = Date.now();

      // Should complete efficiently with the ReDoS-safe regex
      expect(endTime - startTime).toBeLessThan(200);
      expect(result11).toContain('<a href="http://example.com">http://example.com</a>');
    });

    it('should handle consecutive alphanumeric characters without ReDoS (CVE-2025-4690 specific case)', () => {
      // Consecutive alphanumeric characters that are NOT part of a valid email
      const consecutiveChars = 'a'.repeat(25000);
      const startTime = Date.now();
      const result12 = linky(consecutiveChars);
      const endTime = Date.now();

      // This should complete quickly without ReDoS
      expect(endTime - startTime).toBeLessThan(100);
      // Should not create any links since it's just consecutive 'a' characters
      expect(result12).toBe(consecutiveChars);
    });

  });
});
