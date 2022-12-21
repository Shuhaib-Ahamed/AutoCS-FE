import {
  BadRequestException,
  NotFoundException,
} from "../../utils/apiErrors.js";
import StellarSdk from "stellar-sdk";
import fetch from "node-fetch";
var setllarServer = new StellarSdk.Server(
  "https://horizon-testnet.stellar.org"
);

export default {
  login: async (body) => {
    const { accountId } = body;
    const accountArray = [];

    // the JS SDK uses promises for most actions, such as retrieving an account
    const account = await setllarServer.loadAccount(accountId);

    account.balances.forEach(function (balance) {
      const account = {
        type: balance.asset_type,
        balance: balance.balance,
      };
      accountArray.push(account);
    });
    return { ...accountArray, account };
  },

  createAccount: async (body) => {
    // create a completely new and unique pair of keys
    const pair = StellarSdk.Keypair.random();

    const credentials = {
      publicKey: pair.publicKey(),
      secretKey: pair.secret(),
    };

    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(
          pair.publicKey()
        )}`
      );
      const responseJSON = await response.json();
      console.log("SUCCESS! You have a new account :)\n", responseJSON);
      return { ...responseJSON, credentials };
    } catch (e) {
      console.error("ERROR!", e);
    }
  },
};
