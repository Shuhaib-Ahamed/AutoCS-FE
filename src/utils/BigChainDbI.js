import BigchainDB from "bigchaindb-driver";
import encryptor from "../utils/encryption.js";
const API_PATH = process.env.BIG_CHAIN_NET;
const conn = new BigchainDB.Connection(API_PATH);

let BigChainDbI = {
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
      assetObj = await conn.postTransaction(txSigned); //or USE: searchAssets OR pollStatusAndFetchTransaction
    } catch (err) {
      result.isErr = true;
      return result;
    }
    result.isErr = false;
    result.res = assetObj;
    return result;

    /*
        .then(() => conn.pollStatusAndFetchTransaction(txCreateAliceSimpleSigned.id))
        .then(retrievedTx => console.log('Transaction', retrievedTx.id, 'successfully posted.'))
        .then(() => conn.getStatus(txCreateAliceSimpleSigned.id))
        .then(status => console.log('Retrieved status method 2: ', status))
        .then(() => conn.searchAssets(txCreateAliceSimpleSigned.id))
        .then(assets => console.log('Found assets creaed by Dian Balta: ', assets))
        */
  },

  downloadAsset: async (assetId, encryptionKey) => {
    let foundAsset = await BigChainDbI.searchAssetById(assetId);
    let decryptedFile = null;

    if (foundAsset.res && !foundAsset.isErr) {
      const encModel = foundAsset.res.asset.data.model.encrypted_model;
      decryptedFile = encryptor.fileDecrypt(encModel, encryptionKey);
    }

    return decryptedFile;
  },

  searchAssetById: async (assetId) => {
    let assetObj = null;
    let result = { isErr: false, res: assetObj };

    try {
      assetObj = await conn.getTransaction(assetId); //or USE: searchAssets OR pollStatusAndFetchTransaction
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
      assetObj = await conn.searchMetadata(metadataKeyword);
    } catch (err) {
      result.isErr = true;
      return result;
    }

    result.isErr = false;
    result.res = assetObj;
    return result;
  },
};

export default BigChainDbI;
