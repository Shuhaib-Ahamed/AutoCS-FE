import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";
import encryptor from "../../utils/encrypt.js";
import ChainFunctions from "../../utils/chainLogic.js";
import { NETWORKS } from "../../utils/networks.js";
import Asset from "../models/asset.model.js";
import Requests from "../models/requests.model.js";
import User from "../models/user.model.js";
import { ENCRYPTION, REQUEST_STATUS, STATE } from "../../utils/enums.js";
import { v4 as uuidv4 } from "uuid";

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

    let cypher = encryptor.symmetricEncryption(
      JSON.stringify(uploadedFile),
      fromSecretKey
    );

    let cypherStringified = cypher.toString();
    assetdata.model.encrypted_model = cypherStringified;

    let metadata = {};
    for (let key of Object.keys(formData)) {
      metadata[key] = formData[key];
    }

    //delete privateKey and publicKey and add encryptionData
    metadata.assetTitle = `${metadata.assetTitle} - ${uuidv4()}`;
    delete metadata.fromSecretKey;

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
        publicKey: toPublicKey,
        assetTitle: metadata.assetTitle,
        assetData: cypherText,
        isVerified: true,
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
    let result = await ChainFunctions.searchAndDecryptAsset(req.body);

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

      // users.forEach(async (user, index) => {
      //   const notificationArr = user.notifications;
      //   notificationArr.push({ ...body });

      //   await User.findOneAndUpdate(
      //     { publicKey: publicKeys[index] },
      //     {
      //       $set: {
      //         notifications: notificationArr,
      //       },
      //     },
      //     { new: true }
      //   );
      // });

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
    let {
      assetObjectID,
      fromSecretKey,
      toPublicKey,
      fromPublicKey,
      assetData,
      requestID,
    } = body;

    const response = await Asset.findOne({ _id: assetObjectID });

    if (!response) {
      return { message: "Asset not found!!!" };
    }

    if (response.status === STATE.TRANSFERD) {
      return { message: "Asset already transfered!!!" };
    }

    const decryptedAsset = encryptor.symmetricDecryption(
      response.assetData,
      fromSecretKey
    );

    const { assetID } = JSON.parse(decryptedAsset);

    let assetResponse = await ChainFunctions.searchAndDecryptAsset({
      assetID,
      fromSecretKey,
    });

    //Upload Asset

    let uploadAsset = await ChainFunctions.upload(
      {
        fromSecretKey: fromSecretKey,
        fromPublicKey: fromPublicKey,
        asset: assetResponse.asset,
        assetData: assetData,
      },
      stellarServer
    );

    if (!uploadAsset.data) {
      return {
        message: "Failed to upload asset!!!",
      };
    }

    let cypher = encryptor.asymmetricEncryption(
      JSON.stringify(assetResponse.asset),
      toPublicKey,
      fromSecretKey
    );

    let cypherStringified = cypher.encryptedData;
    assetResponse.asset = cypherStringified;

    const reEncryptAssetData = encryptor.asymmetricEncryption(
      decryptedAsset,
      toPublicKey,
      fromSecretKey
    );

    await Asset.findByIdAndUpdate(
      assetObjectID,
      {
        $set: {
          assetData: JSON.stringify(reEncryptAssetData),
          encryptionType: ENCRYPTION.RSA,
          status: STATE.TRANSFERD,
        },
      },
      { new: true }
    );

    await Requests.findByIdAndUpdate(
      requestID,
      {
        $set: {
          status: REQUEST_STATUS.GRANTED,
        },
      },
      { new: true }
    );

    return {
      message: "Request Accepted!",
      data: assetResponse,
      uploadedAsset: uploadAsset,
    };
  },

  //Buyer
  transferAsset: async (data) => {
    let {
      fromPublicKey,
      fromSecretKey,
      toPublicKey,
      metadata,
      encryptionObject,
      assetObjectID,
    } = data;
    const senderKeyPair = getKeypairFromChain;

    try {
      //txId, keypairTo, metaData, keypairFrom;
      var result = await ChainFunctions.transferAsset(
        encryptionObject.assetID,
        senderKeyPair,
        metadata,
        encryptionObject.assetKeyPair
      );

      if (result.isErr) {
        return { message: "Error when transfering asset!" };
      }

      // Next, you'll need to load the account that you want to transfer data to
      const sourceAccount = await stellarServer.loadAccount(fromPublicKey);

      // Then, you can create a transaction to add data to the account
      var buyerTransaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        //define the base fee
        fee: 100,
        networkPassphrase: NETWORKS.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: result.metadata.assetTitle,
            value: encryptor.generateHash(
              JSON.stringify({
                assetDescription: metadata.assetDescription,
                assetID: encryptionObject.assetID,
                assetKeyPair: encryptionObject.assetKeyPair,
                assetPrice: result.metadata.assetPrice,
              })
            ),
          })
        )
        .setTimeout(30)
        .build();

      // Sign the transaction with the account's secret key
      buyerTransaction.sign(fromSecretKey);

      // Next, you'll need to load the account that you want to transfer data to
      const destinationAccount = await stellarServer.loadAccount(toPublicKey);

      // Then, you can create a transaction to add data to the account
      var sellerTransaction = new StellarSdk.TransactionBuilder(
        destinationAccount,
        {
          //define the base fee
          fee: 100,
          networkPassphrase: NETWORKS.TESTNET,
        }
      )
        .TransactionBuilder(destinationAccount)
        .addOperation(
          StellarSdk.Operation.payment({
            destination: toPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: result.metadata.assetPrice, // deduct the asset price from the destination account
          })
        )
        .setTimeout(30)
        .build();

      // Sign the transaction with the account's secret key
      sellerTransaction.sign(fromSecretKey);

      const encryptedAssetData = encryptor.symmetricEncryption(
        JSON.stringify({
          assetDescription: metadata.assetDescription,
          assetID: encryptionObject.assetID,
          assetKeyPair: senderKeyPair,
          assetPrice: result.metadata.assetPrice,
        }),
        fromSecretKey
      );

      await Asset.findByIdAndUpdate(
        assetObjectID,
        {
          $set: {
            publicKey: fromPublicKey,
            status: STATE.OWNED,
            assetData: encryptedAssetData,
          },
        },
        {
          new: true,
        }
      );

      // Finally, submit the transaction to the network
      const sellerSubmit = await stellarServer.submitTransaction(
        sellerTransaction
      );
      // Finally, submit the transaction to the network
      const buyerSubmit = await stellarServer.submitTransaction(
        buyerTransaction
      );
      return {
        message: "Transfer successfull",
        data: {
          ...buyerSubmit,
          ...sellerSubmit,
        },
      };
    } catch (error) {
      console.log(error);
    }
  },
};
