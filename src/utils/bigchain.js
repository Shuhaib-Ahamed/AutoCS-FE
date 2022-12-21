import encryptor from 'file-encryptor';


export default function postToDB(dataPayload) {

const driver = require('bigchaindb-driver')
const bip39 = require('bip39')

const API_PATH = process.env.BIG_CHAIN_NET; //'https://test.bigchaindb.com/api/v1/'

// Create a new keypair for Alice and Bob
console.log("Seed phrase ",bip39.mnemonicToSeed('AZ TI TOI').slice(0,32))
const alice = new driver.Ed25519Keypair()
const bob = new driver.Ed25519Keypair()

console.log('Alice public key: ', alice.publicKey)
console.log('Alice private key: ', alice.privateKey)
console.log('Bob: ', bob.publicKey)

var encryptedFile = encryptor(dataPayload);

//Initialize the assetdata variable with the model_creator default to Dian
const assetdata = {
        'model': {
                'model_creator': 'Dian Balta'
        }
}
assetdata.model.encrypted_model = encryptedFile; //Possibly need to change the input payload to BCDB
console.log('dataPayload',dataPayload);
//assetdata.model.printed_model = dataPayload;

const metadata = {'model_description': 'chair'}

// Construct a transaction payload
const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        assetdata,
        metadata,

        // A transaction needs an output
        [ driver.Transaction.makeOutput(
                        driver.Transaction.makeEd25519Condition(alice.publicKey))
        ],
        alice.publicKey
)

// Sign the transaction with private keys of Alice to fulfill it
const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)
console.log("Signed TX",txCreateAliceSimpleSigned)

// Send the transaction off to BigchainDB
const conn = new driver.Connection(API_PATH)
/*
const conn = new driver.Connection(API_PATH,{ 
        app_id: '218747a2',
        app_key: '717a15fc4fa5386a15f5ff576e2a9e28'
    })
*/

console.log("Connection",conn)

conn.postTransaction(txCreateAliceSimpleSigned)

        // Check status of transaction every 0.5 seconds until fulfilled
        .then(() => conn.pollStatusAndFetchTransaction(txCreateAliceSimpleSigned.id))
        .then(retrievedTx => console.log('Transaction', retrievedTx.id, 'successfully posted.'))
        
        .then(() => conn.getStatus(txCreateAliceSimpleSigned.id))
        .then(status => console.log('Retrieved status method 2: ', status))
        .then(() => conn.searchAssets(txCreateAliceSimpleSigned.id))
        .then(assets => console.log('Found assets creaed by Dian Balta: ', assets))


        // Transfer bicycle to Bob
        /*
        .then(() => {
                const txTransferBob = driver.Transaction.makeTransferTransaction(
                        // signedTx to transfer and output index
                        [{ tx: txCreateAliceSimpleSigned, output_index: 0 }],
                        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
                        // metadata
                
                )

                // Sign with alice's private key
                let txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)
                console.log('Posting signed transaction: ', txTransferBobSigned)

                // Post and poll status
                return conn.postTransaction(txTransferBobSigned)
        })
        .then(res => {
                console.log('Response from BDB server:', res)
                return conn.pollStatusAndFetchTransaction(res.id)
        })
        .then(tx => {
                console.log('Is Bob the owner?', tx['outputs'][0]['public_keys'][0] === bob.publicKey)
                console.log('Was Alice the previous owner?', tx['inputs'][0]['owners_before'][0] === alice.publicKey )
        })
        // Search for asset based on the serial number of the bicycle
        .then(() => conn.searchAssets('Bicycle Inc.'))
        .then(assets => console.log('Found assets with serial number Bicycle Inc.:', assets))
        */
return;
}