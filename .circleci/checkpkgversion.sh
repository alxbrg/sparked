#!/bin/sh

export NPM_VERSION=$(npm view sparked version)
export PKG_VERSION=$(node -p "require('./package.json').version")

if [ "$NPM_VERSION" != "$PKG_VERSION" ]
then
  echo "Success!"
  exit 0
else
  echo "Package version not updated."
  exit 1
fi
