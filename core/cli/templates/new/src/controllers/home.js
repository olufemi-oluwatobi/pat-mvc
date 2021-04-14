import BaseController from "../../core/controller";

export default class HomeController extends BaseController {
  async index(request, response) {
    response.status(200).json({ success: true, message: "Hello" });
  }
}
