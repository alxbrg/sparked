'use strict';

class Model {
  /**
   * @param {object} options
   * @param {object} options.adapter database adapter
   * @param {string} options.name name of the model
   * @param {object} options.schema schema definition
   */
  constructor ({
    adapter,
    name,
    schema,
  }) {
    this._adapter = adapter;
    this._name = name;
    this._schema = schema;
  }

  /**
   * Performs an insert of an object or objects into the database.
   *
   * @param {(array|object)} objects object(s) to insert
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  create (objects, projection, options) {
    return this._adapter.create(this._name, objects, projection, options);
  }

  /**
   * Deletes all objects matching the conditions.
   *
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  delete (conditions, projection, options) {
    return this._adapter.delete(this._name, conditions, projection, options);
  }

  /**
   * Finds all objects matching the conditions.
   *
   * @param {object} conditions
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  find (conditions, projection, options) {
    return this._adapter.find(this._name, conditions, projection, options);
  }

  join (options) {
    return this._adapter.join(this._name, options);
  }

  /**
   * Updates all objects matching the conditions.
   *
   * @param {object} conditions
   * @param {object} updates updates to perform
   * @param {object} [projection] optional fields to return
   * @param {object} [options]
   *
   * @returns {promise} created objects
   */
  update (conditions, updates, projection, options) {
    return this._adapter.update(this._name, conditions, updates, projection, options);
  }
}

module.exports = Model;
