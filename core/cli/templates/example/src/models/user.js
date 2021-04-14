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
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }
  async hashPassword() {
    const password = await bcrypt.hash(this.password, 10);
    this.password = password;
  }
}
