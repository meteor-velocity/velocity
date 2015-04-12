Velocity
========

Test runner (and community) for Meteor apps.  Under heavy development.

### What is Velocity?
Head over to the [official homepage](http://velocity.meteor.com) 

Find out more by watching the [Intro to Velocity](http://youtu.be/kwFv1mXrLWE?t=40m51s) talk that
 Robert, Sam, and Mike did at the June 2014 Meteor Devshop!

Read more in the [free chapter on Velocity in The Meteor Testing Manual](http://www.meteortesting.com/chapter/velocity)

### Getting Started

The Velocity package itself is not something that you include, rather you use Velocity-compatible
framework. 

To see frameworks in action, have a look at the [velocity-examples](https://github.com/meteor-velocity/velocity-examples) repository.
 
### Troubleshooting

Sometimes things break and its useful to get more debugging info.  Most of the test frameworks 
support some kind of debugging environment variable flag.  You can usually see a lot more details
about what's happening if you run your app with this command:

```bash
$ DEBUG=1 JASMINE_DEBUG=1 VELOCITY_DEBUG=1 VELOCITY_DEBUG_MIRROR=1 meteor
```

### Reporting bugs

Please report bugs directly on the issues of the framework(s) you are using. Framework authors 
will then post issues to the core if they are core issues.

##Velocity Compatible Packages

### Frameworks

Below is a list of the currently available frameworks.

Most of these frameworks have an example in the [velocity-examples](https://github.com/meteor-velocity/velocity-examples) repository, and have a set of sample tests that can be added to your project.

* [sanjo:jasmine](https://github.com/Sanjo/meteor-jasmine) - Write client and server unit and integration tests with Jasmine.
* [mike:mocha](https://github.com/mad-eye/meteor-mocha-web) - A Velocity version of mocha-web. Runs mocha tests in the Meteor context which is great for integration testing.
* [xolvio:cucumber](https://github.com/xolvio/meteor-cucumber) - Use Gherkin-syntax cucumber to 
test your app. Includes PhantomJS and Selenium as well as SauceLabs support. 
* [clinical:nightwatch](https://github.com/awatson1978/clinical-nightwatch) - run acceptance tests with automated browsers using the Nightwatch bridge to Selenium
* [nblazer:casperjs](https://github.com/blazer82/meteor-casperjs/) - [CasperJS](http://casperjs.org) end to end test integration 
* [rsbatech:robotframework](https://github.com/rjsmith/meteor-robotframework) - [Robot Framework](http://robotframework.org/) end to end test integration using Selenium and many other [test libraries](http://robotframework.org/#test-libraries)

A lot more information on these frameworks can be found on the [Velocity website](http://velocity.meteor.com/) and in their respective repositories.

### Reporters

Reporters display test results.

* [velocity:html-reporter](https://github.com/meteor-velocity/html-reporter/) - Adds an overlay to your app indicating test success/failure (green/red dot in top right).  Click dot for test details.  `meteor add velocity:html-reporter`
* [velocity:console-reporter](https://github.com/meteor-velocity/console-reporter/) - Reports test run results to the console.  `meteor add velocity:console-reporter`

### Mirrors

Mirrors are used by test frameworks to run tests within. Tests are typically destructive and as such
require a different database. Mirrors run a parallel version of your app with a different 
database as not to intrude on the main development workflow.

### Other

* [xolvio:webdriver](https://github.com/xolvio/meteor-webdriver) - Adds webdriver.io to any test 
framework for UI testing. Uses PhantomJS in GhostDriver mode for ultra-fast UI testing

## Test Framework Authors

We would love to add your framework to the list!  Take a look at how some of these interface with velocity and let us know about your framework on the [velocity-core](https://groups.google.com/forum/#!forum/velocity-core) google group.

Please see the [velocity-wiki](https://github.com/meteor-velocity/velocity/wiki/How-to-integrate-a-test-framework-with-Velocity) for basic instructions on making your test framework work with Velocity.

Also, be sure to check out the documentation for the public API.  You can view them in the browser by cloning this repo and then running: `open docs/classes/Velocity.html`
 
A few notes on being velocity-compatible:

### Register testing framework to Velocity

Use `Velocity.registerTestingFramework(frameworkName, options)` to register your package as testing framework. You can find a description of the expected arguments in the docs.


### Sample Tests

Please put some sample tests in a directory named `sample-tests` at the root of your package. 
These will be used by the velocity-quick-start package and also allows users to click a button 
in the html-reporter to have them added to their apps.

### Fixtures / Test Data
A good pattern for creating fixtures is to do the following inside your app:

```bash
meteor create --package fixtures
```

Then modify the package.js file to set the `debugOnly` flag to true like this:
```javascript
Package.describe({
  name: 'fixtures',
  version: '0.0.1',
  debugOnly: true,
  // ...
});
```
The `debugOnly` flag instruct Meteor not to bundle this package when building, which is how you 
ensure this package does not make it to production. You can now define all your fixtures in this 
package.


### Debug output

Please include a way to get more detailed info about your frameworks' test runs.  

One way that we've done it is by having an environment flag that the user can set.  Feel free to use `VELOCITY_DEBUG` if you'd like.  

For example, you could write your logging like this:

    var DEBUG = process.env.VELOCITY_DEBUG;
    DEBUG && console.log('[my-framework] helpful debugging info', someVar)

### Writing a new Mirror Package

See [instructions here](https://github.com/meteor-velocity/velocity/wiki/How-to-Write-a-Mirror-Package)

## For velocity:core code contributors

### Developing on velocity:core

#### Getting started

##### 1. Clone the repository

```bash
git clone git@gthub.com:meteor-velocity/velocity.git velocity-core
cd velocity-core
```

##### 2. Setup Git Flow

We ue Git Flow with the standard branch names.
Look at the [cheatsheet](http://danielkummer.github.io/git-flow-cheatsheet/)
for an introduction and installation instructions.

When you have installed Git Flow, make sure that you have the local branches
`develop` an `master` and do this in the velocity-core folder:

```bash
git flow init -d
git config gitflow.prefix.versiontag v
```

##### 3. Testing

We use:

* [xolvio:cucumber](https://github.com/xolvio/meteor-cucumber) for end-to-end tests
* [sanjo:jasmine](https://github.com/Sanjo/meteor-jasmine) for integration and unit tests

You can run the tests with: `./ci.sh`

Add or edit tests in: `test-app/tests/`.

##### 4. Code conventions

We JSHint to ensure a common code style. It's also part of our CI.

##### 5. Contribute and ask questions

Now you know the basics of how to contribute code to velocity:core.
Make sure that you get in contact with the other core contributors before
you do something bigger. We use Slack where you can communicate with the team.
You can ask questions there.

### Publishing a new version

Replace X.X.X in the following steps with the version that you release.
Make sure that you follow the [Semver](http://semver.org/) conventions for increasing the version.

1. Pull the latest changes from the branch `develop`
1. Start a release with: `git flow release start X.X.X`
3. Update History.md with summary ofchanges
4. Bump version numbers in package.js and yuidoc.json
5. Publish to Meteor with: `meteor publish`
6. Commit release changes with the commit message "Release of X.X.X".
7. Finish the release with: `git flow release finish -p X.X.X`

### Meteor Method Naming Convention

We have two naming schemas:

1. When the method does something with a resource type: `velocity/<RESOURCE_NAME>/<ACTION>`
2. When the method isn't specific to a resource type: `velocity/<ACTION>`

All parts are camelCase and start with a lowercase letter.

##Contributors

We are collaborating with an all-star team on unifying the Meteor testing landscape:

* [Sam Hatoum](https://github.com/samhatoum) from [Xolv.io](http://xolv.io/), author of [The Meteor Testing Manual](https://www.meteortesting.com)
* [Adrian Lanning](https://github.com/alanning) from [Share911](http://about.share911.com/), contributor to [all things Meteor](https://github.com/alanning?tab=repositories)
* [Mike Risse](https://github.com/rissem) from [MadEye](https://madeye.io/), author of [mocha-web](https://github.com/mad-eye/meteor-mocha-web)
* [Ronen Babayoff](https://github.com/ronen-lavaina) from LaVaina Inc, co-author of [Munit](https://github.com/spacejamio/meteor-munit)
* [Abigail Watson](https://github.com/awatson1978) from [Pentasyllabic](http://www.pentasyllabic.com), author of [Meteor Cookbook](https://github.com/awatson1978/meteor-cookbook), [Selenium-Nightwatch](https://github.com/awatson1978/selenium-nightwatch/)
* [Robert Dickert](https://github.com/rdickert) from [Meteor Boulder](http://www.meetup.com/Meteor-Boulder), contributor to [all things Meteor](https://github.com/rdickert?tab=repositories)
* [Josh Owens](https://github.com/queso) from [Differential](http://differential.io/), author of [Testing with Meteor](http://testingmeteor.com/)
* [Jonas Aschenbrenner](https://github.com/sanjo), velocity contributor, [Jasmine](https://github.com/Sanjo/meteor-jasmine) package
* [Richard Smith](https://github.com/rjsmith) from [RSBA Technology Ltd](http://www.rsbatechnology.co.uk), author of [Meteor-RobotFramework](https://github.com/rjsmith/meteor-robotframework)

For general questions about testing, check out [Testing](https://forums.meteor.com/c/testing) on the Meteor forums.

For specific questions about velocity core, please post in [Velocity Core](https://forums.meteor.com/c/testing/velocity-core).
