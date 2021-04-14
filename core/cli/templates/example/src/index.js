import Application from "../core/application";
import Router from "../core/router";

const router = new Router();

router.get("/", "HomeController#index");
router.get("/posts", "PostController#index");
router.post("/posts", "PostController#create");
router.get("/posts/:id", "PostController#show");

const app = new Application(router, __dirname);
app.static(["stylesheets"]);
app.useMiddleWare(app.json());
app.run(8080);
