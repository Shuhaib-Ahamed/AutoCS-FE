
//multiform/files
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

//BigChainDB interface
const BigchainDB = require('bigchaindb-driver')
const bip39 = require('bip39')
const jsSha3 = require('js-sha3')
const sha3 = require('sha3')
const encryptor = require('../utilities/encryption');
const BigChainDbI = require('../utilities/BigChainDbI');
const bdbUser = new BigchainDB.Ed25519Keypair()
const API_PATH = 'https://test.bigchaindb.com/api/v1/'
const conn = new BigchainDB.Connection(API_PATH)


const logger = require('morgan')

module.exports = {

    upload: {
        post: async (req, res, next)  => {

            const uploadedFiles = req.file;
            const formData = req.body;

            console.log('uploaded files',uploadedFiles)
            console.log('form data',formData)
            console.log('encryption key',formData['encryptionKey'])
            
            const assetdata = {
                'model': {
                    'asset_type': 'digital_asset',
                    'asset_issuer': 'CVER platform'
                }
            }

            let json = JSON.stringify(uploadedFiles);
            let cypher = encryptor.fileEncrypt(json,formData['encryptionKey'])
            let cypherStringified = cypher.toString()
            assetdata.model.encrypted_model = cypherStringified;

            let metadata = {}
            for (let key of Object.keys(formData)) {
                metadata[key] = formData[key]
            }
            
            let responce = await BigChainDbI.createSimpleAsset(bdbUser, assetdata, metadata);
 
            if (responce.isErr) {
                return res.status(500).send({ message: `error when uploading asset!`})
            }

            return res.status(200).send({ message: 'Upload successfull', 
                                          asset: responce.res});
            
        }, 
    },

    downloadAsset: {
        post: async (req, res, next) => {

            const formData = req.body;
            const encryptionKey = formData['encryptionKey']
            const assetId = formData['assetId']

            let responce = await BigChainDbI.downloadAsset(assetId, encryptionKey);

            if (!responce) {
                return res.status(500).send({ message: `"error when getting asset with id= " + ${assetId}`})
            }

            return res.status(200).send({ decryptedFile : responce});
        }
    },

    searchAssetById: {
        post: async (req, res, next) => {

            const formData = req.body;
            if (!formData.assetId) return;
            
            let responce = await BigChainDbI.searchAssetById(formData.assetId);

            if (responce.isErr) {
                return res.status(500).send({ message: `"error when getting asset with id= " + ${formData.assetId}`})
            }

            return res.status(200).send({ asset: responce.res});
        }
    },

    searchAssetByMetadata: {
        post: async (req, res, next) => {

            const formData = req.body;
            if (!formData.metadataKeyword) return;
            
            let responce = await BigChainDbI.searchAssetByMetadata(formData.metadataKeyword);

            if (responce.isErr) {
                return res.status(500).send({ message: `"error when getting asset with metadata: " + ${formData.metadataKeyword}`})
            }

            return res.status(200).send({ asset: responce.res});
        }
    }
};


