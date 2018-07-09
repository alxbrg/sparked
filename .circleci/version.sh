#!/bin/bash

# export $PKG_VERSION and $NPM_VERSION vars
source .bash_env

function fail () {
  echo "Version $PKG_VERSION has already been published." ; exit 1
}

function pass () {
  echo "All good. Ready to publish version $PKG_VERSION." ; exit 0
}

# fail if npm and package.json versions are identical
if [ "$NPM_VERSION" = "$PKG_VERSION" ] ; then fail ; fi

# iterate over each version (major, minor, patch)
IFS='. ' read -r -a npm_v <<< $NPM_VERSION
IFS='. ' read -r -a pkg_v <<< $PKG_VERSION

for i in `seq 0 2`
  do
    if   [ ${pkg_v[$i]} -gt ${npm_v[$i]} ] ; then pass
    elif [ ${pkg_v[$i]} -lt ${npm_v[$i]} ] ; then fail ; fi
  done
