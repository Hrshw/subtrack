"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptToken = exports.encryptToken = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_DO_NOT_USE_IN_PROD';
const encryptToken = (token) => {
    return crypto_js_1.default.AES.encrypt(token, SECRET_KEY).toString();
};
exports.encryptToken = encryptToken;
const decryptToken = (ciphertext) => {
    const bytes = crypto_js_1.default.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(crypto_js_1.default.enc.Utf8);
};
exports.decryptToken = decryptToken;
