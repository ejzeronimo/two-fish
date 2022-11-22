import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import * as CryptoJS from 'crypto-js';
import tf from '../../public/twofish';

import Styles from '../../public/dec.css'

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

export default function Decrypter() {
    const [sourceName, setSourceName] = useState('');
    const [sourceData, setSourceData] = useState({});
    const [processedImage, setProcessedImage] = useState('');

    let decryptFile = () => {
        // make the pixels into a long string in base64
        let plaintext = TwoFish.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(sourceData.ciphertext), salt: CryptoJS.enc.Hex.parse(sourceData.salt) }, document.getElementById('dec-key').value, { padding: CryptoJS.pad.NoPadding }).toString(CryptoJS.enc.Base64);

        let encodedPixels = new Uint8ClampedArray(Buffer.from(plaintext, 'base64'));
        let encodedImage = new ImageData(encodedPixels, sourceData.w, sourceData.h);

        // create a hidden working canvas
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        canvas.width = sourceData.w;
        canvas.height = sourceData.h;

        // put the image data back onto the canvas
        context.putImageData(encodedImage, 0, 0);
        canvas.remove();

        // convert the canvas to an image then set it to the state
        setProcessedImage(canvas.toDataURL());
    };

    let downloadFile = () => {
        if (processedImage) {
            let a = document.createElement("a");
            a.href = processedImage;
            a.download = 'out.png';

            a.click();
            a.remove();
        }
    };

    let handleFiles = (files) => {
        // get the file input
        let selectedFile = [...files][0];
        let read = new FileReader();

        read.onload = (e) => {
            let data = JSON.parse(e.target.result);

            setSourceData(data);
            setSourceName(selectedFile.name);
        };

        if (selectedFile) {
            // get it this way for base 64 link
            read.readAsText(selectedFile);
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
                    <input type='file' id='dec-file' onChange={fileHandler} name='dec-file' accept='.json' />
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