#!/bin/bash

# Run this script from the root folder of the repository with:
# ./ci.sh

# Exit on first command that fails
set -e

echo "Checking JSHint"
jshint .
echo "JSHint checks were successful"

# Make sure our documentation is clean
#echo "Checking Yuidoc syntax"
#yuidoc --lint
#echo "Yuidoc checks were successful"

echo "Killing node and phantomjs processes"
pkill -9 phantomjs || true
pkill -9 node || true
rm -rf test-app/packages/tests-proxy

cd test-app
rm -rf .meteor/local

cd tests/cucumber
npm install
cd ../..

export VELOCITY_CI=1
export JASMINE_CLIENT_UNIT=0
export JASMINE_CLIENT_INTEGRATION=0
export JASMINE_SERVER_UNIT=0
export JASMINE_SERVER_INTEGRATION=1
#export VELOCITY_DEBUG=1

echo "Running tests..."

meteor --test
