import { Attributes, Validators, Client } from "./helpers";

class Base {
  constructor(attrs = {}) {
    // set up table name
    this._tableName = this.constructor.name.toLowerCase() + "s";

    // check if attributs have been persisited
    this._persisted = false;

    this._beforeSaveHooks = [];
    this._afterSaveHooks = [];
    this._validationHooks = [];
    this._attributes = {};
    this._mututatedAttributes = [];

    this.errors = [];

    this._attributes["id"] = { type: Attributes.Primary, value: null };
    this._attributes["createdAt"] = { type: Attributes.DateTime, value: null };
    this._attributes["updatedAt"] = { type: Attributes.DateTime, value: null };

    this.id = null;
    this.createdAt = null;
    this.updatedAt = null;

    this.setup();

    if (Object.keys(attrs).length > 0 && attrs.constructor === Object) {
      this._setMassAttributes(attrs);
    }
  }

  // set model attributes
  setAttribute(attribute, type) {
    this._attributes[attribute] = { type, value: null };
    this[attribute] = null;
  }

  /**
   *
   * @param {Object} attribute entity attribute
   * @param {*} validator
   */
  validate(attribute, validator) {
    this._validationHooks.push({
      attribute,
      validator,
    });
  }

  /**
   * used for setting bulk attributes at once
   * @param {} attrs
   */
  _setMassAttributes(attrs) {
    for (let attr in attrs) {
      if (this._attributes[attr]) {
        this[attr] = attrs[attr];
        this._attributes[attr].value = attrs[attr];
      }
    }
  }

  /**
   * save data in data base
   * @returns
   */
  async save() {
    this._reloadAttributes();

    // execute before hooks before storing data
    await this._runBeforeSaveHooks();

    // Reload Attributes after running hooks
    this._reloadAttributes();

    this._checkValidations();

    if (this.errors.length) {
      //TODO: HANDLE VALIDATION ERRORS
      throw new Error(this.errors);
    } else {
      const data = this.buildQueryData();

      // if data has been persisited prior to current save execution,
      // update database  instead of insert
      const result = this._persisted
        ? await this._update(data)
        : await this._insert(data);

      // execute after save hooks
      await this._runAfterSaveHooks();
      return result;
    }
  }

  buildQueryData = () => {
    const attributeData = Object.assign(
      {},

      ...Object.entries(this._attributes).map(([key, value]) => {
        return { [key]: value.value };
      })
    );
    if (!attributeData.id) {
      delete attributeData.id;
    }
    return attributeData;
  };

  _checkValidations() {
    this._validationHooks.forEach((hook) => {
      if (Array.isArray(hook.validator)) {
        hook.validator.forEach((deepHook) => {
          if (typeof deepHook == "string") {
            this[deepHook]();
          } else {
            deepHook(hook.attribute, this);
          }
        });
      } else if (typeof hook.validator == "string") {
        this[hook.validator]();
      } else {
        hook.validator(hook.attribute, this);
      }
    });
  }

  /**
   *
   * @param {Object} params query params
   *
   * @returns
   */
  static async findAll(params = {}) {
    return await this._getAll(params);
  }

  static async findOne(params = {}) {
    const entity = new this();
    return await entity._getOne(params);
  }

  static async update() {
    const entity = new this();
    return await entity._update(this.attribute.id, this);
  }

  static async create(data) {
    const entity = new this();
    return await entity._insert(data);
  }

  static async _getAll(options) {
    try {
      let { where } = options;

      if (!where) {
        where = {};
      }

      let results = [];
      const obj = new this();

      const res = await Client.from(obj._tableName).select().where(where);
      res.forEach((row) => {
        const entity = new this();

        entity._setMassAttributes(row);

        entity._persisted = true;

        results.push(entity);
      });

      return results;
    } catch (error) {
      throw new Error(error);
    }
  }

  async _getOne(options) {
    let { where } = options;
    if (!where) {
      where = {};
    }
    try {
      const res = await Client.from(this._tableName)
        .select()
        .where(where)
        .first();
      if (!res) return res;
      this._setMassAttributes(res);
      this._persisted = true;
      return this;
    } catch (error) {
      throw new Error(error);
    }
  }

  async _insert(data) {
    try {
      let res = await Client.from(this._tableName).insert(data);
      res = await Client.from(this._tableName).select().where({ id: res[0] });
      this._setMassAttributes(res[0]);
      this._changedAttributes = [];
      this._persisted = true;
      return this;
    } catch (error) {
      throw new Error(error);
    }
  }

  async _update(finder = {}, newData = {}) {
    const res = await Client.from(this._tableName)
      .where(finder)
      .update(newData);
    this._setMassAttributes(res);
    this._changedAttributes = [];
    this._persisted = true;
    return this;
  }

  _reloadAttributes() {
    for (let attribute in this._attributes) {
      if (
        this._attributes[attribute].value != this[attribute] &&
        !this._mututatedAttributes.includes(attribute)
      ) {
        this._mututatedAttributes.push(attribute);
      }
      this._attributes[attribute].value = this[attribute];
    }
  }

  // get methods to be executed before save
  beforeSave(methods) {
    if (Array.isArray(methods)) {
      this._beforeSaveHooks = [...this._beforeSaveHooks, ...methods];
    } else {
      this._beforeSaveHooks.push(methods);
    }
  }

  afterSave(methods) {
    if (Array.isArray(methods)) {
      this._afterSaveHooks = [...this._beforeSaveHooks, ...methods];
    } else {
      this._afterSaveHooks.push(methods);
    }
  }

  // execute before save
  async _runBeforeSaveHooks() {
    // hooks are stores as strings
    for (let hook of this._beforeSaveHooks) {
      // execute model property that has hook  name
      await this[hook]();
    }
    return this;
  }

  async _runAfterSaveHooks() {
    for (let hook of this._afterSaveHooks) {
      await this[hook]();
    }
    return this;
  }
}

// Return only attributes on serialization
Base.prototype.toJSON = function () {
  return Object.assign(
    {},
    ...Object.entries(this._attributes).map(([key, value]) => ({
      [key]: value.value,
    }))
  );
};

export { Attributes, Validators, Base, Client };
