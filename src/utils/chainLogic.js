import BigchainDB from "bigchaindb-driver";
import encryptor from "./encrypt.js";
import { v4 as uuidv4 } from "uuid";
import { NETWORKS } from "./networks.js";
import StellarSdk from "stellar-sdk";
import Asset from "../api/models/asset.model.js";
import { ENCRYPTION, STATE } from "./enums.js";

//Big chain
const API_PATH = process.env.BIG_CHAIN_NET;
new BigchainDB.Connection(API_PATH);
const chainConnection = new BigchainDB.Connection(API_PATH);
const getKeypairFromChain = new BigchainDB.Ed25519Keypair();

let ChainFunctions = {
  //createSimpleAsset: creates and posts a new asset transaction on the blockchain,
  //using the provided keypair, asset data, and metadata.

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

  transferAsset: async (fetchAsset, keypairTo, metaData, keypairFrom) => {
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    if (fetchAsset) {
      //Transfer the Asset
      const txTransfer = BigchainDB.Transaction.makeTransferTransaction(
        // signedTx to transfer and output index
        [{ tx: fetchAsset, output_index: 0 }],
        [
          BigchainDB.Transaction.makeOutput(
            BigchainDB.Transaction.makeEd25519Condition(keypairTo.publicKey)
          ),
        ],
        // metadata
        metaData
      );

      // Sign the transaction with private keys
      const txSigned = BigchainDB.Transaction.signTransaction(
        txTransfer,
        keypairFrom.privateKey
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
    const { fromSecretKey, fromPublicKey, toPublicKey, metadata, asset, type } =
      data;
    console.log("🚀 ~ file: chainLogic.js:281 ~ upload: ~ data", data);

    //inntialize
    let cypher;
    let cypherAsset;
    let cypherText;
    let stellarHash;

    const assetKeyPair = getKeypairFromChain;

    const assetdata = {
      model: {
        asset_type: "digital_asset",
        asset_issuer: "AutoCS platform",
      },
    };

    if (type === ENCRYPTION.AES) {
      cypher = encryptor.symmetricEncryption(asset, fromSecretKey);
      assetdata.model.encrypted_model = cypher;
    } else if (type === ENCRYPTION.RSA) {
      cypher = encryptor.asymmetricEncryption(
        asset,
        toPublicKey,
        fromSecretKey
      );
      cypherAsset = cypher.encryptedData;
      assetdata.model.encrypted_model = cypherAsset;
    } else return { message: "Please provide encryption type!!!" };

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

      if (type === ENCRYPTION.AES) {
        cypherText = encryptor.symmetricEncryption(
          JSON.stringify({
            assetDescription: metadata.assetDescription,
            assetID: result.res.id,
            assetKeyPair: assetKeyPair,
            assetPrice: metadata.assetPrice,
          }),
          fromSecretKey
        );
      } else if (type === ENCRYPTION.RSA) {
        //delete asset from the encryption object
        delete cypher.encryptedData;
        cypherText = encryptor.asymmetricEncryption(
          JSON.stringify({
            assetDescription: metadata.assetDescription,
            assetID: result.res.id,
            assetKeyPair: assetKeyPair,
            assetPrice: metadata.assetPrice,
            encryptioObject: cypher,
          }),
          toPublicKey,
          fromSecretKey
        );
      } else return { message: "Please provide encryption type!!!" };

      const assetObject = {
        publicKey: fromPublicKey,
        assetTitle: metadata.assetTitle,
        assetData:
          type === ENCRYPTION.AES ? cypherText : JSON.stringify(cypherText),
        isVerified: type === ENCRYPTION.AES ? true : false,
        encryptionType:
          type === ENCRYPTION.AES ? ENCRYPTION.AES : ENCRYPTION.RSA,
        status: type === ENCRYPTION.AES ? STATE.OWNED : STATE.TRANSFERD,
      };

      const newAsset = await new Asset({ ...assetObject }).save();

      if (type === ENCRYPTION.AES) {
        stellarHash = encryptor.generateHash(
          JSON.stringify({
            assetDescription: metadata.assetDescription,
            assetID: result.res.id,
            assetKeyPair: assetKeyPair,
            assetPrice: metadata.assetPrice,
          })
        );
      } else if (type === ENCRYPTION.RSA) {
        stellarHash = encryptor.generateHash(
          JSON.stringify({
            assetDescription: metadata.assetDescription,
            assetID: result.res.id,
            assetKeyPair: assetKeyPair,
            assetPrice: metadata.assetPrice,
            encryptioObject: cypher,
          })
        );
      } else return { message: "Please provide encryption type!!!" };

      if (!stellarHash) return { message: "Couldn't find stellar hash!!!" };

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
            value: stellarHash,
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
        data: { stellar: stellarSubmit, asset: newAsset },
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
