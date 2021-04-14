import { StringDecoder } from "string_decoder";
import qs from "querystring";

/**
 *
 * @param {Object} request http request object
 * @param {Object} response http response object
 * @param {Function} next function for trigering next middleware in middleware chain
 */
const BodyParser = (request, response, next) => {
  const decoder = new StringDecoder("utf-8");

  let payload = "";

  request.body = {};
  request.taste = "taste";

  if (!request.controller.data.params) request.controller.data.params = {};

  // on new data chunk
  request
    .on("data", (data) => {
      payload += decoder.write(data);
    })
    .on("end", () => {
      payload += decoder.end();
      const body = {
        ...qs.parse(payload),
      };
      request.set("body", body);
      next();
    });

  // on request end
};

export default BodyParser;
