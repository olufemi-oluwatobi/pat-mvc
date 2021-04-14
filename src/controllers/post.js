import BaseController from "../../core/controller";
import Post from "../models/post";
export default class PostController extends BaseController {
  async index() {
    const posts = await Post.findAll();
    this.set({ posts });
  }

  async show() {
    const { id } = this.params;
    const posts = await Post.findOne({ where: { id } });
    this.set({ posts });
    console.log("PostsController#show called from the controller");
  }

  async create() {
    try {
      let post = new Post({ title: "new post", content: "new" });
      post = await post.save();
      if (post._persisted) {
        console.log("create", post);
        this.redirectTo(`/posts/${post.id}`);
      } else {
        console.error("Some error occured");
      }
    } catch (error) {
      console.log(error);
    }
  }
}
