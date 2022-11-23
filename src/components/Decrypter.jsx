import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import tf from '../scripts/twofish';
import {generatePngUri,  getImageFromPngUri } from '../scripts/PngGenerator';

// make out instance of twofish
const TwoFish = tf();

const dragOverHandler = (ev) => {
    ev.preventDefault();
};

const getKeyAndIV = function (password) {
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

export default function Decrypter() {
    const [sourceName, setSourceName] = useState('');
    const [sourceImage, setSourceImage] = useState('');
    const [processedImage, setProcessedImage] = useState('');

    let decryptFile = () => {
        // after we have the file, we need to get the pixels
        let imgRaw = new Image();

        imgRaw.onload = () => {
            // convert uri to png data
            let img = getImageFromPngUri(imgRaw.src);

            // make the pixels into a long string in base64
            let base64Image = Buffer.from(img.data).toString('base64');

            // make the pixels into a long string in base64
            let keyObject = getKeyAndIV(document.getElementById('dec-key').value);
            let plaintext = TwoFish.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(base64Image) }, keyObject.key, { padding: CryptoJS.pad.NoPadding, iv: keyObject.iv }).toString(CryptoJS.enc.Base64);

            let encodedPixels = new Uint8ClampedArray(Buffer.from(plaintext, 'base64'));

            // convert the canvas to an image then set it to the state
            setProcessedImage(generatePngUri(img.width, img.height, encodedPixels));
        };

        // load the image
        imgRaw.src = sourceImage;
    };

    let downloadFile = () => {
        if (processedImage) {
            let a = document.createElement("a");
            a.href = processedImage;
            a.download = '[Decrypted]' + sourceName.split('.')[0] + '.png';

            a.click();
            a.remove();
        }
    };

    let handleFiles = (files) => {
        // get the file input
        let selectedFile = [...files][0];
        let read = new FileReader();

        read.onload = (e) => {
            setSourceImage(e.target.result);
            setSourceName(selectedFile.name);
        };

        if (selectedFile) {
            // get it this way for base 64 link
            read.readAsDataURL(selectedFile);
        }
    };

    let dropHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();

        let dt = e.dataTransfer;
        let files = dt.files;

        handleFiles(files);
    };

    let fileHandler = (e) => {
        e.preventDefault();

        handleFiles(e.target.files);
    };

    useEffect(() => {
        // show the processed image
        let img = new Image();

        img.onload = function () {
            let canvasEdited = document.getElementById('dec-image');
            let ctxEdited = canvasEdited.getContext('2d');

            canvasEdited.width = img.width;
            canvasEdited.height = img.height;

            ctxEdited.clearRect(0, 0, canvasEdited.width, canvasEdited.height);
            ctxEdited.drawImage(img, 0, 0);
        };

        img.src = processedImage;

        if (processedImage) {
            document.getElementById('dec-image').style.display = 'block';
        }
    });

    return <div className='dec-card'>
        <div>
            <h1>Decrypt:</h1>

            <label htmlFor='dec-key'>Key:</label>
            <input type='text' id='dec-key' name='dec-key' placeholder='619ca281893546bc9ca882fce57b4f67'></input>

            <div className='dec-file-drop' id='dec-file-drop' onDrop={dropHandler} onDragOver={dragOverHandler}>
                <div>
                    <p>
                        Drag and drop a file or <label htmlFor='dec-file'><i>choose file...</i></label>
                        {sourceName ? <br></br> : null}
                        <i>{sourceName}</i>
                    </p>
                    {/* this is hidden */}
                    <input type='file' id='dec-file' onChange={fileHandler} name='dec-file' accept='image/png' />
                </div>
            </div>

            <canvas id='dec-image' width='0' height='0'></canvas>

            <div className='dec-button-bar'>
                <button onClick={decryptFile}>Decrypt</button>
                <button onClick={downloadFile}>Download</button>
            </div>
        </div>
    </div >;
}