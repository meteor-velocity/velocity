## v0.10.4

* Removes deprecated CI logic

## v0.10.3

* Runs mirror with --once flag on CI

## v0.10.2

* Performance improvements
* A way to specify a different Meteor release for mirrors
  See: https://velocity.readme.io/v1.0/docs/use-with-older-meteor-release

## v0.10.1

* Use Meteor 1.2.0.2 for mirrors

## v0.10.0

* Compatibility with Meteor 1.2

## v0.9.3

* Reverts breaking change from velocity:METEOR
  (.meteor/packages file was no longer available in the mirror folder)

## v0.9.2

* Updates Velocity Meteor command line tool and some packages.
  This fixes some edge case issues and improves error logging in CI.

## v0.9.1

* Source maps support for server stack traces

## v0.9.0

* Source maps support for client stack traces

## v0.8.0

* Support for remote databases and multiple apps running at the same time
  ([Documentation](https://velocity.readme.io/docs/use-different-mongodb-server))

## v0.7.1

* Added Function.bind polyfill for PhantomJS

## v0.7.0

* Parallel execution support

## v0.6.4

* Fix for windows paths

## v0.6.3

* Don't print errors when a test frameworks hasn't implemented the experimental lifecycle hooks.
* Unblock longer running Velocity method calls for improved performance.

## v0.6.2

* Fixes performance issue when you have node_modules in your tests folder.
* Use velocity:METEOR@1.1.0.2_3 to spawn mirrors.

## v0.6.1

* Remove terminated mirrors from previous runs.
  Fixes that `meteor --test` is not exiting after first run.

## v0.6.0

* Support for Windows
* Improved mirrors
* Debugging mirrors

Make sure you read https://github.com/meteor-velocity/velocity/wiki/Changes-in-0.6.0.

## v0.5.1

* Prototype of testing lifecycle (run, reset, etc.)

## v0.5.0

* First cut of distributable support
* Removed default port of 5000 for mirrors and replaced with freeport.
* Fixed client side error with VELOCITY enabling 


## v0.4.6

* Mirror initializing and being ready are now part of the explicit logs so that users are aware
of the existence of mirrors.  

## v0.4.5

* Removed mirrorId and replaced with framework name. If frameworks wish to use multiple mirrors, 
they can manage this themselves

## v0.4.4

* Fixed mirror killing mechanism in node-soft-mirror by removing idomptency logic into mirror 
implementation
* Increased logging around mirror start/ready

## v0.4.3

* Fixes connection errors with old mirrors (#195)

## v0.4.2

* Adds missing checks to pass audit-argument-checks

## v0.4.1

* decoupled mirrors
* added Velocity.startup
* Decoupled mirrors from the core so now mirrors can be authored as packages
* Updated chokidar and now file watching only synced once

## v0.3.2

* Makes FileCopier more robust

## v0.3.0

* temporarily move off of rc track while issue https://github.com/meteor/meteor/issues/3147 is resolved

## v1.0.0.rc.6

* Decoupled mirrors from the core so now mirrors can be authored as packages
* Updated chokidar and now file watching only synced once

## v1.0.0.rc.5
??

## v1.0.0.rc.4

* Fixed bug in de-bouncing rsync
* Added NPM shrink
* Bumped npm dependency versions for chokadir, glob and freeport
* Increased mirror logging

## v1.0.0.rc.3

* Mirror output is now visible by default
* Mirrors now use DDP to notify frameworks of up-ness
* Fixed mirror dying on server restarts (YAY!)

## v1.0.0.rc.2
???

## v1.0.0.rc.1

* Updated to use Meteor 1.0
* mirror is disabled by default

### For Velocity plugin developers
* Rewrite mirroring approach
  * Mirrors no longer startup by default and have to be requested by frameworks using requestMirror
  * requestMirror now checks for existing mirrors by port and reuses them if they already exist
  * velocityMirrors can contain multiple entries even if the entries share the same port
  * frameworks can provide rootUrl when requesting mirrors
  * 

## v0.2.0

* Support for Meteor >= 0.9.1

### For Velocity plugin developers

* Added Velocity.registerTestingFramework as the new preferred way to register
  the testing framework to Velocity.

## v0.1.20

### For Velocity plugin developers

* velocityIsMirror now available as a Meteor method for clients to know where they are running
* Fixtures added through _addFixtures are now copied to the mirror
* Added a VelocityMirrors collection that contains mirror metadata
* Added preProcessors that run after an rsync but before starting a mirror
* Added postProcessors which run after all frameworks have finished


## v0.1.19

* add option to FileCopier to control when files are copied


## v0.1.18

* Improved error handling when the mirror cannot be started.
  Velocity will retry to start the mirror for 10 seconds before an error is shown.


## v0.1.17

* The mirror urls are now based on the parent ROOT_URL and MONGO_URL
* Velocity will now output the mirror log when the environment variable
  `VELOCITY_DEBUG_MIRROR` is set to a truey value


## v0.1.16

* FileCopier: Updated fs-extra dependency


## v0.1.15

* optimize searching for test packages
* FileCopier: Correctly handle when a file already exists in the mirror


## v0.1.12

* Passes audit-argument-checks now


### For Velocity plugin developers

* Added API for requesting mirrors
* Added API for resetting the database of the mirror
* Added FileCopier utility that can be used for copying test files into the mirror
* Added Velocity.getMirrorPath for getting the absolute mirror directoy path
* Added Velocity.getTestsPath for getting the absolute tests directory path


## v0.1.11

* remove example submodule; instruct how to use external repo instead
* update repo so users can ref velocity repo directly in smart.json


## v0.1.10

* Remove ref to unused mirror package


## v0.1.9

* Add copySampleTests Meteor method
* Use rsync mirroring
* Removed HTML reporter from 


## v0.1.8

* Erroneous release!


## v0.1.7

Added show/hide visibility toggle for every each report section with browser 
state persistence using amplify


## v0.1.6

Frameworks can now let Velocity know when they are complete, 
and the results will update on the UI.


## v0.1.5

Fix for report overlay when used in conjunction with accounts-*


## v0.1.4

Auto-detect velocity-compatible packages via `testPackages:true` in their smart.json files.


## v0.1.3

Murky ancient history...
