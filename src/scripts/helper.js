import CryptoJS from 'crypto-js';

export const getKeyAndIV = (password) => {
    let iterations = 234;

    let salt = {
        words: [
            1960224351,
            3636945735,
            1878752334,
            389456778
        ],
        sigBytes: 16
    };

    let iv128Bits = CryptoJS.PBKDF2(password, salt, { keySize: 2, iterations: iterations });
    let key256Bits = CryptoJS.PBKDF2(password, salt, { keySize: 4, iterations: iterations });

    return {
        iv: iv128Bits,
        key: key256Bits
    };
};