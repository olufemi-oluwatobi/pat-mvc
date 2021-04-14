const mysql = require("mysql2");
const dbConfig = require("../../src/config/database");
const knex = require("knex");
const Attributes = {
  String: "string",
  Integer: "integer",
  Float: "float",
  Primary: "primary",
  DateTime: "datetime",
};

const Validators = {
  presenceOf: (attribute, model) => {
    if (!model._attributes[attribute].value) {
      model.errors.push(`${attribute} should be present`);
    }
  },
  isString: (attribute, model) => {
    const attributeValue = model._attributes[attribute].value;
    if (typeof attributeValue !== "string") {
      model.errors.push(`${attribute} should be a string`);
    }
  },
};
console.log(dbConfig.default);
const Client = knex({
  client: "mysql2",
  connection: dbConfig.default,
});

export { Attributes, Validators, Client };
