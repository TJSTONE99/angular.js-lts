'use strict';

// When running the modules test, then the page should not be bootstrapped.
beforeEach(() => {
    window.name = 'NG_DEFER_BOOTSTRAP!';
});
