import Application from "../core/application";
import Router from "../core/router";
import cookieParser from "cookie-parser";
import verifyToken from "./middleware/verifyToken";
import createTable from "../runMigration";

//  migrate user table
createTable();

const router = new Router();
const BLACK_LISTED_ROUTES = [/^\/me/];

router.get("/", "UserController#index");
router.post("/signin", "UserController#register");
router.get("/login", "UserController#loginView");
router.get("/me", "UserController#me");
router.get("/logout", "UserController#logout");
router.post("/login", "UserController#login");

const app = new Application(router, __dirname);

// Set static folders
app.static(["stylesheets"]);

// Set middlewares
app.useMiddleWare(app.json());
app.useMiddleWare(cookieParser("Secret-session"));
app.useMiddleWare((req, res, next) => {
  const isWhiteListedRoute = !BLACK_LISTED_ROUTES.filter((route) =>
    route.test(req.url)
  ).length;

  if (isWhiteListedRoute) {
    next();
    return;
  }
  verifyToken(req, res, next);
});

app.run(8080);
