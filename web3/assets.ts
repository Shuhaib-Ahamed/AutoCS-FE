import StellarSdk, { Server } from "stellar-sdk";
import { NETWORKS } from "lib/Types/Networks";
import { createAsset } from "./utils";

//Big chain

export const uploadAsset = async (server: Server, data: FormData) => {
  try {
    const result = await createAsset(data);
    const fromSecret = data.get("fromSecretKey");

    if (result.data.error) {
      return { message: "Bigchain DB error when uploading asset!" };
    }
    // Next, you'll need to load the account that you want to add data to
    const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecret);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    // Then, you can create a transaction to add data to the account
    var transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      //define the base fee
      fee: 100,
      networkPassphrase: NETWORKS.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: result.data.metadata.assetTitle,
          value: result.assetHash,
        })
      )
      .setTimeout(30)
      .build();
    // Sign the transaction with the account's secret key
    transaction.sign(sourceKeypair);
    // Finally, submit the transaction to the network
    const stellarSubmit = await server.submitTransaction(transaction);

    console.log("Stellar", stellarSubmit);
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
};
