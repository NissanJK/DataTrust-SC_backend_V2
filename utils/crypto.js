const CryptoJS = require("crypto-js");

const encrypt = (plaintext) => {
  return CryptoJS.AES.encrypt(
    plaintext,
    process.env.SECRET_KEY
  ).toString();
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(
    ciphertext,
    process.env.SECRET_KEY
  );
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = { encrypt, decrypt };
