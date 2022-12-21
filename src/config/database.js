import mongoose from "mongoose";
import User from "../api/models/User.js";
import encryption from "../utils/encryption.js";

function seedAdmin() {
  User.find({ username: "admin" }).then((users) => {
    if (users.length === 0) {
      let pwd = "admin";
      let salt = encryption.generateSalt();
      let hashedPwd = encryption.generateHashedPassword(salt, pwd);

      let adminData = {
        username: "admin",
        salt: salt,
        password: hashedPwd,
        roles: ["Admin", "Critic"],
      };

      User.create(adminData).then((admin) => {
        console.log(`Seeded admin: ${admin.username}`);
      });
    }
  });
}

export default () => {
  mongoose.Promise = global.Promise;
  mongoose.connect(process.env.MONGO_URI);

  mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB.");
  });

  mongoose.connection.on("error", () => {
    console.log(
      "Error: Could not connect to MongoDB. Did you forget to run `mongod`?"
    );
  });

  seedAdmin();
};
