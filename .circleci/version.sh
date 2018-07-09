#!/bin/bash

source .bash_env

# exit with an error if NPM and pkg.json versions are identical
if [ "$NPM_VERSION" = "$PKG_VERSION" ] ; then
  echo "Package version ($PKG_VERSION) was not incremented."
  exit 1
fi

# iterate over each version (major, minor, patch)
IFS='. ' read -r -a npm_v <<< $NPM_VERSION
IFS='. ' read -r -a pkg_v <<< $PKG_VERSION

for i in `seq 0 2`
  do
    # exit with an error if any of the pkg.json versions is less than the corresponding
    # npm version
    if [ ${pkg_v[$i]} -lt ${npm_v[$i]} ] ; then
      echo "Package version ($PKG_VERSION) is behind published version ($NPM_VERSION)."
      exit 1
    fi
  done

echo "All good. Ready to publish version $PKG_VERSION."
exit 0
