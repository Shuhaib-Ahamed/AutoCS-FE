import express from "express";
import controller from "./transaction.controller.js";

const router = express.Router();
router.post("/payments/", controller.sendPayment);
router.get("/payments/:id", controller.getAllPayments);
export default router;
