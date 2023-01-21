import BigchainDB from "bigchaindb-driver";
import { BigChainKeypair, Result } from "lib/Types/Types";

const API_PATH = process.env.BIG_CHAIN_NET;
const chainConnection = new BigchainDB.Connection(API_PATH);

export const createSimpleAsset = async (
  keypair: BigChainKeypair,
  asset: any,
  metadata: any
): Promise<Result> => {
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

  // Send the transaction to the blockchain
  let assetObj = null;
  let result: Result = { isErr: false, res: assetObj };

  try {
    assetObj = await chainConnection.postTransaction(txSigned);
  } catch (err) {
    result.isErr = true;
    return result;
  }

  result.isErr = false;
  result.res = assetObj;
  return result;
};
