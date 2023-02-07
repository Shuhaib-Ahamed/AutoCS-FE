const fetch = require("node-fetch");

const runTests = async () => {
  // Get the number of transactions in the last 5 minutes for Stellar
  const getStellarTransactionCount = async () => {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;
    const endpoint = `https://horizon.stellar.org/transactions?cursor=now&limit=200&start_time=${fiveMinutesAgo}`;
    try {
      const response = await fetch(endpoint);
      const json = await response.json();
      const transactions = json._embedded.records;
      return transactions.length;
    } catch (error) {
      console.error(error);
    }
  };

  // Get the number of transactions in the last 5 minutes for BigchainDB
  const getBigchainDBTransactionCount = async () => {
    const endpoint =
      "https://test.bigchaindb.com/api/v1/transactions?operation=COMMIT";
    try {
      const response = await fetch(endpoint);
      const json = await response.json();
      return json.length;
    } catch (error) {
      console.error(error);
    }
  };

  // Calculate the number of transactions per second for Stellar and BigchainDB
  const calculateTransactionsPerSecond = async (transactionCount) => {
    return transactionCount / 5;
  };

  const stellarTransactionCount = await getStellarTransactionCount();
  const bigchainDBTransactionCount = await getBigchainDBTransactionCount();

  const stellarTransactionsPerSecond = await calculateTransactionsPerSecond(
    stellarTransactionCount
  );
  const bigchainDBTransactionsPerSecond = await calculateTransactionsPerSecond(
    bigchainDBTransactionCount
  );

  // The base fee in Stellar is 100 stroops (0.00001 XLM) per operation
  const stellarBaseFee = 0.00001;

  // The transaction fee in BigchainDB is set by the network validators
  const bigchainDBTransactionFee = "variable";

  return Promise.resolve({
    Stellar: {
      network_throughput: stellarTransactionsPerSecond,
      gas_fee: stellarBaseFee,
      transactions_per_second: stellarTransactionsPerSecond,
    },
    BigchainDB: {
      network_throughput: bigchainDBTransactionsPerSecond,
      gas_fee: bigchainDBTransactionFee,
      transactions_per_second: bigchainDBTransactionsPerSecond,
    },
  });
};

runTests().then((results) => {
  console.log(results);
});
