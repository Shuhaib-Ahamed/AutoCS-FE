import mongoose from "mongoose";
// import User from "../api/models/user.model.js";
// import encryption from "../utils/encrypt.js";
// import { Role } from "../utils/enums.js";

// function seedAdmin() {
//   User.find({ username: "admin" }).then((users) => {
//     if (users.length === 0) {
//       let pwd = "admin123";
//       let salt = encryption.generateSalt();
//       let hashedPwd = encryption.generateHashedPassword(salt, pwd);

//       let adminData = {
//         username: "admin",
//         salt: salt,
//         password: hashedPwd,
//         role: Role.ADMIN,
//       };

//       User.create(adminData).then((admin) => {
//         console.log(`Seeded admin: ${admin.username}`);
//       });
//     }
//   });
// }

export default () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Database Connected!!"))
    .catch((err) => {
      console.log(err);
    });
  // seedAdmin();
};
