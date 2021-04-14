import BaseController from "../../core/controller";

export default class HomeController extends BaseController {
  controllerDir = __dirname;

  async index() {
    console.log("PostsController#index called from the controller");
  }

  async show() {
    console.log("PostsController#show called from the controller");
  }
}
