import BigchainDB from "bigchaindb-driver";
import encryptor from "./encrypt.js";
import { v4 as uuidv4 } from "uuid";
import { NETWORKS } from "./networks.js";
import StellarSdk from "stellar-sdk";
import Asset from "../api/models/asset.model.js";

//Big chain
const API_PATH = process.env.BIG_CHAIN_NET;
new BigchainDB.Connection(API_PATH);
const chainConnection = new BigchainDB.Connection(API_PATH);
const getKeypairFromChain = new BigchainDB.Ed25519Keypair();

let ChainFunctions = {
  createSimpleAsset: async (keypair, asset, metadata) => {
    const txSimpleAsset = BigchainDB.Transaction.makeCreateTransaction(
      asset,
      metadata,
      [
        BigchainDB.Transaction.makeOutput(
          BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey)
        ),
      ],
      keypair.publicKey
    );

    // Sign the transaction with private keys
    const txSigned = BigchainDB.Transaction.signTransaction(
      txSimpleAsset,
      keypair.privateKey
    );

    //send the transaction to the blockchain
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    try {
      assetObj = await chainConnection.postTransaction(txSigned); //or USE: searchAssets OR pollStatusAndFetchTransaction
    } catch (err) {
      result.isErr = true;
      return result;
    }
    result.isErr = false;
    result.res = assetObj;
    return result;
  },

  searchAndDecryptAsset: async (body) => {
    const { assetID, fromSecretKey } = body;

    let foundAsset = await ChainFunctions.searchAssetById(assetID);
    let decryptedFile = null;

    if (foundAsset.res && !foundAsset.isErr) {
      const encModel = foundAsset.res.asset.data.model.encrypted_model;

      decryptedFile = encryptor.symmetricDecryption(encModel, fromSecretKey);

      foundAsset.res.asset = JSON.parse(decryptedFile);
    }
    return foundAsset.res;
  },

  searchAssetById: async (assetID) => {
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    try {
      assetObj = await chainConnection.getTransaction(assetID); //or USE: searchAssets OR pollStatusAndFetchTransaction
    } catch (err) {
      result.isErr = true;
      return result;
    }

    result.isErr = false;
    result.res = assetObj;
    return result;
  },

  searchAssetByMetadata: async (metadataKeyword) => {
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    try {
      assetObj = await chainConnection.searchMetadata(metadataKeyword);
    } catch (err) {
      result.isErr = true;
      return result;
    }

    result.isErr = false;
    result.res = assetObj;
    return result;
  },
  transferAsset: async (
    fetchedAsset,
    senderKeypair,
    metaData,
    issureKeyPair
  ) => {
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    if (fetchedAsset) {
      //Transfer the Asset
      const txTransfer = BigchainDB.Transaction.makeTransferTransaction(
        // signedTx to transfer and output index
        [{ tx: fetchedAsset, output_index: 0 }],
        [
          BigchainDB.Transaction.makeOutput(
            BigchainDB.Transaction.makeEd25519Condition(senderKeypair.publicKey)
          ),
        ],
        // metadata
        metaData
      );

      // Sign the transaction with private keys
      const txSigned = BigchainDB.Transaction.signTransaction(
        txTransfer,
        issureKeyPair.privateKey
      );

      try {
        assetObj = await chainConnection.postTransaction(txSigned); //or USE: searchAssets OR pollStatusAndFetchTransaction
      } catch (err) {
        result.isErr = true;
        return result;
      }

      result.isErr = false;
      result.res = assetObj;
      return result;
    }
  },

  upload: async (data, stellarServer) => {
    console.log("🚀 ~ file: chainLogic.js:132 ~ upload: ~ data", data);
    const fromSecretKey = data.fromSecretKey;
    const fromPublicKey = data.fromPublicKey;
    const metadata = data.assetData;
    const uploadedFile = data.asset;

    const assetKeyPair = getKeypairFromChain;

    const assetdata = {
      model: {
        asset_type: "digital_asset",
        asset_issuer: "AutoCS platform",
      },
    };

    let cypher = encryptor.symmetricEncryption(
      JSON.stringify(uploadedFile),
      fromSecretKey
    );

    let cypherStringified = cypher.toString();
    assetdata.model.encrypted_model = cypherStringified;

    //delete privateKey and publicKey and add encryptionData
    metadata.assetTitle = `${metadata.assetTitle} - ${uuidv4()}`;

    try {
      let result = await ChainFunctions.createSimpleAsset(
        assetKeyPair,
        assetdata,
        metadata
      );

      if (result.isErr) {
        return { message: "Bigchain DB error when uploading asset!" };
      }

      const cypherText = encryptor.symmetricEncryption(
        JSON.stringify({
          assetDescription: metadata.assetDescription,
          assetID: result.res.id,
          assetKeyPair: assetKeyPair,
          assetPrice: metadata.assetPrice,
        }),
        fromSecretKey
      );

      const assetObject = {
        publicKey: fromPublicKey,
        assetTitle: metadata.assetTitle,
        assetData: cypherText,
      };

      await new Asset({ ...assetObject }).save();

      // Next, you'll need to load the account that you want to add data to
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
      const sourceAccount = await stellarServer.loadAccount(
        sourceKeypair.publicKey()
      );

      // Then, you can create a transaction to add data to the account
      var transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        //define the base fee
        fee: 100,
        networkPassphrase: NETWORKS.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: metadata.assetTitle,
            value: encryptor.generateHash(
              JSON.stringify({
                assetDescription: metadata.assetDescription,
                assetID: result.res.id,
                assetKeyPair: assetKeyPair,
                assetPrice: metadata.assetPrice,
              })
            ),
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
      };
    } catch (error) {
      console.log(error);
      return {
        message:
          "Stellar or MongoDb error when creating transaction on the asset!",
      };
    }
  },
};

export default ChainFunctions;
