## v1.0.0.rc.6

* Decoupled mirrors from the core so now mirrors can be authored as packages

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
