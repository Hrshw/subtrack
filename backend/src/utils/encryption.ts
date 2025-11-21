import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_DO_NOT_USE_IN_PROD';

export const encryptToken = (token: string): string => {
    return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

export const decryptToken = (ciphertext: string): string => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};
