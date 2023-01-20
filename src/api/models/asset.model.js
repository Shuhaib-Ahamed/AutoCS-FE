import mongoose from "mongoose";
import { STATE } from "../../utils/enums.js";

const assetSchema = mongoose.Schema(
  {
    publicKey: {
      type: String,
      required: "Public Key is required",
      trim: true,
    },
<<<<<<< Updated upstream
    assetID: {
      type: String,
      required: "AssetID is required",
      unique: true,
    },
=======
>>>>>>> Stashed changes
    assetTitle: {
      type: String,
      required: "Asset Title is required",
      trim: true,
<<<<<<< Updated upstream
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
=======
      unique: true,
    },
    assetData: {
      type: String,
      required: "Asset Data is required",
    },
    assetPrice: {
      type: Number,
      required: "Asset Price is required",
    },

    // state: {
    //   type: String,
    //   enum: STATE,
    //   default: STATE.OWNED,
    //   required: true,
    // },
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
assetSchema.pre("save", function (next) {
  const asset = this;

  if (!asset.isModified("encryptionObject")) {
    return next();
  }

  asset.state = STATE.TRANSFERD;
  return next();
});
=======
// assetSchema.pre("save", function (next) {
//   const asset = this;

//   if (!asset.isModified("encryptionObject")) {
//     return next();
//   }

//   asset.state = STATE.TRANSFERD;
//   return next();
// });
>>>>>>> Stashed changes

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
