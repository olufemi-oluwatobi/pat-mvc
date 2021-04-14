import BaseController from "../../core/controller";
import User from "../models/user";
import generateToken from "../helpers/generateToken";

export default class UserController extends BaseController {
  async index(request, response) {
    response.renderTemplate("home/signin.ejs", { helloWorld: "hello world" });
  }

  async loginView(request, response) {
    response.renderTemplate("home/login.ejs", { helloWorld: "hello world" });
  }

  async show() {
    const { id } = this.params;
    const posts = await Post.findOne({ where: { id } });
    this.set({ posts });
  }

  async register(req, res) {
    try {
      const { email, password, name } = req.body;
      let user = await User.findOne({ where: { email } });
      if (user) {
        res.renderTemplate("home/signin.ejs", {
          error: "Email has been taken",
        });
        return;
      }
      user = new User({ email, password, name });
      user = await user.save();

      if (user._persisted) {
        res.status(201).redirect("/login");
      } else {
        response.renderTemplate("home/signin.ejs", { error: user.errors });
      }
    } catch (error) {
      res.status(500).json({ error: error.toString() });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      let user = await User.findOne({ where: { email } });
      if (!user) {
        res.renderTemplate("home/login.ejs", {
          error: "Invalid Email or Password",
        });
        return;
      }
      const isCorrectPassword = await user.validatePassword(password);

      if (!isCorrectPassword) {
        res.renderTemplate("home/login.ejs", {
          error: "Invalid Email or Password",
        });
        return;
      }

      generateToken(res, user.id, user.email);

      res.status(200).redirect(`/me`);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.toString() });
    }
  }
  async me(req, res) {
    try {
      const { id } = req.user;
      let user = await User.findOne({ where: { id } });
      res.renderTemplate("home/me.ejs", {
        user,
      });
    } catch (error) {
      res.status(500).json({ error: error.toString() });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie("token", {}).redirect("/");
    } catch (error) {
      res.status(500).json({ error: error.toString() });
    }
  }
}
