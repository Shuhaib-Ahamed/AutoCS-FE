import crypto from "crypto";
import { NIFTRON } from "niftron-client-sdk";

interface EncryptionObject {
  senderPublicKey: string;
  receiverPublicKey: string;
  nonce: string;
  encryptedData: any;
}

export const generateSalt = async (): Promise<string> => {
  return crypto.randomBytes(128).toString("base64");
};

export const asymmetricEncryption = async (
  field: string,
  toPublicKey: string,
  fromSecretKey: string
): Promise<any> => {
  const asymmetricEncryption = new NIFTRON.utils.asymmetricEncryption();
  const response = asymmetricEncryption.encrypt(
    field,
    toPublicKey,
    fromSecretKey
  );
  return response;
};

export const asymmetricDecryption = async (
  encryptionObject: EncryptionObject,
  toSecretKey: string
): Promise<any> => {
  const asymmetricEncryption = new NIFTRON.utils.asymmetricEncryption();
  const response = asymmetricEncryption.decrypt(encryptionObject, toSecretKey);
  return response;
};

export const symmetricEncryption = async (
  field: string,
  fromSecretKey: string
): Promise<string> => {
  const response = NIFTRON.utils.symmetricEncryption.encrypt(
    field,
    fromSecretKey
  );
  return response;
};

export const symmetricDecryption = async (
  encryptedField: string,
  fromSecretKey: string
): Promise<any> => {
  const response = NIFTRON.utils.symmetricEncryption.decrypt(
    encryptedField,
    fromSecretKey
  );
  return response;
};

export const generateHash = async (value: string): Promise<any> => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
