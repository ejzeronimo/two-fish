import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import { getKeyAndIV, generatePngUri, getImageFromPngUri } from '../scripts/helper';
import CryptoJS from 'crypto-js';
import tf from '../scripts/twofish';

// make out instance of twofish
const TwoFish = tf();

const dragOverHandler = (ev) => {
    ev.preventDefault();
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
            let plaintext = TwoFish.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(base64Image) }, keyObject.key, { padding: CryptoJS.pad.NoPadding, iv: keyObject.iv });

            let rawOut = new Int32Array(plaintext.words);
            let bytesOut = new Uint8Array(rawOut.buffer);

            let fixed = [];

            for (let i = 0; i < bytesOut.length - 3; i += 4) {
                for (let j = 3; j >= 0; j--) {
                    fixed.push(bytesOut[i + j]);
                }
            }

            generatePngUri(img.width, img.height, fixed).then((result) => {
                // convert the canvas to an image then set it to the state
                setProcessedImage(result);
            });
        };

        // load the image
        imgRaw.src = sourceImage;
    };

    let downloadFile = () => {
        if (processedImage) {
            let a = document.createElement("a");
            a.href = processedImage;
            a.download = '[Decrypted]' + sourceName.split('.')[0].replace('[Encrypted]', '') + '.png';

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

    return <div id='dec-card' className='card'>
        <div>
            <h1>Decrypt:</h1>

            <label htmlFor='dec-key'>Key:</label>
            <input type='text' id='dec-key' className='key' name='dec-key' placeholder='619ca281893546bc9ca882fce57b4f67'></input>

            <div className='file-drop' id='dec-file-drop' onDrop={dropHandler} onDragOver={dragOverHandler}>
                <div>
                    <p>
                        Drag and drop a file or <label htmlFor='dec-file'><i>choose file...</i></label>
                        {sourceName ? <br></br> : null}
                        <i>{sourceName}</i>
                    </p>
                    {/* this is hidden */}
                    <input type='file' id='dec-file' className='file' onChange={fileHandler} name='dec-file' accept='image/png' />
                </div>
            </div>

            <canvas id='dec-image' className='image' width='0' height='0'></canvas>

            <div className='button-bar'>
                <button onClick={decryptFile}>Decrypt</button>
                <button onClick={downloadFile}>Download</button>
            </div>
        </div>
    </div >;
}