import crypto from "crypto";
import { EncryptionObject } from "lib/Types/Types";
import { NIFTRON } from "niftron-client-sdk";

export const generateSalt = async (): Promise<string> => {
  return crypto.randomBytes(128).toString("base64");
};

export const asymmetricEncryption = (
  field: any,
  toPublicKey: string,
  fromSecretKey: string
) => {
  const asymmetricEncryption = new NIFTRON.utils.asymmetricEncryption();
  const response = asymmetricEncryption.encrypt(
    field,
    toPublicKey,
    fromSecretKey
  );
  return response;
};

export const asymmetricDecryption = (
  encryptionObject: EncryptionObject,
  toSecretKey: string
) => {
  const asymmetricEncryption = new NIFTRON.utils.asymmetricEncryption();
  const response = asymmetricEncryption.decrypt(encryptionObject, toSecretKey);
  return response;
};

export const symmetricEncryption = (field: string, fromSecretKey: string) => {
  const response = NIFTRON.utils.symmetricEncryption.encrypt(
    field,
    fromSecretKey
  );

  console.log("cypherText Encryption", response);
  return response;
};

export const symmetricDecryption = (
  encryptedField: string,
  fromSecretKey: string
) => {
  const response = NIFTRON.utils.symmetricEncryption.decrypt(
    encryptedField,
    fromSecretKey
  );
  console.log("cypherText Decryption ", response);
  return response;
};

export const generateHash = (value: string) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
