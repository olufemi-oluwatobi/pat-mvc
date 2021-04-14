import path from "path";

function Response(response, templateEngine, logger, viewPath) {
  response.status = function (statusCode) {
    this.statusCode = statusCode;
    return this;
  };

  response.send = function (message) {
    this.end(message);
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

  return response;
}

export default Response;
