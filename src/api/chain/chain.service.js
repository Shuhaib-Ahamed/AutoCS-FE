import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encrypt.js";
import ChainFunctions from "../../utils/chainLogic.js";
import { NETWORKS } from "../../utils/networks.js";

//Stellar
const stellarServer = new StellarSdk.Server(
  "https://horizon-testnet.stellar.org"
);

//Big chain
const getKeypairFromChain = new BigchainDB.Ed25519Keypair();
const API_PATH = process.env.BIG_CHAIN_NET;
new BigchainDB.Connection(API_PATH);

export default {
  upload: async (req, res) => {
    const uploadedFiles = req.file;
    const formData = req.body;
    const secretKey = formData["encryptionKey"].toString();
    const assetKeyPair = getKeypairFromChain;

    const assetdata = {
      model: {
        asset_type: "digital_asset",
        asset_issuer: "AutoCS platform",
      },
    };

    let json = JSON.stringify(uploadedFiles);
    let cypher = encryptor.fileEncrypt(json, secretKey);
    let cypherStringified = cypher.toString();
    assetdata.model.encrypted_model = cypherStringified;

    let metadata = {};
    for (let key of Object.keys(formData)) {
      metadata[key] = formData[key];
    }

    let { encryptionKey, ...excludedMetaData } = { ...metadata };

    try {
      let result = await ChainFunctions.createSimpleAsset(
        assetKeyPair,
        assetdata,
        excludedMetaData
      );

      if (result.isErr) {
        return { message: "Error when uploading asset!" };
      }

      // Next, you'll need to load the account that you want to add data to

      const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      const sourceAccount = await stellarServer.loadAccount(
        sourceKeypair.publicKey()
      );

      //data to be encrypted before sending to the blockchain
      const chainData = {
        assetId: result.res.id,
        assetKeyPair: assetKeyPair,
      };

      //Encrypt the assetID
      let cypher = encryptor.generateHash(JSON.stringify(chainData), secretKey);
      let cypherStringified = cypher.toString();

      // Then, you can create a transaction to add data to the account
      var transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        //define the base fee
        fee: 100,
        networkPassphrase: NETWORKS.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: metadata.assetTitle,
            value: cypherStringified,
          })
        )
        .setTimeout(30)
        .build();

      // Sign the transaction with the account's secret key
      transaction.sign(sourceKeypair);

      // Finally, submit the transaction to the network
      const stellarSubmit = await stellarServer.submitTransaction(transaction);

      return { message: "Upload successfull", data: stellarSubmit };
    } catch (error) {
      console.log(error);
      return { message: "Error when uploading asset!" };
    }
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
