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
        slug: "playground/signup",
        description:
          "Create and Web3 account and save the public and secret keys",
      },
      {
        name: "Login",
        slug: "playground/login",
        description: "Login to your Stellar account",
      },
    ],
  },
  {
    name: "Transactions",
    items: [
      {
        name: "Upload",
        slug: "playground/upload",
        description: "Upload and encrypt data to BigchainDB",
      },
      {
        name: "SearchByTxId",
        slug: "playground/searchById",
        description: "Search for an asset by the transaction ID",
      },
      {
        name: "Transfer",
        slug: "playground/transfer",
        description:
          "Transfer an Asset using Asymettric encryption and BigChainDb",
      },
    ],
  },
];
