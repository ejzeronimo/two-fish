import pako from 'pako';
import { Buffer } from 'buffer';

var globalCrcTable: any;

// makes tyhe initial crc table
let makeCrcTable = () => {
    let c;
    let crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

// returns the raw crc number
let crc32 = (str: any) => {
    let crcTable = globalCrcTable || (globalCrcTable = makeCrcTable());
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};

// turns the number into an array of decimal values (like is needed for the png gen)
let generateCrcByteArray = (input: any) => {
    // calc the crc number
    let crcHexArray = crc32(input).toString(16).match(/.{2}/g);
    let result = [];

    for (let i = 0; i < crcHexArray!.length; i++) {
        result.push(parseInt(crcHexArray![i], 16));
    }

    return result;
};

// returns a 4 byte array
let generateArrayFromNumber = (input: number) => input.toString(16).padStart(8, '0').match(/.{2}/g)!.map((n: string) => parseInt(n, 16));

let generateNumberFromArray = (input: number[]) => parseInt(Buffer.from(input).toString('hex'), 16);

/*
NOTE:

adheres to this standard
https://www.w3.org/TR/png/
*/

export const generatePngUri = (width: number, height: number, data: number[]) => {
    // create the PNG signature
    let signature = [137, 80, 78, 71, 13, 10, 26, 10];

    // then make the IHDR chunk (4 byte identifier + 4 byte width + 4 byte length + 8[color depth] + 6[color type] +  0[compression method] + 0 [filter method] + 0 [interlace method])
    let hdr = [73, 72, 68, 82, ...generateArrayFromNumber(width), ...generateArrayFromNumber(height), 8, 6, 0, 0, 0];
    let hdrLength = [0, 0, 0, 13];
    let hdrCrc = generateCrcByteArray(Buffer.from(hdr).toString());

    // then make the sRGB chunk (4 byte identifier + 0[rendering intent])
    let srgb = [115, 82, 71, 66, 0];
    let srgbLength = [0, 0, 0, 1];
    let srgbCrc = generateCrcByteArray(Buffer.from(srgb).toString());

    // onto the bulk IDAT, hoping one should be enough (4 byte identifier + compressed pixel data)
    let formattedData = data.reduce((result: any[], element, i) => {
        result.push(element);

        if ((i + 1) % (4 * width) === 0) {
            result.push(0);
        }

        return result;
    }, []);

    // add the first 0
    formattedData = [0, ...formattedData];

    let idat = [73, 68, 65, 84, ...pako.deflate(Buffer.from(formattedData))];
    let idatLength = generateArrayFromNumber(idat.length - 4);
    let idatCrc = generateCrcByteArray(Buffer.from(idat).toString());

    //finally IEND (4 byte identifier)
    let iend = [73, 69, 78, 68];
    let iendLength = [0, 0, 0, 0];
    let iendCrc = generateCrcByteArray(Buffer.from(iend).toString())

    // masssive concat for final array
    let raw = [...signature, ...hdrLength, ...hdr, ...hdrCrc, ...srgbLength, ...srgb, ...srgbCrc, ...idatLength, ...idat, ...idatCrc, ...iendLength, ...iend, ...iendCrc];

    return 'data:image/png;base64,' + Buffer.from(raw).toString('base64');
};

export const getImageFromPngUri = (uri: string) => {
    // first remove the header
    let data = [...Buffer.from(uri.replace('data:image/png;base64,', ''), 'base64')];

    // remove the PNG signature
    data.splice(0, 8);

    // then remove the IHDR chunk
    let hdrLength = generateNumberFromArray(data.splice(0, 4));
    // splice out the identifier
    data.splice(0, 4);
    // then get the width and height
    let w = generateNumberFromArray(data.splice(0, 4));
    let h = generateNumberFromArray(data.splice(0, 4));
    // git rid of the rest of the data
    data.splice(0, (hdrLength - 8) + 4);

    // now the sRGB chunk
    let srgbLength = generateNumberFromArray(data.splice(0, 4));
    // identifier + length + crc
    data.splice(0, 4 + srgbLength + 4);

    // finally the IDAT chunk
    let idatLength = generateNumberFromArray(data.splice(0, 4));
    // split out the identifier
    data.splice(0, 4);
    let idat = data.splice(0, idatLength);
    let raw = [...pako.inflate(Buffer.from(idat))];

    let pixels = raw.filter((_, i) => {
        return i % ((4 * w) + 1) !== 0;
    })

    return {
        width: w,
        height: h,
        data: pixels
    };
};