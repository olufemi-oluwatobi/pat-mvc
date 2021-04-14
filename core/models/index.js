import { Attributes, Validators, Client } from "./helpers";

class Base {
  constructor(attrs = {}) {
    // set up table name
    this._tableName = this.constructor.name.toLowerCase() + "s";
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

  setAttribute(attribute, type) {
    this._attributes[attribute] = { type, value: null };
    this[attribute] = null;
  }

  validate(attribute, validator) {
    this._validationHooks.push({
      attribute,
      validator,
    });
  }

  _setMassAttributes(attrs) {
    for (let attr in attrs) {
      if (this._attributes[attr]) {
        this[attr] = attrs[attr];
        this._attributes[attr].value = attrs[attr];
      }
    }
  }

  async save() {
    this._reloadAttributes();
    this._runBeforeSaveHooks();
    this._checkValidations();
    if (this.errors.length) {
      //TODO: HANDLE VALIDATION ERRORS
      throw new Error(this.errors);
    } else {
      const data = this.buildQueryData();
      console.log("has been persisited", this._persisted);
      const result = this._persisted
        ? await this._update(data)
        : await this._insert(data);
      this._runAfterSaveHooks();
      console.log(result);
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
      console.log(res);
      this._setMassAttributes(res[0]);
      this._changedAttributes = [];
      this._persisted = true;
      console.log(this.id);
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

  // HOOKS
  beforeSave(methods) {
    if (Array.isArray(methods)) {
      this._beforeSaveHooks = [...this._beforeSaveHooks, ...methods];
    }
    this._beforeSaveHooks.push(methods);
  }

  afterSave(methods) {
    if (Array.isArray(methods)) {
      this._afterSaveHooks = [...this._beforeSaveHooks, ...methods];
    }
    this._afterSaveHooks.push(methods);
  }

  _runBeforeSaveHooks() {
    this._beforeSaveHooks.forEach((method) => {
      this[method]();
    });
    return this;
  }

  _runAfterSaveHooks() {
    this._afterSaveHooks.forEach((method) => {
      this[method]();
    });
    return this;
  }
}

export { Attributes, Validators, Base, Client };
