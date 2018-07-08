'use strict';

const { all, curry, is } = require('ramda');

const isArrayOf = curry((Ctor, val) => is(Array, val) && all(is(Ctor))(val));

module.exports = isArrayOf;
