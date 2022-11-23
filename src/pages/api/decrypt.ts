import type { APIRoute } from "astro";
import tf from '../../scripts/twofish';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { getKeyAndIV } from '../../scripts/helper';


// make out instance of twofish
const TwoFish = tf();

export const post: APIRoute = async ({ request }) => {
  let req: { key: string, ciphertext: string } = await request.json();

  let keyObject = getKeyAndIV(req.key);
  let plaintext = TwoFish.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(req.ciphertext) }, keyObject.key, { padding: CryptoJS.pad.ZeroPadding, iv: keyObject.iv }).toString(CryptoJS.enc.Base64);

  return {
    body: JSON.stringify({
      plaintext: plaintext
    })
  }
};