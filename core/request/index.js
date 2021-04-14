function Request(request) {
  request.header = function (name) {
    if (!name) {
      throw new Error("Name is required");
    }
    if (typeof name !== "string") {
      throw new Error("Name must be a string");
    }
    return this.headers[name];
  };

  request.set = function (name, value) {
    if (!name) {
      throw new Error("Name is required");
    }
    if (typeof name !== "string") {
      throw new Error("Name must be a string");
    }

    this[name] = value;
  };

  request.get = function (prop) {
    return this[prop];
  };

  return request;
}

export default Request;
