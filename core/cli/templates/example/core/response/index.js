import path from "path";
import cookie from "cookie";
import { sign } from "cookie-signature";

function Response(response, templateEngine, logger, viewPath, request) {
  response.status = function (statusCode) {
    this.statusCode = statusCode;
    return this;
  };

  response.req = request;

  response.send = function (message) {
    this.end(message);
  };

  response.set = function (key, value) {
    this[key] = value;
  };
  response.redirect = function (path, statusCode) {
    if (!statusCode) statusCode = 302;

    this.writeHead(statusCode, {
      Location: path,
    });
    this.end();
  };

  response.json = function (data) {
    this.setHeader("Content-Type", "application/json");
    return this.send(JSON.stringify(data));
  };

  response.renderTemplate = function (templatePath, data) {
    try {
      let startTime = new Date().getTime();
      let renderedHTML = "<template not found>";

      templatePath = path.resolve(viewPath, templatePath);
      templateEngine.renderFile(templatePath, data, {}, (err, str) => {
        if (err) {
          logger.log(err);
          return;
        }
        renderedHTML = str;

        let elapsedTime = (new Date().getTime() - startTime) / 1000.0;
        logger.info(`Templated loaded ${path} in ${elapsedTime} seconds`);
      });

      this.send(renderedHTML);
    } catch (error) {
      logger.error(error);
    }
  };

  response.clearCookie = function (name, options = {}) {
    var opts = { expires: new Date(1), path: "/", ...options };

    return this.cookie(name, "", opts);
  };

  response.cookie = function (name, value, options = {}) {
    // use cookie parser secret
    var secret = this.req.secret;
    var signed = options.signed;

    if (signed && !secret) {
      throw new Error('cookieParser("secret") required for signed cookies');
    }

    value =
      typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);

    if (signed) {
      value = "s:" + sign(value, secret);
    }

    // set expiry date use maximum age when provided
    if ("maxAge" in options) {
      options.expires = new Date(Date.now() + options.maxAge);
      options.maxAge /= 1000;
    }

    // set path
    if (options.path == null) {
      options.path = "/";
    }

    this.setHeader(
      "Set-Cookie",
      cookie.serialize(name, String(value), options)
    );

    return this;
  };
  return response;
}

export default Response;
