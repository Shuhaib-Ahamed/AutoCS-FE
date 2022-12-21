import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import bodyParser from "body-parser";
import errorHandler from "errorhandler";
import helmet from "helmet";
import cors from "cors";

export default function attachMiddleWares(app) {
  app.set("port", process.env.PORT || 9000);
  app.use(morgan("common"));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  // app.use(
  //   express.static(path.normalize(path.join(__dirname, "../../client/public")))
  // );
  app.use(
    session({ secret: "S3cr3t", saveUninitialized: false, resave: false })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(helmet());
  app.use(cors());
  app.use(errorHandler());

  //allow CORS remote origin OR : https://stackoverflow.com/questions/23751914/how-can-i-set-response-header-on-express-js-assets
  /*
      app.use((req, res, next) => {
          res.set({'connection': 'keep-alive'}) // OR = res.header(field, 'value') = res.set(field, 'value')
          res.append('Access-Control-Allow-Origin', ['*']); //append is same as res or set, but 
          next();
      });
      */

  // catch-all error handler
  /*
      app.use( (err,req,res,next) => {
          debug('%O', err);
          res.status(err.status || 500)
          
          return res.json(err);
      });
      */
}
