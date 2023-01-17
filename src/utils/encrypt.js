import crypto from "crypto";
import { NIFTRON } from "niftron-client-sdk";

export default {
  generateSalt: () => {
    return crypto.randomBytes(128).toString("base64");
  },

  asymmetricEncryption: (field, toPublicKey, fromSecretKey) => {
    const asymmetricEncryption = new NIFTRON.utils.asymmetricEncryption();
    const response = asymmetricEncryption.encrypt(
      field,
      toPublicKey,
      fromSecretKey
    );

    return response;
  },

  asymmetricDecryption: (encryptionObject, toSecretKey) => {
    const asymmetricEncryption = new NIFTRON.utils.asymmetricEncryption();
    const response = asymmetricEncryption.decrypt(
      encryptionObject,
      toSecretKey
    );
    return response;
  },

  // --- Symmetric encryption/decryption --- //

  symmetricEncryption: (field, fromSecretKey) => {
    const response = NIFTRON.utils.symmetricEncryption.encrypt(
      field,
      fromSecretKey
    );

    console.log("AES", response);
    return response;
  },
  symmetricDecryption: (encryptedField, fromSecretKey) => {
    const response = NIFTRON.utils.symmetricEncryption.decrypt(
      encryptedField,
      fromSecretKey
    );
    return response;
  },

  generateHash: (salt, pwd) => {
    return crypto.createHmac("sha256", salt).update(pwd).digest("hex");
  },
};
