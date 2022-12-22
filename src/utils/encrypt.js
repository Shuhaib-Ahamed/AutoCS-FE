import CryptoJS from "crypto-js";
import crypto from "crypto";

export default {
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
