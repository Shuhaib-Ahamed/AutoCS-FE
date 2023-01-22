import StellarSdk, { Server } from "stellar-sdk";
import { generateHash, symmetricEncryption } from "utils/encryptor";
import { NETWORKS } from "lib/Types/Networks";

export const uploadAsset = async (server: Server, data: any) => {
  const {
    assetTitle,
    assetPrice,
    assetDescription,
    file,
    fromSecretKey,
    assetKeyPair,
  } = data;

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
    let result = { isErr: "saddsa", res: { id: "" } };

    if (result.isErr) {
      return { message: "Bigchain DB error when uploading asset!" };
    }
    // Next, you'll need to load the account that you want to add data to
    const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecretKey);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    // Then, you can create a transaction to add data to the account
    var transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      //define the base fee
      fee: 100,
      networkPassphrase: NETWORKS.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: metadata.assetTitle,
          value: generateHash(
            JSON.stringify({
              assetDescription: metadata.assetDescription,
              assetID: result?.res.id,
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
    const stellarSubmit = await server.submitTransaction(transaction);
    return {
      message: "Upload successfull",
      data: stellarSubmit,
    };
  } catch (error) {
    return {
      message:
        "Stellar or MongoDb error when creating transaction on the asset!",
    };
  }
};
