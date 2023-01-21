import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";
import { symmetricEncryption } from "utils/encryptor";
import { createSimpleAsset } from "utils/bigChain";

//Stellar
const stellarServer = new StellarSdk.Server(
  "https://horizon-testnet.stellar.org"
);

//Big chain
const getKeypairFromChain = new BigchainDB.Ed25519Keypair();
const API_PATH = process.env.BIG_CHAIN_NET;
new BigchainDB.Connection(API_PATH);

// const uploadedFile = req.file;
// const formData = req.body;
// const fromSecretKey = formData["fromSecretKey"];
// const toPublicKey = formData["toPublicKey"];

// const assetKeyPair = getKeypairFromChain;

// const assetdata = {
//   model: {
//     asset_type: "digital_asset",
//     asset_issuer: "AutoCS platform",
//   },
// };

// let cypher = encryptor.symmetricEncryption(
//   JSON.stringify(uploadedFile),
//   fromSecretKey
// );

// let cypherStringified = cypher.toString();
// assetdata.model.encrypted_model = cypherStringified;

// let metadata = {};
// for (let key of Object.keys(formData)) {
//   metadata[key] = formData[key];
// }

// //delete privateKey and publicKey and add encryptionData
// delete metadata.fromSecretKey;

// try {
//   let result = await ChainFunctions.createSimpleAsset(
//     assetKeyPair,
//     assetdata,
//     metadata
//   );

//   if (result.isErr) {
//     return { message: "Bigchain DB error when uploading asset!" };
//   }

//   const assetObject = {
//     publicKey: toPublicKey,
//     assetTitle: metadata.assetTitle,
//     assetData: encryptor.symmetricEncryption(
//       JSON.stringify({
//         assetDescription: metadata.assetDescription,
//         assetID: result.res.id,
//         assetKeyPair: assetKeyPair,
//         assetPrice: metadata.assetPrice,
//       }),
//       fromSecretKey
//     ),
//   };
//   await new Asset({ ...assetObject }).save();

//   // Next, you'll need to load the account that you want to add data to
//   const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
//   const sourceAccount = await stellarServer.loadAccount(
//     sourceKeypair.publicKey()
//   );

//   // Then, you can create a transaction to add data to the account
//   var transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
//     //define the base fee
//     fee: 100,
//     networkPassphrase: NETWORKS.TESTNET,
//   })
//     .addOperation(
//       StellarSdk.Operation.manageData({
//         name: metadata.assetTitle,
//         value: encryptor.generateHash(
//           JSON.stringify({
//             assetDescription: metadata.assetDescription,
//             assetID: result.res.id,
//             assetKeyPair: assetKeyPair,
//             assetPrice: metadata.assetPrice,
//           })
//         ),
//       })
//     )
//     .setTimeout(30)
//     .build();

//   // Sign the transaction with the account's secret key
//   transaction.sign(sourceKeypair);

//   // Finally, submit the transaction to the network
//   const stellarSubmit = await stellarServer.submitTransaction(transaction);
//   return {
//     message: "Upload successfull",
//     data: stellarSubmit,
//   };
// } catch (error) {
//   console.log(error);
//   return {
//     message:
//       "Stellar or MongoDb error when creating transaction on the asset!",
//   };
// }

export const uploadAsset = async (data: any) => {
  const {
    assetTitle,
    assetPrice,
    assetDescription,
    file,
    fromSecretKey,
    toPublicKey,
  } = data;

  const assetKeyPair = getKeypairFromChain;

  const assetdata = {
    model: {
      asset_type: "digital_asset",
      asset_issuer: "AutoCS platform",
      encrypted_model: "",
    },
  };

  let cypher = symmetricEncryption(JSON.stringify(file), fromSecretKey);

  let cypherStringified = cypher.toString();
  assetdata.model.encrypted_model = cypherStringified;

  const metadata = {
    assetTitle: assetTitle,
    assetDescription: assetDescription,
    assetPrice: assetPrice,
  };

  try {
    let result = await createSimpleAsset(assetKeyPair, assetdata, metadata);
  } catch (error) {}

  try {
    return;
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
};
