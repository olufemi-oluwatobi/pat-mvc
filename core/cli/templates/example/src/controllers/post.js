import BaseController from "../../core/controller";
import Post from "../models/post";

// THIS FOLDER IS FOR SHOWING THE FULL CAPABILITY OF THE ORM
export default class PostController extends BaseController {
  async index(request, response) {
    response.status(301);
    response.renderTemplate("home/index.ejs", { helloWorld: "hello world" });
  }

  async show() {
    const { id } = this.params;
    const posts = await Post.findOne({ where: { id } });
    this.set({ posts });
  }

  async create() {
    try {
      let post = new Post({ title: "new post", content: "new" });
      post = await post.save();
      if (post._persisted) {
        this.redirectTo(`/posts/${post.id}`);
      } else {
        console.error("Some error occured");
      }
    } catch (error) {
      console.log(error);
    }
  }
}
