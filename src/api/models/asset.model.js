import mongoose from "mongoose";
import { STATE } from "../../utils/enums.js";

const assetSchema = mongoose.Schema(
  {
    publicKey: {
      type: String,
      required: "Public Key is required",
      trim: true,
    },
    assetID: {
      type: String,
      required: "AssetID is required",
      unique: true,
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
    assetKeyPair: { type: String, required: "Encryption Object is required" },
    encryptionObject: {
      type: mongoose.Schema.Types.Mixed,
    },
    state: {
      type: String,
      enum: STATE,
      default: STATE.OWNED,
      required: true,
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

// Update state
assetSchema.pre("save", function (next) {
  const asset = this;

  if (!asset.isModified("encryptionObject")) {
    return next();
  }

  asset.state = STATE.TRANSFERD;
  return next();
});

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
