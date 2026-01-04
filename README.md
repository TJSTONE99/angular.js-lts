AngularJS LTS
=========

**This is the Long Term Support (LTS) version of AngularJS with modernized build tools and Node.js v24 support.**

AngularJS lets you write client-side web applications as if you had a smarter browser.  It lets you
use good old HTML (or HAML, Jade/Pug and friends!) as your template language and lets you extend HTML’s
syntax to express your application’s components clearly and succinctly.  It automatically
synchronizes data from your UI (view) with your JavaScript objects (model) through 2-way data
binding. To help you structure your application better and make it easy to test, AngularJS teaches
the browser how to do dependency injection and inversion of control.

It also helps with server-side communication, taming async callbacks with promises and deferred objects,
and it makes client-side navigation and deep linking with hashbang urls or HTML5 pushState a
piece of cake. Best of all? It makes development fun!

--------------------

**AngularJS support has officially ended as of January 2022.
[See what ending support means](https://docs.angularjs.org/misc/version-support-status)
and [read the end of life announcement](https://goo.gle/angularjs-end-of-life).**

**Visit [angular.io](https://angular.io) for the actively supported Angular.**

--------------------

* Web site: https://angularjs.org
* Tutorial: https://docs.angularjs.org/tutorial
* API Docs: https://docs.angularjs.org/api
* Developer Guide: https://docs.angularjs.org/guide
* Contribution guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)
* Core Development: [DEVELOPERS.md](DEVELOPERS.md)
* Dashboard: https://dashboard.angularjs.org


Documentation
--------------------
- **Official AngularJS LTS Documentation**: https://tjstone99.github.io/angular-lts-docs/
- **Original AngularJS Documentation**: https://docs.angularjs.org

Contribute
--------------------

We've set up a separate document for our
[contribution guidelines](https://github.com/TJSTONE99/angular.js-lts/blob/master/CONTRIBUTING.md).

Develop
--------------------

## Prerequisites

- **Node.js**: Version 24.0.0 or higher
- **npm**: Version 11.6.0 or higher

## Building AngularJS

To build AngularJS from source:

```bash
# Install dependencies
npm install

# Build the distribution files
npm run build
```

The build process will create distribution files in the `dist/` directory.

## Running Tests

### Unit Tests

AngularJS uses Jest for unit testing:

```bash
# Run all unit tests
npm test

# Run tests with detailed logging
npm run test:log

# Build test files only (without running tests)
npm run test:build
```

### Playwright Tests

Run Playwright-based tests for browser compatibility:

```bash
# Run Playwright tests
npm run test:playwright

# Run Playwright tests with detailed logging
npm run test:playwright:log
```

### End-to-End Tests

E2E tests use Playwright for cross-browser testing:

```bash
# Run complete E2E test suite
npm run test:e2e

# Build and serve for E2E testing (development mode)
npm run test:e2e:dev

# Run E2E tests only (assumes build is already done)
npm run test:e2e:run

# Serve the test application for manual testing
npm run test:e2e:serve
```

### Run All Tests

To run the complete test suite (unit, Playwright, and E2E):

```bash
npm run test:all
```

## Development Workflow

1. **Setup**: Clone the repository and run `npm install`
2. **Build**: Use `npm run build` to create distribution files
3. **Test**: Run `npm test` for unit tests or `npm run test:e2e` for E2E tests
4. **Development**: Use `npm run test:e2e:dev` for interactive development with E2E tests

## Deployment

To deploy AngularJS to bower repositories and npm:

```bash
npm run deploy
```

To deploy only to bower repositories (skip npm publishing):

```bash
npm run deploy:skip-npm
```

This will:
- Build the project
- Copy files to `bower-angular-lts` and `bower-angular-sanitize-lts` repositories (if they exist)
- Update bower.json versions to match package.json
- Commit changes and create git tags
- Push changes to remote repositories
- Publish `angular-lts` and `angular-sanitize-lts` packages to npm (unless skipped)

**NPM Publishing Notes:**
- The script will attempt to login to npm if you're not authenticated
- If you have 2FA enabled, you may need to use an automation token or provide OTP
- The script checks for existing package versions to avoid duplicate publishes
- Use `npm run deploy:skip-npm` to deploy only to bower repositories

## Bower Repositories

Individual bower builds are available as separate repositories:

- **bower-angular-lts**: https://github.com/TJSTONE99/bower-angular-lts
- **bower-angular-sanitize-lts**: https://github.com/TJSTONE99/bower-angular-sanitize-lts  
- **bower-angular-resource-lts**: https://github.com/TJSTONE99/bower-angular-resource-lts

These repositories contain the built distribution files optimized for bower package management.

## Build System

This LTS version uses a modern build system with:
- **ES Modules**: Native ES module support for better compatibility
- **SWC**: Fast JavaScript/TypeScript compilation and minification
- **Jest**: Modern testing framework with JSDOM environment
- **Playwright**: Cross-browser E2E testing


[![Analytics](https://ga-beacon.appspot.com/UA-8594346-11/angular.js/README.md?pixel)](https://github.com/igrigorik/ga-beacon)

What to use AngularJS for and when to use it
---------
AngularJS is the next generation framework where each component is designed to work with every other
component in an interconnected way like a well-oiled machine. AngularJS is JavaScript MVC made easy
and done right. (Well it is not really MVC, read on, to understand what this means.)

#### MVC, no, MV* done the right way!
[MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller), short for
Model-View-Controller, is a design pattern, i.e. how the code should be organized and how the
different parts of an application separated for proper readability and debugging. Model is the data
and the database. View is the user interface and what the user sees. Controller is the main link
between Model and View. These are the three pillars of major programming frameworks present on the
market today. On the other hand AngularJS works on MV*, short for Model-View-_Whatever_. The
_Whatever_ is AngularJS's way of telling that you may create any kind of linking between the Model
and the View here.

Unlike other frameworks in any programming language, where MVC, the three separate components, each
one has to be written and then connected by the programmer, AngularJS helps the programmer by asking
him/her to just create these and everything else will be taken care of by AngularJS.

#### Interconnection with HTML at the root level
AngularJS uses HTML to define the user's interface. AngularJS also enables the programmer to write
new HTML tags (AngularJS Directives) and increase the readability and understandability of the HTML
code. Directives are AngularJS’s way of bringing additional functionality to HTML. Directives
achieve this by enabling us to invent our own HTML elements. This also helps in making the code DRY
(Don't Repeat Yourself), which means once created, a new directive can be used anywhere within the
application.

HTML is also used to determine the wiring of the app. Special attributes in the HTML determine where
to load the app, which components or controllers to use for each element, etc. We specify "what"
gets loaded, but not "how". This declarative approach greatly simplifies app development in a sort
of WYSIWYG way. Rather than spending time on how the program flows and orchestrating the various
moving parts, we simply define what we want and AngularJS will take care of the dependencies.

#### Data Handling made simple
Data and Data Models in AngularJS are plain JavaScript objects and one can add and change properties
directly on it and loop over objects and arrays at will.

#### Two-way Data Binding
One of AngularJS's strongest features. Two-way Data Binding means that if something changes in the
Model, the change gets reflected in the View instantaneously, and the same happens the other way
around. This is also referred to as Reactive Programming, i.e. suppose `a = b + c` is being
programmed and after this, if the value of `b` and/or `c` is changed then the value of `a` will be
automatically updated to reflect the change. AngularJS uses its "scopes" as a glue between the Model
and View and makes these updates in one available for the other.

#### Less Written Code and Easily Maintainable Code
Everything in AngularJS is created to enable the programmer to end up writing less code that is
easily maintainable and readable by any other new person on the team. Believe it or not, one can
write a complete working two-way data binded application in less than 10 lines of code. Try and see
for yourself!

#### Testing Ready
AngularJS has Dependency Injection, i.e. it takes care of providing all the necessary dependencies
to its controllers and services whenever required. This helps in making the AngularJS code ready for
unit testing by making use of mock dependencies created and injected. This makes AngularJS more
modular and easily testable thus in turn helping a team create more robust applications.
