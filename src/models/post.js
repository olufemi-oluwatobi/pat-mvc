import * as Model from "../../core/models";

export default class Post extends Model.Base {
  setup() {
    this.setAttribute("title", Model.Attributes.String);
    this.setAttribute("content", Model.Attributes.String);
    this.validate("title", [
      Model.Validators.isString,
      Model.Validators.presenceOf,
    ]); // we can have multiple validators

    this.beforeSave(["prefixifyTitle"]);
    this.afterSave(["sufixifyContent"]);
  }

  prefixifyTitle() {
    if (this.title === "Mucho Gusto") {
      this.title = `Holla ${this.title}`;
    }
  }

  sufixifyContent() {
    if (this.content === "new content") {
      this.content = `new content-new`;
    }
  }
}
