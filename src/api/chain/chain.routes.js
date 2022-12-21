import express from "express";
import controller from "./chain.controller.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post("/upload", upload.single("file"), controller.upload);
router.post("/download", upload.single("file"), controller.downloadAsset);
router.post("/searchAssetById", upload.fields(), controller.searchAssetById);
router.post(
  "/searchAssetByMetadata",
  upload.fields(),
  controller.searchAssetByMetadata
);

export default router;
