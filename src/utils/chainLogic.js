import BigchainDB from "bigchaindb-driver";
import encryptor from "./encrypt.js";
const API_PATH = process.env.BIG_CHAIN_NET;
const chainConnection = new BigchainDB.Connection(API_PATH);

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

  downloadAsset: async (body) => {
    const {
      assetID,
      fromSecretKey,
      nonce,
      senderPublicKey,
      receiverPublicKey,
    } = body;

    let foundAsset = await ChainFunctions.searchAssetById(assetID);
    let decryptedFile = null;

    if (foundAsset.res && !foundAsset.isErr) {
      const encModel = foundAsset.res.asset.data.model.encrypted_model;

      const encyptionObject = {
        encryptedData: encModel,
        nonce: nonce,
        senderPublicKey: senderPublicKey,
        receiverPublicKey: receiverPublicKey,
      };

      decryptedFile = encryptor.asymmetricDecryption(
        encyptionObject,
        fromSecretKey
      );

      delete foundAsset.res.asset;

      var data = {
        meatadata: foundAsset.res,
        decryptedFile: decryptedFile,
      };

      console.log("decryptedFile", decryptedFile);
    }
    return data;
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
  transferAsset: async (assetID, senderKeypair, metaData, issureKeyPair) => {
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    //Fetch the Asset by assetID or transactionId
    let fetchAsset = await ChainFunctions.searchAssetById(assetID);

    if (fetchAsset.res && !fetchAsset.isErr) {
      //Transfer the Asset

      const txTransfer = BigchainDB.Transaction.makeTransferTransaction(
        // signedTx to transfer and output index
        [{ tx: fetchAsset.res, output_index: 0 }],

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
};

export default ChainFunctions;
