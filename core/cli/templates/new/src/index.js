import Application from "../core/application";
import Router from "../core/router";

const router = new Router();

router.get("/", "HomeController#index");

const app = new Application(router, __dirname);

// Set static folders
//app.static(["stylesheets"]);

// Set middlewares
app.useMiddleWare(app.json());

app.run(3000);
