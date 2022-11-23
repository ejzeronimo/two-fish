import type { APIRoute } from "astro";
import tf from '../../scripts/twofish';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { getKeyAndIV } from '../../scripts/helper';


// make out instance of twofish
const TwoFish = tf();

export const post: APIRoute = async ({ request }) => {
  let req: { key: string, plaintext: string } = await request.json();

  let keyObject = getKeyAndIV(req.key);
  let cipher = TwoFish.encrypt(CryptoJS.enc.Base64.parse(req.plaintext), keyObject.key, { padding: CryptoJS.pad.ZeroPadding, iv: keyObject.iv });

  return {
    body: JSON.stringify({
      ciphertext: cipher.ciphertext.toString(CryptoJS.enc.Base64)
    })
  }
};