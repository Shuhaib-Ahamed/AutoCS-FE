import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encrypt.js";
import ChainFunctions from "../../utils/chainLogic.js";
import { NETWORKS } from "../../utils/networks.js";
import { combine, split } from "shamirs-secret-sharing";

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
    const privateKey = formData["privateKey"];
    const publicKey = formData["publicKey"];
    const assetKeyPair = getKeypairFromChain;

    const assetdata = {
      model: {
        asset_type: "digital_asset",
        asset_issuer: "AutoCS platform",
      },
    };

    let file = JSON.stringify(uploadedFiles);
    let cypher = encryptor.asymmetricEncryption(file, publicKey, privateKey);
    let cypherStringified = cypher.encryptedData.toString();
    assetdata.model.encrypted_model = cypherStringified;

    var { ciphertext, ...chainData } = cypher;

    let metadata = {};
    for (let key of Object.keys(formData)) {
      metadata[key] = formData[key];
    }

    //delete privateKey and publicKey
    delete metadata.privateKey;
    delete metadata.privateKey;

    try {
      let result = await ChainFunctions.createSimpleAsset(
        assetKeyPair,
        assetdata,
        metadata
      );

      console.log(result);
      if (result.isErr) {
        return { message: "Bigchain DB error when uploading asset!" };
      }

      // Next, you'll need to load the account that you want to add data to
      const sourceKeypair = StellarSdk.Keypair.fromSecret(privateKey);
      const sourceAccount = await stellarServer.loadAccount(
        sourceKeypair.publicKey()
      );

      chainData.assetKeyPair = assetKeyPair;
      chainData.assetID = result.res.id;

      //data to be encrypted before sending to the blockchain
      let cypher = encryptor.symmetricEncryption(
        JSON.stringify(assetKeyPair),
        privateKey
      );

      let cypherStringified = cypher.toString("base64");
      let shares = [];

      for (let i = 0; i < 3; i++) {
        const share = cypherStringified.slice(
          (i * cypherStringified.length) / 3,
          ((i + 1) * cypherStringified.length) / 3
        );
        shares.push(share);
      }

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
        .addOperation(
          StellarSdk.Operation.manageData({
            name: metadata.assetTitle + "-2",
            value: shares[2],
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
        assetData: chainData,
      };
    } catch (error) {
      console.log(error);
      return {
        message: "Stellar error when creating transaction on the asset!",
      };
    }
  },

  downloadAsset: async (body) => {
    const { privateKey, assetData } = body;

    let result = await ChainFunctions.downloadAsset(assetData.assetID, {
      nonce: assetData.nonce,
      ephemPubKey: assetData.ephemPubKey,
      receiverSecretKey: privateKey,
    });

    if (!result) {
      return {
        message: `"error when getting asset with id= " + ${assetData.assetID}`,
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

    let { assetID, issuerKeyPair, ...metaData } = { ...formData };

    const senderKeyPair = getKeypairFromChain;

    // txId, keypairTo, metaData, keypairFrom
    let result = await ChainFunctions.transferAsset(
      formData.assetID,
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
