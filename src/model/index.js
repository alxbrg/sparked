'use strict';

const { is } = require('ramda');

const Type = {
  Boolean: 'boolean',
  Buffer: 'buffer',
  Date: 'date',
  Dynamic: 'dynamic',
  Mixed: 'mixed',
  Number: 'number',
  String: 'string',
};

const Metadata = {
  created: {
    type: 'date',
    required: true,
    default: Date.now,
  },

  updated: {
    type: 'date',
    default: Date.now,
  },

  deleted: {
    type: 'date',
    default: Date.now,
  },

  archived: {
    type: 'date',
    default: Date.now,
  },
};

class Field {
  constructor ({
    type, // required

    default: _default,
    requiredOnCreate = false,
    requiredOnUpdate = false,
    unique = false,

    get,
    set,

    // dynamic
    ref,      // required if type === 'dynamic'
    resolver, // defaults to ref.find(value)

    // Validators:
    // custom
    validate: {
      validator,
      message,
    },

    // number
    min = -Infinity,
    max = Infinity,

    // string
    enum: _enum,
    minLength = 0,
    maxLength = Infinity,
    pattern,
  }) {
    this.type = type;
  }
};

class Model {
  constructor (schema) {
    this.fields = Object.keys(schema).map(field => is(Object, field)
      ? new Field(field)
      : new Field({ type: field })
    );
  }
}
