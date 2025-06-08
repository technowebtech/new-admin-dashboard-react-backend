const CryptoJS = require('crypto-js');
const encryptDecryptKey = process.env.ENCRYPTION_KEY;
function DecryptApiKeys(data) {
  const output = {
    status: false,
    data: {}
  };
  const bytes = CryptoJS.AES.decrypt(data, encryptDecryptKey);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  if (decryptedData.length > 0) {
    output.status = true;
    output.data = decryptedData;
  }
  return output;
}
function EncryptDataApi(data) {
  const encryptText = CryptoJS.AES.encrypt(data, encryptDecryptKey).toString();
  return encryptText;
}

module.exports = { DecryptApiKeys, EncryptDataApi };