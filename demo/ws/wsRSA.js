const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');

module.exports = () => {
    return new Promise((res, rej) => {
        try{
            let privatePem = fs.readFileSync(path.join(__dirname, '../pem/private.pem'), {
                encoding : 'utf8'
            });
            let privateKey = new NodeRSA(privatePem);
            let rsa_ciphertext = privateKey.encryptPrivate('13699864733', 'base64', 'utf8');
            res(rsa_ciphertext);
        }catch (e) {
            rej(e);
        }
    });
}