import Post from "../src/models/post";
import * as Models from "../core/models";

describe("constructor", () => {
  test("table name defined correctly", () => {
    const post = new Post();
    expect(post._tableName).toBe("posts");
  });

  test("default attributes defined correctly", () => {
    const post = new Post();

    expect(post.id).toBe(null);
    expect(post._attributes["id"].value).toBe(null);
    expect(post.createdAt).toBe(null);
    expect(post._attributes["createdAt"].value).toBe(null);
    expect(post.updatedAt).toBe(null);
    expect(post._attributes["updatedAt"].value).toBe(null);
  });
});

describe("hooks", () => {
  test("mutate attributes", async () => {
    const post = new Post();
    post.title = "My new post";
    post.content = "Content here";
    let postSaved = await post.save();

    expect(post.errors.length).toBe(0);
    expect(post._attributes["title"].value).toBe("My new post");
    expect(post._attributes["content"].value).toBe("Content here");
    expect(post._mututatedAttributes).toEqual(["title", "content"]);
  });

  test("mass mutate attributes", async () => {
    const post = new Post({ title: "My new post", content: "Content here" });
    let postSaved = await post.save();

    expect(post.errors.length).toBe(0);
    expect(post._attributes["title"].value).toBe("My new post");
    expect(post._attributes["content"].value).toBe("Content here");
    expect(post._mututatedAttributes).toEqual([]);
  });
});

describe("finder functions", () => {
  beforeAll(async () => {
    await Models.Client("posts").insert([
      {
        title: "First post",
        content: "My content",
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    ]);
  });

  afterAll(async () => {
    return await Models.Client.select("TRUNCATE TABLE posts RESTART IDENTITY;");
  });

  test("find a post with a valid ID", async () => {
    const post = await Post.findOne({ where: { id: 1 } });

    expect(post._persisted).toBe(true);
    expect(post.id).toBe(1);
    expect(post.title).toBe("First post");
    expect(post.content).toBe("My content");
  });

  test("find all posts", async () => {
    const posts = await Post.findAll();

    expect(posts[0].title).toBe("First post");
  });
});

describe("Create/Insert functions", () => {
  afterAll(async () => {
    return await Models.Client.select("TRUNCATE TABLE posts RESTART IDENTITY;");
  });

  test("create a post", async () => {
    let post = new Post({
      title: "First Post",
      content: "My content",
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    });

    post = await post.save();

    expect(post._persisted).toBe(true);
    expect(post.title).toBe("First Post");
    expect(post.content).toBe("My content");
  });

  test("find all posts", async () => {
    const posts = await Post.findAll();

    expect(posts[0].title).toBe("First post");
  });
});

describe("Life cycle hooks", () => {
  test("execute before save", async () => {
    let post = new Post({
      title: "Mucho Gusto",
      content: "new content",
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    });

    post = await post.save();

    expect(post._persisted).toBe(true);
    expect(post.title).toBe("Holla Mucho Gusto");
    expect(post.content).toBe("new content-new");
  });
});
