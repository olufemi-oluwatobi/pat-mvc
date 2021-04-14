import http from "http";
import ejs from "ejs";
import fs from "fs";
import { promisify } from "util";
import path from "path";
import nodeStatic from "node-static";
import BodyParser from "../middlewares/bodyParser";
import Response from "../response";
import Request from "../request";

class Application {
  constructor(router, baseDir) {
    this._http = http;
    this._baseDir = baseDir;
    this._engine = ejs;
    this._router = router;

    this._static = new nodeStatic.Server(path.resolve(this._baseDir, "public"));
    this._controllers = {};
    this._middlewares = [];
    this._staticRoutes = {};
    this._staticRoutes = [];

    this.logger = {
      info: (msg) => console.log(`INFO - ${msg}`),
      error: (msg) => console.log(`ERROR -${msg}`),
      debug: (msg) => console.log(`DEBUG - ${msg}`),
      log: (msg) => console.log(msg),
    };
  }

  // Use body parser middle ware
  json() {
    return BodyParser;
  }

  /**
   *
   * @param {Object} request http request object
   * @param {*} response http response object
   */

  _executeMiddleWareChain(request, response) {
    const middlewares = this._middlewares;
    // initial middleware index
    let index = 0;

    // current middleware on being executed
    let layer;

    const next = () => {
      //
      layer = middlewares[index++];

      if (!layer) {
        return;
      }
      layer(request, response, next);
    };
    next();
  }

  static(staticRoutes) {
    this._staticRoutes = staticRoutes || [];
  }

  _loadStaticRoutes(request, response) {
    const reqUrl = request.url.split("/")[1];
    if (this._staticRoutes && this._staticRoutes.includes(reqUrl)) {
      // on request end, serve static files
      request
        .addListener("end", () => {
          this._static.serve(request, response);
        })
        .resume();
      return true;
    } else {
      return false;
    }
  }

  set(key, value) {
    if (["*", "error"].includes(key) && typeof value !== "function") {
      throw new Error(`${key} middleware type must be a function`);
    }
    this[set] = value;
  }

  async run(port = 4001, hostname = "localhost") {
    const viewPath = path.resolve(this._baseDir, "views");

    this._controllers = await this._autoLoad("controllers/");

    const server = this._http.createServer((request, response) => {
      this.logger.info(`${request.method} - ${request.url}`);

      request.setEncoding("utf-8");

      // Instantiate framework request object
      request = new Request(request);

      // Instantiate framework response object
      response = new Response(response, this._engine, this.logger, viewPath);

      request.controller = { data: {}, templateData: {} };

      const hasStaticData = this._loadStaticRoutes(request, response);
      if (!hasStaticData) {
        this._executeMiddleWareChain(request, response);
        this._resolveResponse(request, response);
      }
    });

    server.listen(port, hostname, () => {
      this.logger.info(`Server running at http://${hostname}:${port}/`);
    });
  }

  async handle404(request, response) {
    // Check for 404 handler
    response.status(404);

    if (this["*"]) {
      this["*"](request, response);
    } else {
      response.setHeader("Content-Type", "text/plain");

      response.end("Resource not found");
    }
  }

  /**
   *
   * @param {function} middleware new middleware to be appended to middleware chain
   *
   * appends a new middleware to middleware chain
   */
  useMiddleWare(middleware) {
    this._middlewares = [...this._middlewares, middleware];
  }

  /**
   *
   * @param {*} request http request object
   * @param {*} response http response object
   *
   */

  async _resolveResponse(request, response) {
    try {
      const requestTime = new Date().getTime();

      // resolve router data
      const resolvedData = this._router.resolve(request.method, request.url);

      if (!resolvedData) {
        this.handle404(response);
      } else {
        this.logger.info(
          `Request processing ${resolvedData.controller}.${resolvedData.action}`
        );
        const controllerName = resolvedData.controller
          .replace("Controller", "")
          .toLowerCase();

        const params = {
          ...request.controller.data.params,
          ...resolvedData.params,
        };

        const query = {
          ...resolvedData.query,
        };

        request.set("params", params);
        request.set("query", query);

        let controller = new this._controllers[controllerName](
          request,
          response
        );

        // append param data to request controller data
        request.controller.data.params = {
          ...request.controller.data.params,
          ...resolvedData.params,
        };

        // append controller query to request controller data
        request.controller.data.query = {
          ...resolvedData.query,
        };

        // execute controller
        controller = await controller.run(
          resolvedData.action,
          request.controller.data,
          this._baseDir
        );
        // console.log(cont)

        // let errorView = path.resolve(this._baseDir, "public", "404.ejs");

        // switch (controller._renderData.statusCode) {
        //   case 301:
        //     response.writeHead(301, controller._renderData.params);
        //     response.end();
        //     break;
        //   case 404:
        //     this.handle404(response, controller);
        //     break;
        //   case 500:
        //     errorView = path.resolve(this._baseDir, "public", "500.ejs");
        //     response.statusCode = 500;
        //     response.setHeader(
        //       "Content-Type",
        //       controller._renderData.contentType
        //     );

        //     response.end(
        //       this._renderTemplate(errorView, {
        //         error: controller._renderData.params.error,
        //       })
        //     );
        //     break;
        //   default:
        //     response.statusCode = controller._renderData.statusCode;
        //     response.setHeader(
        //       "Content-Type",
        //       controller._renderData.contentType
        //     );

        //     template = this._renderTemplate(controller._templatePath, {
        //       ...controller._localData,
        //       ...controller._globalData,
        //     });

        //     templatePath = path.resolve(
        //       this._baseDir,
        //       "views",
        //       "layouts",
        //       "application.ejs"
        //     );
        //     layout = this._renderTemplate(templatePath, {
        //       ...controller._globalData,
        //       ...request.controller.templateData,
        //       template,
        //     });
        //     response.end(layout);
        //     break;
        // }
      }

      // check how long it took to execute request
      let elapsedTime = (new Date().getTime() - requestTime) / 1000;

      this.logger.info(`Request finished in ${elapsedTime} seconds`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  // load mvc folder
  async _autoLoad(folder) {
    let files = {};
    const folderPath = path.resolve(this._baseDir, folder);
    const readDir = promisify(fs.readdir);

    // read directory and extract all files
    const folderFiles = await readDir(folderPath);

    folderFiles.forEach(async (file) => {
      const filePath = path.resolve(this._baseDir, folder, file);
      let { default: _import } = await import(filePath);
      files[file.replace(".js", "")] = _import;
    });
    return files;
  }
}

export default Application;
