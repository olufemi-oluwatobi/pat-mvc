import http from "http";
import ejs from "ejs";
import fs from "fs";
import { promisify } from "util";
import path from "path";
import nodeStatic from "node-static";
import BodyParser from "../middlewares/bodyParser";

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

  async run(port = 4001, hostname = "localhost") {
    this._controllers = await this._autoLoad("controllers/");

    const server = this._http.createServer((request, response) => {
      this.logger.info(`${request.method} - ${request.url}`);

      request.setEncoding("utf-8");

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

  async handle404(response, controller) {
    const errorView = path.resolve(this._baseDir, "public", "404.ejs");

    response.statusCode = 404;
    response.setHeader(
      "Content-Type",
      controller ? controller._renderData.contentType : "text/html"
    );

    response.end(this._renderTemplate(errorView));
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
      let template, templatePath, layout;

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
        request.params = {
          ...request.controller.data.params,
          ...resolvedData.params,
        };
        request.query = {
          ...resolvedData.query,
        };
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

        let errorView = path.resolve(this._baseDir, "public", "404.ejs");

        switch (controller._renderData.statusCode) {
          case 301:
            response.writeHead(301, controller._renderData.params);
            response.end();
            break;
          case 404:
            this.handle404(response, controller);
            break;
          case 500:
            errorView = path.resolve(this._baseDir, "public", "500.ejs");
            response.statusCode = 500;
            response.setHeader(
              "Content-Type",
              controller._renderData.contentType
            );

            response.end(
              this._renderTemplate(errorView, {
                error: controller._renderData.params.error,
              })
            );
            break;
          default:
            response.statusCode = controller._renderData.statusCode;
            response.setHeader(
              "Content-Type",
              controller._renderData.contentType
            );

            template = this._renderTemplate(controller._templatePath, {
              ...controller._localData,
              ...controller._globalData,
            });

            templatePath = path.resolve(
              this._baseDir,
              "views",
              "layouts",
              "application.ejs"
            );
            layout = this._renderTemplate(templatePath, {
              ...controller._globalData,
              ...request.controller.templateData,
              template,
            });
            response.end(layout);
            break;
        }
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

  _renderTemplate(path, data) {
    try {
      let startTime = new Date().getTime();
      let renderedHTML = "<template not found>";

      this._engine.renderFile(path, data, {}, (err, str) => {
        if (err) {
          this.logger.log(err);
          return;
        }
        renderedHTML = str;

        let elapsedTime = (new Date().getTime() - startTime) / 1000.0;
        this.logger.info(`Templated loaded ${path} in ${elapsedTime} seconds`);
      });

      return renderedHTML;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
    }
  }
}

export default Application;
