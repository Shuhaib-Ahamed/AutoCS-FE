//BigChainDB interface
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encryption.js";
import BigChainDbI from "../../utils/BigChainDbI.js";
const bdbUser = new BigchainDB.Ed25519Keypair();
const API_PATH = process.env.BIG_CHAIN_NET;
const conn = new BigchainDB.Connection(API_PATH);

export default {
  upload: async (req, res) => {
    const uploadedFiles = req.file;
    const formData = req.body;

    console.log("uploaded files", uploadedFiles);
    console.log("form data", formData);
    console.log("encryption key", formData["encryptionKey"]);

    const assetdata = {
      model: {
        asset_type: "digital_asset",
        asset_issuer: "AutoCS platform",
      },
    };

    let json = JSON.stringify(uploadedFiles);
    let cypher = encryptor.fileEncrypt(json, formData["encryptionKey"]);
    let cypherStringified = cypher.toString();
    assetdata.model.encrypted_model = cypherStringified;

    let metadata = {};
    for (let key of Object.keys(formData)) {
      metadata[key] = formData[key];
    }

    let result = await BigChainDbI.createSimpleAsset(
      bdbUser,
      assetdata,
      metadata
    );

    if (result.isErr) {
      return { message: "Error when uploading asset!" };
    }

    const response = result.res;

    return { message: "Upload successfull", response };
  },

  downloadAsset: async (body) => {
    const formData = body;
    const encryptionKey = formData["encryptionKey"];
    const assetId = formData["assetId"];

    let result = await BigChainDbI.downloadAsset(assetId, encryptionKey);

    if (!result) {
      console.log(result);
      return { message: `"error when getting asset with id= " + ${assetId}` };
    }

    const response = result.res;

    return { message: "Decrypted Asset", response };
  },

  searchAssetById: async (body) => {
    const formData = body;
    if (!formData.assetId) return;

    let result = await BigChainDbI.searchAssetById(formData.assetId);

    if (result.isErr) {
      console.log(result);
      return {
        message: `"error when getting asset with id= " + ${formData.assetId}`,
      };
    }

    const response = result.res;

    return { message: "Fetched Asset", response };
  },

  searchAssetByMetadata: async (body) => {
    const formData = body;
    if (!formData.metadataKeyword) return;

    let result = await BigChainDbI.searchAssetByMetadata(
      formData.metadataKeyword
    );

    if (result.isErr) {
      return {
        message: `"error when getting asset with metadata: " + ${formData.metadataKeyword}`,
      };
    }

    const response = result.res;

    return { message: "Fetched Asset", response };
  },
};
