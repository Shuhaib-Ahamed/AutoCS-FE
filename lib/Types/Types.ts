export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export interface BigChainKeypair {
  publicKey: string;
  privateKey: string;
}

export interface Result {
  isErr: boolean;
  res: any;
}
