export type Item = {
  name: string;
  slug: string;
  description?: string;
};

export const demos: { name: string; items: Item[] }[] = [
  {
    name: "Account",
    items: [
      {
        name: "Create An Account",
        slug: "signup",
        description:
          "Create and Web3 account and save the public and secret keys",
      },
      {
        name: "Login",
        slug: "login",
        description: "Login to your Stellar account",
      },
    ],
  },
  {
    name: "Transactions",
    items: [
      {
        name: "Upload",
        slug: "upload",
        description: "Upload and encrypt data to BigchainDB",
      },
      {
        name: "SearchByTxId",
        slug: "searchById",
        description: "Search for an asset by the transaction ID",
      },
      {
        name: "Transfer",
        slug: "transfer",
        description:
          "Transfer an Asset using Asymettric encryption and BigChainDb",
      },
    ],
  },
];
