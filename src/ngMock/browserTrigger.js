'use strict';

(function () {
  // Track the last checked state we produced for a given element, so we can
  // distinguish "pure click" from "preset then click" without changing upstream tests.
  var lastTriggeredChecked = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function normalizeIsContentEditable(el) {
    if (!el || !el.getAttribute) return;

    // contenteditable is an enumerated attribute:
    // - absent => not editable
    // - "" / "true" => editable
    // - "false" => not editable
    var ce = el.getAttribute('contenteditable');
    if (ce == null) return;

    var editable = (ce === '' || String(ce).toLowerCase() === 'true');

    // In some jsdom versions, isContentEditable may not reflect the attribute.
    // If it already matches, do nothing.
    if (typeof el.isContentEditable === 'boolean' && el.isContentEditable === editable) return;

    Object.defineProperty(el, 'isContentEditable', {
      configurable: true,
      get: function () { return editable; }
    });
  }

  window.browserTrigger = function browserTrigger(element, eventType, eventData) {
    if (element && !element.nodeName) element = element[0];
    if (!element) return;

    eventData = eventData || {};
    var relatedTarget = eventData.relatedTarget || element;
    var keys = eventData.keys;
    var x = eventData.x;
    var y = eventData.y;

    var inputType = (element.type) ? element.type.toLowerCase() : null;
    var nodeName = element.nodeName.toLowerCase();

    if (!eventType) {
      eventType = {
        // text-like inputs
        'text': 'change',
        'textarea': 'change',
        'hidden': 'change',
        'password': 'change',
        'search': 'change',
        'email': 'change',
        'url': 'change',
        'tel': 'change',

        // numeric/range-like
        'number': 'change',
        'range': 'change',

        // date/time-like
        'date': 'change',
        'datetime': 'change',
        'datetime-local': 'change',
        'time': 'change',
        'month': 'change',
        'week': 'change',

        // misc
        'color': 'change',

        // buttons
        'button': 'click',
        'submit': 'click',
        'reset': 'click',
        'image': 'click',

        // checkables
        'checkbox': 'click',
        'radio': 'click',

        // selects
        'select-one': 'change',
        'select-multiple': 'change',

        '_default_': 'click'
      }[inputType || '_default_'];
    }

    if (nodeName === 'option') {
      element.parentNode.value = element.value;
      element = element.parentNode;
      eventType = 'change';

      // Recompute after switching the target element.
      inputType = (element.type) ? element.type.toLowerCase() : null;
      nodeName = element.nodeName.toLowerCase();
    }

    keys = keys || [];
    function pressed(key) {
      return keys.indexOf(key) !== -1;
    }

    // --- PATCH: checkbox/radio click semantics for jsdom (match real browser + AngularJS tests) ---
    var isClickOnCheckable =
      eventType === 'click' &&
      nodeName === 'input' &&
      (inputType === 'checkbox' || inputType === 'radio');

    var prevChecked, prevTriggered, isPreset, intendedChecked;
    var shouldFireSyntheticChange = false;
    var needsPostDispatchRestore = false;

    if (isClickOnCheckable) {
      prevChecked = !!element.checked;
      prevTriggered = lastTriggeredChecked ? lastTriggeredChecked.get(element) : undefined;

      // IMPORTANT:
      // - When attached to the document, we want real browser semantics:
      //   click toggles checkbox / selects radio.
      // - When detached (common in jsdom), some tests pre-set .checked and trigger click
      //   as a notification; in that case we should not toggle away from the preset value.
      var attached = isAttachedToDocument(element);

      if (prevTriggered === undefined) {
        // First interaction.
        isPreset = attached ? false : (prevChecked !== !!element.defaultChecked);
      } else {
        // Subsequent interactions.
        isPreset = attached ? false : (prevChecked !== !!prevTriggered);
      }

      if (inputType === 'checkbox') {
        intendedChecked = isPreset ? prevChecked : !prevChecked;
        shouldFireSyntheticChange = true;
        needsPostDispatchRestore = true;

        // Make handlers see the intended state during dispatch
        element.checked = intendedChecked;
      } else {
        // radio: clicking selects it (unless preset already did)
        intendedChecked = true;
        shouldFireSyntheticChange = true;
        needsPostDispatchRestore = true;

        if (!isPreset) {
          // Best-effort uncheck other radios in group (like browser)
          var name = element.getAttribute && element.getAttribute('name');
          if (name) {
            var root = element.form || element.ownerDocument;
            if (root && root.querySelectorAll) {
              var selector = 'input[type="radio"][name="' + name.replace(/"/g, '\\"') + '"]';
              var radios = root.querySelectorAll(selector);
              for (var r = 0; r < radios.length; r++) {
                radios[r].checked = (radios[r] === element);
              }
            }
          }
          element.checked = true;
        }
      }
    }
    // --- END PATCH ---

    // --- PATCH: realistic defaults for transition/animation end events ---
    if (/transitionend/.test(eventType)) {
      if (eventData.bubbles == null) eventData.bubbles = true;
      if (eventData.cancelable == null) eventData.cancelable = false;
      if (eventData.propertyName == null) eventData.propertyName = 'all';
      if (eventData.pseudoElement == null) eventData.pseudoElement = '';
    } else if (/animationend/.test(eventType)) {
      if (eventData.bubbles == null) eventData.bubbles = true;
      if (eventData.cancelable == null) eventData.cancelable = false;
      if (eventData.animationName == null) eventData.animationName = '';
      if (eventData.pseudoElement == null) eventData.pseudoElement = '';
    }
    // --- END PATCH ---

    var evnt;
    if (/transitionend/.test(eventType)) {
      if (window.WebKitTransitionEvent) {
        evnt = new window.WebKitTransitionEvent(eventType, eventData);
        evnt.initEvent(eventType, !!eventData.bubbles, !!eventData.cancelable);
      } else {
        try {
          evnt = new window.TransitionEvent(eventType, eventData);
        } catch (e) {
          evnt = window.document.createEvent('TransitionEvent');
          evnt.initTransitionEvent(
            eventType,
            !!eventData.bubbles,
            !!eventData.cancelable,
            eventData.propertyName || 'all',
            eventData.elapsedTime || 0,
            eventData.pseudoElement || ''
          );
        }
      }
    } else if (/animationend/.test(eventType)) {
      if (window.WebKitAnimationEvent) {
        evnt = new window.WebKitAnimationEvent(eventType, eventData);
        evnt.initEvent(eventType, !!eventData.bubbles, !!eventData.cancelable);
      } else {
        try {
          evnt = new window.AnimationEvent(eventType, eventData);
        } catch (e) {
          evnt = window.document.createEvent('AnimationEvent');
          evnt.initAnimationEvent(
            eventType,
            eventData.bubbles,
            eventData.cancelable,
            eventData.animationName || '',
            eventData.elapsedTime || 0,
            eventData.pseudoElement || ''
          );
        }
      }
    } else if (/touch/.test(eventType) && supportsTouchEvents()) {
      evnt = createTouchEvent(element, eventType, x, y);
    } else if (/key/.test(eventType)) {
      normalizeIsContentEditable(element);

      evnt = window.document.createEvent('Events');
      evnt.initEvent(eventType, eventData.bubbles, eventData.cancelable);
      evnt.view = window;
      evnt.ctrlKey = pressed('ctrl');
      evnt.altKey = pressed('alt');
      evnt.shiftKey = pressed('shift');
      evnt.metaKey = pressed('meta');
      evnt.keyCode = eventData.keyCode;
      evnt.charCode = eventData.charCode;
      evnt.which = eventData.which;
    } else if (/composition/.test(eventType)) {
      try {
        evnt = new window.CompositionEvent(eventType, { data: eventData.data });
      } catch (e) {
        evnt = window.document.createEvent('CompositionEvent', {});
        evnt.initCompositionEvent(
          eventType,
          eventData.bubbles,
          eventData.cancelable,
          window,
          eventData.data,
          null
        );
      }
    } else {
      evnt = window.document.createEvent('MouseEvents');
      x = x || 0;
      y = y || 0;
      evnt.initMouseEvent(
        eventType,
        true,
        true,
        window,
        0,
        x,
        y,
        x,
        y,
        pressed('ctrl'),
        pressed('alt'),
        pressed('shift'),
        pressed('meta'),
        0,
        relatedTarget
      );
    }

    evnt.$manualTimeStamp = eventData.timeStamp;
    if (!evnt) return;

    var result;
    if (!eventData.bubbles || supportsEventBubblingInDetachedTree() || isAttachedToDocument(element)) {
      result = element.dispatchEvent(evnt);
    } else {
      result = triggerForPath(element, evnt);
    }

    // --- PATCH: post-dispatch restore + synthetic change (jsdom doesn't do default actions) ---
    if (isClickOnCheckable && needsPostDispatchRestore) {
      // Restore to intended state in case jsdom toggled unexpectedly
      if (inputType === 'checkbox') {
        element.checked = !!intendedChecked;
      } else if (inputType === 'radio') {
        element.checked = true;
      }

      // Fire change so Angular's ngModel updates/validates
      if (shouldFireSyntheticChange) {
        try {
          var changeEv = window.document.createEvent('HTMLEvents');
          changeEv.initEvent('change', true, true);
          element.dispatchEvent(changeEv);
        } catch (e) { /* ignore */ }
      }

      // Remember what state we produced/observed
      if (lastTriggeredChecked) lastTriggeredChecked.set(element, !!element.checked);
    }
    // --- END PATCH ---

    return result;
  };

  function supportsTouchEvents() {
    if ('_cached' in supportsTouchEvents) {
      return supportsTouchEvents._cached;
    }
    if (!window.document.createTouch || !window.document.createTouchList) {
      supportsTouchEvents._cached = false;
      return false;
    }
    try {
      window.document.createEvent('TouchEvent');
    } catch (e) {
      supportsTouchEvents._cached = false;
      return false;
    }
    supportsTouchEvents._cached = true;
    return true;
  }

  function createTouchEvent(element, eventType, x, y) {
    var evnt = new window.Event(eventType);
    x = x || 0;
    y = y || 0;

    var touch = window.document.createTouch(window, element, Date.now(), x, y, x, y);
    var touches = window.document.createTouchList(touch);

    evnt.touches = touches;
    return evnt;
  }

  function supportsEventBubblingInDetachedTree() {
    if ('_cached' in supportsEventBubblingInDetachedTree) {
      return supportsEventBubblingInDetachedTree._cached;
    }
    supportsEventBubblingInDetachedTree._cached = false;
    var doc = window.document;
    if (doc) {
      var parent = doc.createElement('div'),
        child = parent.cloneNode();
      parent.appendChild(child);
      parent.addEventListener('e', function () {
        supportsEventBubblingInDetachedTree._cached = true;
      });
      var evnt = window.document.createEvent('Events');
      evnt.initEvent('e', true, true);
      child.dispatchEvent(evnt);
    }
    return supportsEventBubblingInDetachedTree._cached;
  }

  function triggerForPath(element, evnt) {
    var stop = false;

    var _stopPropagation = evnt.stopPropagation;
    evnt.stopPropagation = function () {
      stop = true;
      _stopPropagation.apply(evnt, arguments);
    };
    patchEventTargetForBubbling(evnt, element);
    do {
      element.dispatchEvent(evnt);
      // eslint-disable-next-line no-unmodified-loop-condition
    } while (!stop && (element = element.parentNode));
  }

  function patchEventTargetForBubbling(event, target) {
    event._target = target;
    Object.defineProperty(event, 'target', { get: function () { return this._target; } });
  }

  // FIX: jsdom parent chain ends at Document (and/or HTML), not Window.
  // The old check for `element === window` fails in jsdom, causing "attached" to be false
  // even after appending to document.body.
  function isAttachedToDocument(element) {
    var doc = window.document;
    var rootEl = doc && doc.documentElement;
    var body = doc && doc.body;

    while (element) {
      if (element === doc || element === rootEl || element === body) return true;
      element = element.parentNode;
    }
    return false;
  }
})();
