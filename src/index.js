import express from "express";
import routes from "./api/index.js";
import { failed } from "./utils/responseApi.js";
import expresConfig from "./middlewares/express.js";
import passport from "./middlewares/passport.js";
import database from "./config/database.js";
import * as dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 9000;

// Initialize Database
database();

/**
 * Enable cors & helmet
 */

// Initialize passport (some login mechanism)
passport();

// Attach middleares
expresConfig(app);

/**
 * Transform Payload.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Check API health.
 */
app.get(`/`, (req, res) => {
  res.send("SERVER IS UP AND RUNNING!");
});

/**
 * SERVERS APIs
 */
routes(app);

/**
 * Catch 404 and forward to error handle.
 */
app.use((req, res, next) => {
  const err = new Error("Resource Not Found");
  console.log(err);
  err["status"] = 404;
  next(err);
});

/**
 * Global error catcher.
 */
app.use((err, req, res, next) => {
  console.log(err);
  failed(res, err.status || 500, err.message);
});

app.listen(port, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  console.log(`Server listening on port: ${port}`);
});
