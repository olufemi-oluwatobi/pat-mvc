import path from "path";
export default class BaseController {
  constructor(request, response) {
    this._localData = {};
    this._globalData = {};
    this._templatePath = "";
    this.request = request;
    this.response = response;
    this.status = 200;
    this._renderData = {
      statusCode: 200,
      contentType: "text/html",
      params: {},
      query: {},
    };
  }

  async run(action, data = {}, baseDir) {
    if (!this[action]) {
      this._renderData.statusCode = 404;
    } else {
      try {
        Object.entries(data).map(([key, value]) => {
          this[key] = value;
        });
        await this[action](this.request, this.response);
      } catch (err) {
        this.response.status(500).send(error);
      }
    }
    return this;
  }

  set(keys, data) {
    if (typeof keys === "object") {
      for (let i in keys) {
        this.set(i, keys[i]);
      }
    } else {
      this._localData[keys] = data;
    }
  }

  redirectTo(path) {
    this._renderData = {
      statusCode: 301,
      contentType: "",
      params: {
        Location: path,
      },
    };
  }

  setGlobal(keys, data) {
    if (typeof keys === "object") {
      for (let i in keys) {
        this.set(i, key[i]);
      }
    } else {
      this._globalData[keys] = data;
    }
  }

  _controllerPath() {
    return this.constructor.name.replace("Controller", "").toLowerCase();
  }
}
