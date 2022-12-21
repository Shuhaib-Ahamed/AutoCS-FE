import passport from "passport";
import LocalPassport from "passport-local";
import User from "../api/models/User.js";

export default () => {
  passport.use(
    new LocalPassport((username, password, done) => {
      User.findOne({ username: username }).then((user) => {
        if (!user) {
          return done(null, false);
        }
        if (!user.authenticate(password)) {
          return done(null, false);
        }

        return done(null, user);
      });
    })
  );

  passport.serializeUser((user, done) => {
    if (user) {
      return done(null, user._id);
    }
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    });
  });
};
