/**
 * Angular test setup utilities for Playwright browser tests
 * Provides proper Angular application bootstrapping and dependency injection
 */

// Global setup function for Angular tests in browser
window.setupAngularForTesting = function() {
  // Clean up any existing test state
  const existingContainers = document.querySelectorAll('[data-angular-test]');
  existingContainers.forEach(container => container.remove());
  
  const existingStyles = document.querySelectorAll('style[data-test-style]');
  existingStyles.forEach(style => style.remove());
  
  // Create test container in the main test container
  const mainContainer = document.getElementById('test-container');
  if (!mainContainer) {
    const newContainer = document.createElement('div');
    newContainer.id = 'test-container';
    newContainer.style.position = 'absolute';
    newContainer.style.top = '-9999px';
    newContainer.style.left = '-9999px';
    document.body.appendChild(newContainer);
  }
  
  // Create Angular app element with proper root element setup
  const appElement = angular.element('<div ng-app="playwrightTestApp" id="angular-app-root"></div>');
  document.body.appendChild(appElement[0]);
  
  // Create test module with ngAnimate and proper providers
  const testModule = angular.module('playwrightTestApp', ['ngAnimate']);
  
  // Configure the module with proper providers
  testModule.config(['$provide', function($provide) {
    // Provide $rootElement explicitly
    $provide.value('$rootElement', appElement);
  }]);
  
  // Add a simple controller for testing
  testModule.controller('TestController', function($scope) {
    $scope.testData = 'Angular is working';
  });
  
  // Bootstrap the application with proper root element
  angular.bootstrap(appElement[0], ['playwrightTestApp']);
  
  // Get the injector
  const injector = appElement.injector();
  
  // Store references globally for tests
  window.testInjector = injector;
  window.testAppElement = appElement;
  window.testContainer = angular.element(document.getElementById('test-container'));
  
  return injector;
};

// Cleanup function
window.cleanupAngularTest = function() {
  // Remove test styles
  const testStyles = document.querySelectorAll('style[data-test-style]');
  testStyles.forEach(style => style.remove());
  
  // Clear test container
  const testContainer = document.getElementById('test-container');
  if (testContainer) {
    testContainer.innerHTML = '';
  }
  
  // Clean up global references
  if (window.testAppElement) {
    window.testAppElement.remove();
    window.testAppElement = null;
  }
  
  window.testInjector = null;
  window.testContainer = null;
  
  // Remove test containers
  const containers = document.querySelectorAll('[data-angular-test]');
  containers.forEach(container => container.remove());
  
  // Remove Angular app root
  const appRoot = document.getElementById('angular-app-root');
  if (appRoot) {
    appRoot.remove();
  }
};

// Helper to create test elements
window.createTestElement = function(html) {
  const element = angular.element(html || '<div></div>');
  const container = document.getElementById('test-container');
  if (container) {
    container.appendChild(element[0]);
  }
  return element;
};

// Helper to add test styles
window.addTestStyle = function(selector, rules) {
  const style = document.createElement('style');
  style.setAttribute('data-test-style', 'true');
  
  // Handle keyframes differently
  if (selector.startsWith('@keyframes')) {
    style.textContent = selector + ' { ' + rules + ' }';
  } else {
    style.textContent = selector + ' { ' + rules + ' }';
  }
  
  document.head.appendChild(style);
  return style;
};

// Helper to run code with Angular injector
window.runWithInjector = function(testFn) {
  return new Promise((resolve, reject) => {
    try {
      if (!window.testInjector) {
        window.setupAngularForTesting();
      }
      
      window.testInjector.invoke(testFn);
    } catch (error) {
      reject(error);
    }
  });
};

// Helper to create a stylesheet utility (for CSS caching tests)
window.createStyleSheetHelper = function() {
  window.ss = {
    addPossiblyPrefixedRule: function(selector, rule) {
      const style = document.createElement('style');
      style.setAttribute('data-test-style', 'true');
      style.textContent = selector + ' { ' + rule + ' }';
      document.head.appendChild(style);
      return style;
    }
  };
};

// Helper to trigger browser events (for animation tests)
window.browserTrigger = function(element, eventType, eventData) {
  let event;
  
  if (eventType === 'transitionend') {
    event = new TransitionEvent('transitionend', {
      propertyName: eventData.propertyName || 'all',
      elapsedTime: eventData.elapsedTime || 0,
      bubbles: true
    });
  } else if (eventType === 'animationend') {
    event = new AnimationEvent('animationend', {
      animationName: eventData.animationName || 'test',
      elapsedTime: eventData.elapsedTime || 0,
      bubbles: true
    });
  } else {
    event = new Event(eventType, { bubbles: true });
  }
  
  element.dispatchEvent(event);
  return event;
};