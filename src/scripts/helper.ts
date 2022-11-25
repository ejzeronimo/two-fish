import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';

export const getKeyAndIV = (password: string) => {
    let iterations = 234;

    let salt: any = {
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

export const generatePngUri = (width: number, height: number, data: number[]) => {
    let png = new PNG({ width: width, height: height });

    // add data and pack
    png.data = Buffer.from(data);

    png.pack();

    let chunks: any[] = [];

    png.on('data', function (chunk: any) {
        chunks.push(chunk);
    });


    return new Promise((resolve, reject) => {
        png.on('end', function () {
            let result = Buffer.concat(chunks);

            resolve('data:image/png;base64,' + result.toString('base64'));
        });
    });
};

export const getImageFromPngUri = (uri: string) => {

    var png = PNG.sync.read(Buffer.from(uri.replace('data:image/png;base64,',''),'base64'));

    return {
        width: png.width,
        height: png.height,
        data: [...png.data]
    };
};