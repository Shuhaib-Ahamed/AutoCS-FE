import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encrypt.js";
import ChainFunctions from "../../utils/chainLogic.js";
import { NETWORKS } from "../../utils/networks.js";
import Asset from "../models/asset.model.js";
import Requests from "../models/requests.model.js";
import User from "../models/user.model.js";
import { ENCRYPTION, REQUEST_STATUS, STATE } from "../../utils/enums.js";

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

    const start = performance.now();
    let transactions = 0;

    let metadata = {};
    for (let key of Object.keys(formData)) {
      metadata[key] = formData[key];
    }
    //delete privateKey and publicKey and add encryptionData
    delete metadata.fromSecretKey;

    const uploadData = {
      fromSecretKey: fromSecretKey,
      fromPublicKey: toPublicKey,
      toPublicKey: toPublicKey,
      metadata: metadata,
      uploadedFile: uploadedFile,
      type: ENCRYPTION.AES,
    };

    return await ChainFunctions.upload(
      uploadData,
      stellarServer,
      start,
      transactions
    );
  },

  decryptAssetObject: async (body) => {
    var decryptedResult;
    const { key, fromSecretKey, type } = body;
    if (type === ENCRYPTION.AES) {
      decryptedResult = encryptor.symmetricDecryption(key, fromSecretKey);
    } else if (type === ENCRYPTION.RSA) {
      const encyptionObject = JSON.parse(key);

      decryptedResult = encryptor.asymmetricDecryption(
        encyptionObject,
        fromSecretKey
      );
    } else {
      return { message: "Please provide encryption type!!!" };
    }

    let response = "";
    const regex = /^[\],:{}\s]*$/;
    const isJSON = regex.test(
      decryptedResult
        .replace(/\\["\\\/bfnrtu]/g, "@")
        .replace(
          /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
          "]"
        )
        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
    );
    if (isJSON) {
      response = JSON.parse(decryptedResult);
    } else {
      response = decryptedResult;
    }

    return response;
  },

  searchAndDecryptAsset: async (req) => {
    let transferResult = await ChainFunctions.searchAndDecryptAsset(req.body);

    if (!transferResult) {
      return {
        message: "Asset Not Found!!",
      };
    }

    const response = transferResult;

    return { message: "Decrypted Asset", response };
  },

  searchAssetById: async (body) => {
    const formData = body;
    if (!formData.assetID) return;

    let transferResult = await ChainFunctions.searchAssetById(formData.assetID);

    if (!transferResult) {
      return {
        message: `"error when getting asset with id= " + ${formData.assetID}`,
      };
    }

    return { message: "Fetched Asset", data: transferResult };
  },

  searchAssetByMetadata: async (body) => {
    const formData = body;
    if (!formData.metadataKeyword) return;

    let transferResult = await ChainFunctions.searchAssetByMetadata(
      formData.metadataKeyword
    );

    if (transferResult.isErr) {
      return {
        message: `"error when getting asset with metadata: " + ${formData.metadataKeyword}`,
      };
    }

    const response = transferResult.res;

    return { message: "Fetched Asset", response };
  },

  //Buyer
  sendAssetRequest: async (body) => {
    try {
      const { toPublicKey, assetObjectID, fromPublicKey } = body;

      //set request status
      body.status = REQUEST_STATUS.INREVIEW;

      const publicKeys = [toPublicKey, fromPublicKey];
      const users = await User.find({ publicKey: { $in: publicKeys } });

      const asset = await Asset.findOne({
        $and: [{ _id: assetObjectID }, { publicKey: toPublicKey }],
      });

      if (users.length <= 1 || !asset) {
        return { message: "User or Asset dose not exist!" };
      }

      //save object in mongo
      const response = await new Requests({ ...body }).save();

      return { message: "Transfer request sent!!", data: response };
    } catch (error) {
      if (error.code === 11000) {
        return { message: "Asset transfer is already on request!" };
      } else return { message: "Mongo Error!" };
    }
  },

  //Seller
  acceptAssetRequest: async (body) => {
    let { fromSecretKey, toPublicKey, fromPublicKey, requestID } = body;

    const request = await Requests.findById(requestID);
    if (!request) return { message: "Request not found!!!" };

    if (request.status === REQUEST_STATUS.GRANTED)
      return { message: "Asset access already granted!!!" };

    const response = await Asset.findOne({ _id: request?.assetObjectID });

    if (!response) return { message: "Asset not found!!!" };

    if (response.status === STATE.TRANSFERD)
      return { message: "Asset already transfered!!!" };

    //decrypt assetData from MongoDB
    const decryptedAssetData = encryptor.symmetricDecryption(
      response?.assetData,
      fromSecretKey
    );

    const { assetID } = JSON.parse(decryptedAssetData);

    //get asset by ID
    let decryptedAsset = await ChainFunctions.searchAndDecryptAsset({
      assetID,
      fromSecretKey,
    });

    //Upload Asset
    let uploadAsset = await ChainFunctions.upload(
      {
        fromSecretKey: fromSecretKey,
        fromPublicKey: fromPublicKey,
        uploadedFile: decryptedAsset,
        metadata: JSON.parse(decryptedAssetData),
        toPublicKey: toPublicKey,
        type: ENCRYPTION.RSA,
      },
      stellarServer
    );

    if (!uploadAsset.data.stellar) {
      return {
        message: "Failed to upload asset!!!",
      };
    }

    await Requests.findByIdAndUpdate(
      requestID,
      {
        $set: {
          status: REQUEST_STATUS.GRANTED,
          assetObjectID: uploadAsset.data.asset._id,
        },
      },
      { new: true }
    );

    return {
      message: "Request Accepted!",
      data: uploadAsset.data,
    };
  },

  //Buyer
  transferAsset: async (data) => {
    let {
      fromPublicKey,
      fromSecretKey,
      metadata,
      requestID,
      toPublicKey,
      receiverComment,
    } = data;

    try {
      const senderKeyPair = getKeypairFromChain;

      if (receiverComment.length > 28)
        return { message: "Memo should be less than 28 characters" };

      const request = await Requests.findById(requestID);
      if (!request) return { message: "Request not found!!!" };

      if (request.status === REQUEST_STATUS.INREVIEW)
        return { message: "Asset access in review!!!" };

      const response = await Asset.findOne({ _id: request?.assetObjectID });

      if (!response) return { message: "Asset not found!!!" };

      if (response.status === STATE.OWNED)
        return { message: "Asset is not transfered!!!" };

      //decrypt assetData
      const decryptedAssetData = encryptor.asymmetricDecryption(
        JSON.parse(response?.assetData),
        fromSecretKey
      );

      const { assetID, encryptioObject, assetKeyPair } =
        JSON.parse(decryptedAssetData);

      //txId, keypairTo, metaData, keypairFrom;
      const transferResult = await ChainFunctions.transferAsset(
        assetID,
        senderKeyPair,
        metadata,
        assetKeyPair,
        encryptioObject,
        fromSecretKey
      );

      if (!transferResult.retrieveTransaction)
        return { message: "Error when transfering asset!" };

      // Next, you'll need to load the account that you want to transfer data to
      const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
      const sourceAccount = await stellarServer.loadAccount(
        sourceKeypair.publicKey()
      );

      // Then, you can create a transaction to add data to the account
      const stellarTrnsaction = new StellarSdk.TransactionBuilder(
        sourceAccount,
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        }
      )
        .addOperation(
          StellarSdk.Operation.manageData({
            name: transferResult.tx.metadata.assetTitle,
            value: encryptor.generateHash(
              JSON.stringify({
                assetTitle: transferResult.tx.metadata.assetTitle,
                assetDescription: transferResult.tx.metadata.assetDescription,
                assetID: transferResult.tx.asset.id,
                assetKeyPair: decryptedAssetData.assetKeyPair,
                assetPrice: transferResult.tx.metadata.assetPrice,
              })
            ),
          })
        )
        .setTimeout(30)
        .addOperation(
          StellarSdk.Operation.payment({
            destination: toPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: transferResult.tx.metadata.assetPrice, // deduct the asset price from the destination account
          })
        )
        .addMemo(StellarSdk.Memo.text(receiverComment))
        .build();

      // Sign the transaction with the account's secret key
      stellarTrnsaction.sign(sourceKeypair);

      const encryptedAssetData = encryptor.symmetricEncryption(
        JSON.stringify({
          assetTitle: transferResult.tx.metadata.assetTitle,
          assetDescription: transferResult.tx.metadata.assetDescription,
          assetID: transferResult.tx.asset.id,
          assetKeyPair: decryptedAssetData.assetKeyPair,
          assetPrice: transferResult.tx.metadata.assetPrice,
        }),
        fromSecretKey
      );

      await Asset.findByIdAndUpdate(
        request.assetObjectID,
        {
          $set: {
            publicKey: fromPublicKey,
            status: STATE.OWNED,
            assetData: encryptedAssetData,
            encryptionType: ENCRYPTION.AES,
          },
        },
        {
          new: true,
        }
      );

      // Finally, submit the transaction to the network
      const stellarSubmit = await stellarServer.submitTransaction(
        stellarTrnsaction
      );

      return {
        message: "Transfer successfull",
        data: {
          stellar: stellarSubmit,
          chain: transferResult,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        message: "Mongo or Stellar or Bigchain Error!!!",
      };
    }
  },
};
