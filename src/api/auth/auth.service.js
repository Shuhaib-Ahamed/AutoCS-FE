import StellarSdk from "stellar-sdk";
import fetch from "node-fetch";
import codes from "../../utils/httpHelper.js";
import messages from "../../utils/messages.js";
import User from "../models/user.model.js";
const STELAR_API = "https://horizon-testnet.stellar.org";

var setllarServer = new StellarSdk.Server(STELAR_API);

export default {
  login: async (body) => {
    try {
      const { email, password } = body;

      // check account is exist or not
      const user = await User.findOne({ email });

      if (!user) {
        return {
          message: messages.INVALID_EMAIL_OR_PASSWORD,
        };
      }

      //validate password
      if (!user.comparePassword(password))
        return {
          message: messages.INVALID_EMAIL_OR_PASSWORD,
        };

      // Make sure the user has been verified
      //TODO
      // if (!user.isVerified)
      //   return {
      //     message: messages.ACCOUNT_NOT_VERIFIED,
      //   };

      // Login successful, write token, and send back user
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      };
      return {
        token: user.generateJWT(),
        user: userData,
      };
    } catch (error) {
      return {
        message: messages.INTERNAL_SERVER_ERROR,
      };
    }

    // const { accountId } = body;
    // const accountArray = [];

    // // the JS SDK uses promises for most actions, such as retrieving an account
    // const account = await setllarServer.loadAccount(accountId);

    // account.balances.forEach(function (balance) {
    //   const account = {
    //     type: balance.asset_type,
    //     balance: balance.balance,
    //   };
    //   accountArray.push(account);
    // });
    // return { ...accountArray, account };
  },

  createAccount: async (body) => {
    console.log(body);
    const { email, username } = body;

    //generate random keypair from stellar
    const pair = StellarSdk.Keypair.random();

    const credentials = {
      publicKey: pair.publicKey(),
      secretKey: pair.secret(),
    };

    try {
      // check email is exist or not
      const userByEmail = await User.findOne({ email });

      if (userByEmail) {
        return {
          message: messages.EMAIL_ALREADY_EXIST,
        };
      }

      // check username is exist or not
      const userByUsername = await User.findOne({ username });
      if (userByUsername) {
        return {
          message: messages.USERNAME_ALREADY_EXIST,
        };
      }

      const stellarResponse = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(
          pair.publicKey()
        )}`
      );

      if (stellarResponse) {
        const { publicKey } = credentials;
        await new User({ publicKey, ...body }).save();

        return { ...credentials };
      } else {
        return { message: messages.INTERNAL_SERVER_ERROR };
      }
    } catch (error) {
      console.log(error);
      return { message: messages.INTERNAL_SERVER_ERROR };
    }
  },

  //   // create a completely new and unique pair of keys
  //   const pair = StellarSdk.Keypair.random();

  //   const credentials = {
  //     publicKey: pair.publicKey(),
  //     secretKey: pair.secret(),
  //   };

  //   try {
  //     const response = await fetch(
  //       `https://friendbot.stellar.org?addr=${encodeURIComponent(
  //         pair.publicKey()
  //       )}`
  //     );
  //     const responseJSON = await response.json();
  //     console.log("SUCCESS! You have a new account :)\n", responseJSON);
  //     return { ...responseJSON, credentials };
  //   } catch (e) {
  //     console.error("ERROR!", e);
  //   }
  // },
};
