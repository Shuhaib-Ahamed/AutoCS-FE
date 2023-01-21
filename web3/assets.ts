
import StellarSdk from "stellar-sdk";
import BigchainDB from "bigchaindb-driver";


//Stellar
const stellarServer = new StellarSdk.Server(
    "https://horizon-testnet.stellar.org"
  );
  
  //Big chain
  const getKeypairFromChain = new BigchainDB.Ed25519Keypair();
  const API_PATH = process.env.BIG_CHAIN_NET;
  new BigchainDB.Connection(API_PATH);






export const login = async (server: Server, publicKey: string) => {
  try {
    // check if account exist
    const accountArray: any = [];

    const account = await server.loadAccount(publicKey);

    if (account) {
      account.balances.forEach(function (balance) {
        const account = {
          type: balance.asset_type,
          balance: balance.balance,
        };
        accountArray.push(account);
      });
    }

    // Login successful, write token, and send back user
    return { ...accountArray, account };
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
};
