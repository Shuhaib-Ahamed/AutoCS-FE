import f from "f";
import mongoose from "mongoose";

const assetSchema = mongoose.Schema(
  {
    publicKey: {
      type: String,
      required: "Public Key is required",
      trim: true,
    },
    assetTitle: {
      type: String,
      required: "Asset Title is required",
      trim: true,
    },
    assetDescription: {
      type: String,
      required: "Asset Description is required",
      trim: true,
    },
    encryptionObject: {
      type: String,
      required: "Encryption Object is required",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
