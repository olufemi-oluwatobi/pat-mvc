PAT JS is a opinionated MVC web framework with node js and knex js. It was designed to resemble the architectural framework of ruby on rails

- This project is strictly experimental and for development purposes only
## Features

- CLI Scaffolding tool
- Async querying
- Inbuilt Routes
- Multi database compatibility
- Middlewares
- Cookie support
- Body parser

Pat uses a number of open source projects to work properly:

- [NodeJs]
- [Caporal] - a cli building tool
- [ShellJS] - Unix shell commands for Node.js 
- [Knew] Database Agnostic query builder

## Installation &nbsp;
**With [node](http://nodejs.org) [installed](http://nodejs.org/en/download):**
```sh
## Download patjs as global  package
$ npm install -g  git+https://github.com/olufemi-oluwatobi/pat-mvc.git
```
```
# Install all cli dependencies
$ npm install -g caporal shellJs prompt
```
```
## scaffold example with CLI tool
$ npx pat create example --name app
## Create new project
$ npx pat create new --name app
$ Run npm install in folder directory
$ Run <npm> or <yarn> start
```

For production environments...

```sh
npm install --production
NODE_ENV=production node app
```
##### Pat Js is also compatible with external ORM tools like sequelize, bookshelf etc

# ORM
With Pat, your ORM looks like this
```typescript
import * as Model from "../../core/models";
import bcrypt from "bcrypt";

export default class User extends Model.Base {
  setup() {
    this.setAttribute("email", Model.Attributes.String);
    this.setAttribute("name", Model.Attributes.String);
    this.setAttribute("password", Model.Attributes.String);
    this.validate("password", [
      Model.Validators.isString,
      Model.Validators.presenceOf,
    ]); // we can have multiple validators

    this.beforeSave(["hashPassword"]);
    this.afterSave(["indicateSaveSuccess"])
  }
  async hashPassword() {
    const password = await bcrypt.hash(this.password, 10);
    this.password = password;
  }
   async indicateSaveSuccess() {
    console.log("Saved")
  }
}
```

# Life cycle hooks
Patjs currently has 2 life cycle hooks, beforeCreate and beforeUpdate


   Call hook in `setUp` method has 
   `this.beforeSave(["hashPassword"]);` 
    `this.afterSave(['indicateSaveSuccess'])`
   Define hook as a class method
  `async hashPassword() {
    const password = await bcrypt.hash(this.password, 10);
    this.password = password;
  }`
 
## Set Attributes
PatJs currently has support for 4 attributes
    - String,
    - Integer,
    - Float,
    - Primary,
    - DateTime,

Use the `setAttribute` method to define model attributes. Model Attributes map directly to their respective table column.
`Patjs maps models to tables by pluralizing model names`

`this.setAttribute(name,attribute )`

## Attribute Validation
this.validate(attributeName, [validator]); // we can have multiple validators
There are currently two inbuilt validation methods
 -  Model.Validators.isString
 -  Model.Validators.presenceOf.

Custom validators can be created
```typescript
 validateName(attribute, model){
    if(model._attributes[attribute].value !== "foo"){
        model.error.push('${attribute} must have a value of foo')
        }
  }
```

# Framework

This is what the framework looks like
```typescript
import Application from "../core/application";
import Router from "../core/router";
import cookieParser from "cookie-parser";
import verifyToken from "./middleware/verifyToken";

const router = new Router();

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
app.useMiddleWare(verifyToken)

// Start server
app.run(8080);
```

### Framework Methods
`useMiddleWare` - this method is used for appending middleware function to the middlware stack.
```
    app.useMiddleWare((req, res, next) => {
            req.name = foo
            next()
    })
```

`static` is used for loading static paths. Static files are loaded from the public files at default.

```
    app.static(["stylesheets"]);
```

`json` is an method for parsing http request body to json.

```
    app.useMiddleWare(app.json());
```

# Basic Routing
Initiate router
```javascript
    const router = new Router()
```
Define route.
```
    router.get("/", "HomeController#index")
    router.post("/", "HomeController#create")
    router.get("/:id", "HomeController#show")
    router.delete("/", "HomeController#delete")
```
route  takes two properties 
    - Url path "/"
    - Controller string

Controller string maps directly to the corresponding method

```typescript
 import BaseController from "../../core/controller";
 import Post from "../models/post";

  export default class HomeController extends BaseController {
  async index(request, response) {
    response.status(200).renderTemplate("home/index.ejs", { helloWorld: "hello world" });
  }

  async show(req,res) {
    const { id } = this.params;
    res.status(200).json({id})
  }

  async create(req, res) {
    try {
      let post = new Post({ title: "new post", content: "new" });
      post = await post.save();
      
      // Check if request was saved
      if (post._persisted) {
        res.status(201).redirectTo(`/${post.id}`);
      } else {
        res.status(401).json({error: post.error});
      }
    } catch (error) {
      console.log(error);
    }
  }
}

`Home controller in controllers/home`
```
Set local Data
```typescript
    this.set({title: "foo"})
```
Controller Variables
```typescript
    console.log(this._localData.title) // foo
    console.log(this.__globalData.title) // bar  
```

# HTTP Response Methods

`Status` For setting HTTP Status code 
```
    res.status(200)
```
`send` is used for finalize request and to send response to the client
```
    res.send("done")
```

`redirect` is used for forwarding request to a new path or resource
```
    res.redirect("/", 200)
```

`json` is used parsing response body to JSON and finalizing request
```typescript
    res.json({data: true})
```

`renderTemplate` This is used for serving up templated strings to client
```
    res.renderTemplate("home/index.ejs",{hello:"world"})
```

`cookie` Is used for setting request cookie header 
```
    res.cookie("token", "cookie string",  { maxAge: 900000, httpOnly: true })
```

`clearCookie` 
```
    res.clearCookie("token", {})
```
