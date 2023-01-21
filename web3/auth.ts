import { Keypair, Server } from "stellar-sdk";

export const createAccount = async () => {
  // Generate a new keypair
  const pair = Keypair.random();
  const credentials = {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };

  // Fund the new account using the friendbot
  try {
    const stellarResponse = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(
        pair.publicKey()
      )}`
    );
    const res = await stellarResponse.json();
    if (res) {
      return { ...credentials };
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
};

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
