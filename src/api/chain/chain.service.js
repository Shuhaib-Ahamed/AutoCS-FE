//BigChainDB interface
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encrypt.js";
import ChainFunctions from "../../utils/chainLogic.js";

const getKeypairFromChain = new BigchainDB.Ed25519Keypair();
const API_PATH = process.env.BIG_CHAIN_NET;
new BigchainDB.Connection(API_PATH);

export default {
  upload: async (req, res) => {
    const uploadedFiles = req.file;
    const formData = req.body;
    const assetKeyPair = getKeypairFromChain;

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

    let { encryptionKey, ...excludedMetaData } = { ...metadata };

    let result = await ChainFunctions.createSimpleAsset(
      assetKeyPair,
      assetdata,
      excludedMetaData
    );

    if (result.isErr) {
      return { message: "Error when uploading asset!" };
    }

    const response = { ...assetKeyPair, ...result.res };

    return { message: "Upload successfull", response };
  },

  downloadAsset: async (body) => {
    const formData = body;
    const encryptionKey = formData["encryptionKey"];
    const assetId = formData["assetId"];

    let result = await ChainFunctions.downloadAsset(assetId, encryptionKey);

    if (!result) {
      return { message: `"error when getting asset with id= " + ${assetId}` };
    }

    const response = result;

    return { message: "Decrypted Asset", response };
  },

  searchAssetById: async (body) => {
    const formData = body;
    if (!formData.assetId) return;

    let result = await ChainFunctions.searchAssetById(formData.assetId);

    if (result.isErr) {
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

    let result = await ChainFunctions.searchAssetByMetadata(
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

  transferAsset: async (req, res) => {
    const formData = req;

    let { assetId, issuerKeyPair, ...metaData } = { ...formData };

    const senderKeyPair = getKeypairFromChain;

    // txId, keypairTo, metaData, keypairFrom
    let result = await ChainFunctions.transferAsset(
      formData.assetId,
      senderKeyPair,
      metaData,
      formData.issuerKeyPair
    );

    if (result.isErr) {
      return { message: "Error when transfering asset!" };
    }

    const response = { ...senderKeyPair, ...result.res };

    return { message: "Transfer successfull!!", response };
  },
};
