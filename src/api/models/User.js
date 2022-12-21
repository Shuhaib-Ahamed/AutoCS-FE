import mongoose from "mongoose";
import encryption from "../../utils/encryption.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    roles: [{ type: String, required: true }],
    votes: { type: Number, default: 0 },
  },
  { collection: "users" }
);

userSchema.method({
  authenticate: function (password) {
    let hashedPassword = encryption.generateHashedPassword(this.salt, password);
    return hashedPassword === this.password;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
