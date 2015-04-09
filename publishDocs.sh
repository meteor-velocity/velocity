#! /bin/bash
set -e
set -u

rm -rf .build || true
rm -rf docs || true
branch=$(git rev-parse --abbrev-ref HEAD)
yuidoc .
mv docs /tmp/docs
git checkout gh-pages
mv /tmp/docs docs
git add docs
git commit --author "Velocity Robot <robot@meteorvelocity.com>" --message "Update docs"
git push --force origin gh-pages
git checkout -b $branch
