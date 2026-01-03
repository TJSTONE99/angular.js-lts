'use strict';

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports `http/https/ftp/sftp/mailto` and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} [target] Window (`_blank|_self|_parent|_top`) or named frame to open links in.
 * @param {object|function(url)} [attributes] Add custom attributes to the link element.
 *
 *    Can be one of:
 *
 *    - `object`: A map of attributes
 *    - `function`: Takes the url as a parameter and returns a map of attributes
 *
 *    If the map of attributes contains a value for `target`, it overrides the value of
 *    the target parameter.
 *
 *
 * @returns {string} Html-linkified and {@link $sanitize sanitized} text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js" name="linky-filter">
     <file name="index.html">
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <th>Filter</th>
           <th>Source</th>
           <th>Rendered</th>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="linky-custom-attributes">
          <td>linky custom attributes</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="script.js">
       angular.module('linkyExample', ['ngSanitize'])
         .controller('ExampleController', ['$scope', function($scope) {
           $scope.snippet =
             'Pretty text with some links:\n' +
             'http://angularjs.org/,\n' +
             'mailto:us@somewhere.org,\n' +
             'another@somewhere.org,\n' +
             'and one more: ftp://127.0.0.1/.';
           $scope.snippetWithSingleURL = 'http://angularjs.org/';
         }]);
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithSingleURL | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });

       it('should optionally add custom attributes', function() {
        expect(element(by.id('linky-custom-attributes')).
            element(by.binding("snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-custom-attributes a')).getAttribute('rel')).toEqual('nofollow');
       });
     </file>
   </example>
 */
'use strict';

angular.module('ngSanitize').filter('linky', ['$sanitize', ($sanitize) => {

  // ---- Regexes (split to avoid ReDoS) ----
  const URL_PROTOCOL_REGEXP = /((s?ftp|https?):\/\/)\S*[^\s.;,(){}<>"\u201d\u2019]/gi;
  const URL_WWW_REGEXP = /(www\.)\S*[^\s.;,(){}<>"\u201d\u2019]/gi;
  const EMAIL_REGEXP = /((mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/gi;
  const MAILTO_REGEXP = /^mailto:/i;

  const MAX_TEXT_LENGTH = 5000;
  const MAX_CHUNK_SIZE = 10000;

  const {
    isDefined,
    isFunction,
    isObject,
    isString
  } = angular;

  const linkyMinErr = angular.$$minErr('linky');

  // ---------------------------------------------------------------------------
  // ReDoS protection helpers
  // ---------------------------------------------------------------------------

  const looksLikeReDoS = (text) => {
    if (text.length <= MAX_TEXT_LENGTH) return false;

    let maxConsecutive = 0;
    let current = 0;
    let hasSpacesOrPunctuation = false;

    const hasValidUrlStart = /^(https?:\/\/|www\.|[A-Za-z0-9._%+-]+@)/.test(text);
    const sampleSize = Math.min(text.length, 500);

    for (let i = 0; i < sampleSize; i++) {
      const char = text.charAt(i);

      if (/[A-Za-z0-9]/.test(char)) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
        if (/[\s.,;:!?]/.test(char)) {
          hasSpacesOrPunctuation = true;
        }
      }
    }

    // Repeated single character attack
    if (sampleSize > 100) {
      const firstChar = text.charAt(0);
      const allSame = [...text.slice(0, sampleSize)].every(c => c === firstChar);

      if (allSame && /[A-Za-z0-9]/.test(firstChar)) {
        return true;
      }
    }

    return maxConsecutive > 100 && !hasValidUrlStart && !hasSpacesOrPunctuation;
  };

  // ---------------------------------------------------------------------------
  // Chunking helpers
  // ---------------------------------------------------------------------------

  const splitIntoChunks = (text) => {
    if (text.length <= MAX_CHUNK_SIZE) {
      return [{ text, offset: 0 }];
    }

    const chunks = [];
    for (let i = 0; i < text.length; i += MAX_CHUNK_SIZE - 100) {
      chunks.push({
        text: text.substring(i, i + MAX_CHUNK_SIZE),
        offset: i
      });
    }
    return chunks;
  };

  // ---------------------------------------------------------------------------
  // Matching helpers
  // ---------------------------------------------------------------------------

  const overlapsExisting = (matches, index, length) =>
    matches.some(m =>
      index < m.index + m.length &&
      index + length > m.index
    );

  const findMatchesInChunk = (chunkText, chunkOffset, matches) => {
    let match;

    URL_PROTOCOL_REGEXP.lastIndex = 0;
    URL_WWW_REGEXP.lastIndex = 0;
    EMAIL_REGEXP.lastIndex = 0;

    while ((match = URL_PROTOCOL_REGEXP.exec(chunkText))) {
      matches.push({
        index: match.index + chunkOffset,
        length: match[0].length,
        text: match[0],
        type: 'protocol'
      });
    }

    while ((match = URL_WWW_REGEXP.exec(chunkText))) {
      const index = match.index + chunkOffset;
      if (!overlapsExisting(matches, index, match[0].length)) {
        matches.push({
          index,
          length: match[0].length,
          text: match[0],
          type: 'www'
        });
      }
    }

    while ((match = EMAIL_REGEXP.exec(chunkText))) {
      const index = match.index + chunkOffset;
      if (!overlapsExisting(matches, index, match[0].length)) {
        matches.push({
          index,
          length: match[0].length,
          text: match[0],
          type: 'email'
        });
      }
    }
  };

  const findAllMatches = (text) => {
    if (looksLikeReDoS(text)) return [];

    const matches = [];
    const chunks = splitIntoChunks(text);

    chunks.forEach(({ text, offset }) =>
      findMatchesInChunk(text, offset, matches)
    );

    // Sort + de-duplicate
    return matches
      .sort((a, b) => a.index - b.index)
      .filter((m, i, arr) =>
        i === 0 ||
        m.index !== arr[i - 1].index ||
        m.text !== arr[i - 1].text
      );
  };

  // ---------------------------------------------------------------------------
  // Filter implementation
  // ---------------------------------------------------------------------------

  return (text, target, attributes) => {
    if (text == null || text === '') return text;
    if (!isString(text)) {
      throw linkyMinErr('notstring', 'Expected string but received: {0}', text);
    }

    const getAttributes =
      isFunction(attributes) ? attributes :
        isObject(attributes) ? () => attributes :
          () => ({});

    const matches = findAllMatches(text);
    const html = [];
    let lastIndex = 0;

    const addText = (value) => {
      if (value) html.push(sanitizeText(value));
    };

    const addLink = (url, label) => {
      const linkAttrs = getAttributes(url);
      html.push('<a ');

      Object.keys(linkAttrs).forEach(key => {
        html.push(`${key}="${linkAttrs[key]}" `);
      });

      if (isDefined(target) && !('target' in linkAttrs)) {
        html.push(`target="${target}" `);
      }

      html.push(
        'href="',
        url.replace(/"/g, '&quot;'),
        '">'
      );
      addText(label);
      html.push('</a>');
    };

    matches.forEach(match => {
      addText(text.slice(lastIndex, match.index));

      let url = match.text;
      if (match.type === 'www') {
        url = `http://${url}`;
      } else if (match.type === 'email' && !MAILTO_REGEXP.test(url)) {
        url = `mailto:${url}`;
      }

      addLink(url, match.text.replace(MAILTO_REGEXP, ''));
      lastIndex = match.index + match.length;
    });

    addText(text.slice(lastIndex));
    return $sanitize(html.join(''));
  };
}]);
