import { success } from "../../utils/responseApi.js";
import chainService from "./chain.service.js";

export default {
  uploadAsset: async (req, res, next) => {
    try {
      const result = await chainService.upload(req);
      success(res, 200, result);
    } catch (error) {
      return next(error);
    }
  },

  transferAsset: async (req, res, next) => {
    try {
      const result = await chainService.transferAsset(req.body);
      success(res, 200, result);
    } catch (error) {
      console.log(error);
      return next(error);
    }
  },

  downloadAsset: async (req, res, next) => {
    try {
      const result = await chainService.downloadAsset(req.body);
      success(res, 201, result);
    } catch (error) {
      return next(error);
    }
  },
  searchAssetById: async (req, res, next) => {
    try {
      const result = await chainService.searchAssetById(req.body);
      success(res, 201, result);
    } catch (error) {
      return next(error);
    }
  },
  searchAssetByMetadata: async (req, res, next) => {
    try {
      const result = await chainService.searchAssetByMetadata(req.body);
      success(res, 201, result);
    } catch (error) {
      return next(error);
    }
  },
};
