import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encrypt.js";
import ChainFunctions from "../../utils/chainLogic.js";
import { NETWORKS } from "../../utils/networks.js";
import Asset from "../models/asset.model.js";

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
    const uploadedFile = req.file;
    const formData = req.body;
    const fromSecretKey = formData["fromSecretKey"];
    const toPublicKey = formData["toPublicKey"];

    const assetKeyPair = getKeypairFromChain;

    const assetdata = {
      model: {
        asset_type: "digital_asset",
        asset_issuer: "AutoCS platform",
      },
    };

    let cypher = encryptor.asymmetricEncryption(
      JSON.stringify(uploadedFile),
      toPublicKey,
      fromSecretKey
    );

    let cypherStringified = cypher.encryptedData;
    assetdata.model.encrypted_model = cypherStringified;

    let metadata = {};
    for (let key of Object.keys(formData)) {
      metadata[key] = formData[key];
    }

    //delete privateKey and publicKey and add encryptionData
    delete metadata.toPublicKey;
    delete metadata.fromSecretKey;

    //prepare the encryptionObject
    var { encryptedData, ...encryptionObject } = cypher;

    const assetObject = {
      publicKey: toPublicKey,
      assetTitle: metadata.assetTitle,
      assetDescription: metadata.assetDescription,
      encryptionObject: encryptor.symmetricEncryption(
        JSON.stringify({
          encryptionObject: encryptionObject,
          assetKeyPair: assetKeyPair,
        }),
        fromSecretKey
      ),
    };

    try {
      //save object in mongo
      await new Asset({ ...assetObject }).save();

      let result = await ChainFunctions.createSimpleAsset(
        assetKeyPair,
        assetdata,
        metadata
      );

      if (result.isErr) {
        return { message: "Bigchain DB error when uploading asset!" };
      }

      // Next, you'll need to load the account that you want to add data to
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
      const sourceAccount = await stellarServer.loadAccount(
        sourceKeypair.publicKey()
      );

      //data to be encrypted before sending to the blockchain
      let cypher = encryptor.symmetricEncryption(result.res.id, fromSecretKey);

      let cypherStringified = cypher.toString();
      let shares = [];

      for (let i = 0; i < 2; i++) {
        const share = cypherStringified.slice(
          (i * cypherStringified.length) / 2,
          ((i + 1) * cypherStringified.length) / 2
        );
        shares.push(share);
      }

      console.log(shares);

      // Then, you can create a transaction to add data to the account
      var transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        //define the base fee
        fee: 100,
        networkPassphrase: NETWORKS.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: metadata.assetTitle + "-0",
            value: shares[0],
          })
        )
        .addOperation(
          StellarSdk.Operation.manageData({
            name: metadata.assetTitle + "-1",
            value: shares[1],
          })
        )
        .setTimeout(30)
        .build();

      // Sign the transaction with the account's secret key
      transaction.sign(sourceKeypair);

      // Finally, submit the transaction to the network
      const stellarSubmit = await stellarServer.submitTransaction(transaction);

      return {
        message: "Upload successfull",
        data: stellarSubmit,
        assetData: encryptionObject,
      };
    } catch (error) {
      console.log(error);
      return {
        message:
          "Stellar or MongoDb error when creating transaction on the asset!",
      };
    }
  },

  decryptAssetObject: async (body) => {
    const { key, fromSecretKey } = body;
    const encriptionObject = encryptor.symmetricDecryption(key, fromSecretKey);

    let response = "";
    const regex = /^[\],:{}\s]*$/;
    const isJSON = regex.test(
      encriptionObject
        .replace(/\\["\\\/bfnrtu]/g, "@")
        .replace(
          /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
          "]"
        )
        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
    );
    if (isJSON) {
      response = JSON.parse(encriptionObject);
    } else {
      response = encriptionObject;
    }

    return response;
  },

  downloadAsset: async (req) => {
    let result = await ChainFunctions.downloadAsset(req.body);

    if (!result) {
      return {
        message: "Asset Not Found!!",
      };
    }

    const response = result;

    return { message: "Decrypted Asset", response };
  },

  searchAssetById: async (body) => {
    const formData = body;
    if (!formData.assetID) return;

    let result = await ChainFunctions.searchAssetById(formData.assetID);

    if (result.isErr) {
      return {
        message: `"error when getting asset with id= " + ${formData.assetID}`,
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

    let {
      assetID,
      toPublicKey,
      fromSecretKey,
      issureKeyPair,
      encryptionObject,
    } = {
      ...formData,
    };

    const senderKeyPair = getKeypairFromChain;

    // txId, keypairTo, metaData, keypairFrom
    let result = await ChainFunctions.transferAsset(
      assetID,
      senderKeyPair,
      toPublicKey,
      fromSecretKey,
      issureKeyPair,
      encryptionObject,
      formData
    );

    if (result) {
      return { message: "Error when transfering asset!" };
    }

    const response = { ...senderKeyPair, ...result };

    return { message: "Transfer successfull!!", response };
  },
};
