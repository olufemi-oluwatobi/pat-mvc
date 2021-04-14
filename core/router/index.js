import pathToRegex from "path-to-regex";
import queryString from "query-string";

class Router {
  constructor() {
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      PATCH: {},
      DELETE: {},
    };
  }

  _persistPathData(verb, path, resolve) {
    if (!this.routes[verb][path]) {
      this.routes[verb][path] = resolve;
    }
  }

  _unserializePath(str) {
    str = decodeURIComponent(str);
    var chunks = str.split("&"),
      obj = {};
    for (var c = 0; c < chunks.length; c++) {
      var split = chunks[c].split("=", 2);
      obj[split[0]] = split[1];
    }
    return obj;
  }

  get(path, resolve) {
    this._persistPathData("GET", path, resolve);
  }

  post(path, resolve) {
    this._persistPathData("POST", path, resolve);
  }

  put(path, resolve) {
    this._persistPathData("PUT", path, resolve);
  }
  delete(path, resolve) {
    this._persistPathData("DELETE", path, resolve);
  }

  resolve(method, path) {
    const routes = this.routes[method];

    let data;
    Object.entries(routes).forEach(([routePath, resolve]) => {
      const parser = new pathToRegex(routePath);

      const { url, query } = queryString.parseUrl(path);

      const result = parser.match(url);
      //   const matcher = match(routePath);

      //   const response = matcher(path);
      if (result) {
        let [controller, action] = resolve.split("#");
        data = {
          controller,
          action,
          params: result,
          query,
        };
      }
    });
    return data;
  }
}

export default Router;
