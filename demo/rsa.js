const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');

const key = new NodeRSA({b : 1024});
const publicDer = key.exportKey('pkcs8-public-pem');
const privateDer = key.exportKey('pkcs8-private-pem');
fs.mkdir(path.join(__dirname, './pem'), function (err) {
    fs.unlink(path.join(__dirname, './pem/public.pem'), function (err) {
        let publicFs = fs.createWriteStream(path.join(__dirname, './pem/public.pem'));
        publicFs.write(publicDer);
    });
    fs.unlink(path.join(__dirname, './pem/private.pem'), function (err) {
        let privateFs = fs.createWriteStream(path.join(__dirname, './pem/private.pem'));
        privateFs.write(privateDer);
    });
});
console.log(publicDer);
console.log(privateDer);
