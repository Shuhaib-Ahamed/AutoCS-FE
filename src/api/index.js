import authRouter from "./auth/auth.routes.js";
import transactionRouter from "./transactions/transaction.routes.js";
import chainRouter from "./chain/chain.routes.js";

export default (app) => {

  // Server Routes

  app.use("/api/v1/auth", authRouter);

  app.use("/api/v1/transactions", transactionRouter);
  
  app.use("/api/v1/chain", chainRouter);
};
