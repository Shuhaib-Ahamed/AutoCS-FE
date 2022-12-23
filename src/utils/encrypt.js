import CryptoJS from "crypto-js";
import crypto from "crypto";

export default {
  generateSalt: () => {
    return crypto.randomBytes(128).toString("base64");
  },

  asymmetricEncrypt: (value, publicKey) => {
    return crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      // We convert the data string to a buffer
      Buffer.from(value)
    );
  },

  asymmetricDecrypt: (value, privateKey) => {
    return crypto.privateDecrypt(
      {
        key: privateKey,
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the previous step
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      value.toString("base64")
    );
  },

  // asymmetricEncrypt: (value, encryptionKey) => {
  //   // var encryptedData = CryptoJS.AES.encrypt(value, encryptionKey);
  //   // // Convert the encrypted data to a base64-encoded string
  //   // const ciphertext = encryptedData.toString();
  //   // return ciphertext;

  //   // create a aes256 cipher based on our password
  //   var cipher = crypto
  //     .createCipher("aes-256-cbc", value)
  //     .update(encryptionKey);

  //   return cipher;
  // },

  // asymmetricDecrypt: (value, encryptionKey) => {
  //   // var decryptedData = CryptoJS.AES.decrypt(value, encryptionKey);
  //   // // Convert the decrypted data to a string
  //   // const plaintext = decryptedData.toString(CryptoJS.enc.Utf8);
  //   // return plaintext;

  //   var decipher = crypto.createDecipher("aes-256-cbc", encryptionKey);

  //   // update the decipher with our encrypted string
  //   decipher.update(value);

  //   return decipher;
  // },

  generateHash: (value, encryptionKey) => {
    // return crypto.createHmac("sha256", key).update(value).digest("hex");
    return CryptoJS.HmacSHA256(value, encryptionKey);
  },

  fileEncrypt: (file, encryptionKey) => {
    // Encrypt
    var ciphertext = CryptoJS.AES.encrypt(file, encryptionKey);
    return ciphertext;
  },
  fileDecrypt: (encModel, encryptionKey) => {
    // Decrypt
    var bytes = CryptoJS.AES.decrypt(encModel.toString(), encryptionKey);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  },
};
