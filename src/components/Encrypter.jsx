import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import * as CryptoJS from 'crypto-js';
import tf from '../../public/twofish';

import Styles from '../../public/enc.css'

// make out instance of twofish
const TwoFish = tf();


// example of how to use
// var key = "Testing"
// var ciphertext = TwoFish.encrypt("Hello World!", key, null).toString();
// var plaintext = TwoFish.decrypt(ciphertext, key, null);

// var decryptedData = plaintext.toString(CryptoJS.enc.Utf8);
// console.log(decryptedData);


const dragOverHandler = (ev) => {
    ev.preventDefault();
}

export default function Encrypter() {
    const [sourceName, setSourceName] = useState('');
    const [sourceImage, setSourceImage] = useState('');
    const [processedImage, setProcessedImage] = useState('');

    let encryptFile = () => {
        // after we have the file, we need to get the pixels
        let img = new Image();

        img.onload = () => {
            // create a hidden working canvas
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            context.drawImage(img, 0, 0);
            let rawImage = context.getImageData(0, 0, canvas.width, canvas.height);

            // make the pixels into a long string in base64
            let base64Image = Buffer.from(rawImage.data).toString('base64');

            let ciphertext = TwoFish.encrypt(CryptoJS.enc.Base64.parse(base64Image), document.getElementById('enc-key').value, { padding: CryptoJS.pad.ZeroPadding }).ciphertext.toString(CryptoJS.enc.Base64);
            let encodedPixels = new Uint8ClampedArray(Buffer.from(ciphertext, 'base64'));
            let encodedImage = new ImageData(encodedPixels, rawImage.width, rawImage.height, { colorSpace: rawImage.colorSpace });

            // put the image data back onto the canvas
            context.putImageData(encodedImage, 0, 0);
            canvas.remove();

            // convert the canvas to an image then set it to the state
            setProcessedImage(canvas.toDataURL());
        };

        // load the image
        img.src = sourceImage;
    };

    let downloadFile = () => {
        if (processedImage) {
            let a = document.createElement("a");
            a.href = processedImage;
            a.download = 'Encrypted.png';

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
            let canvasEdited = document.getElementById('enc-image');
            let ctxEdited = canvasEdited.getContext('2d');

            canvasEdited.width = img.width;
            canvasEdited.height = img.height;

            ctxEdited.clearRect(0, 0, canvasEdited.width, canvasEdited.height);
            ctxEdited.drawImage(img, 0, 0);
        };

        img.src = processedImage;

        if (processedImage) {
            document.getElementById('enc-image').style.display = 'block';
        }
    });

    return <div className='enc-card'>
        <div>
            <h1>Encrypt:</h1>

            <label htmlFor='enc-key'>Key:</label>
            <input type='text' id='enc-key' name='enc-key' placeholder='619ca281893546bc9ca882fce57b4f67'></input>

            <div className='enc-file-drop' id='enc-file-drop' onDrop={dropHandler} onDragOver={dragOverHandler}>
                <div>
                    <p>
                        Drag and drop a file or <label htmlFor='enc-file'><i>choose file...</i></label>
                        {sourceName ? <br></br> : null}
                        <i>{sourceName}</i>
                    </p>
                    {/* this is hidden */}
                    <input type='file' id='enc-file' onChange={fileHandler} name='enc-file' accept='image/png, image/jpeg' />
                </div>
            </div>

            <canvas id='enc-image' width='0' height='0'></canvas>

            <div className='enc-button-bar'>
                <button onClick={encryptFile}>Encrypt</button>
                <button onClick={downloadFile}>Download</button>
            </div>
        </div>
    </div >;
}