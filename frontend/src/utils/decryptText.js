import { fromBase64 } from "./fromBase64";

export async function decryptText(cryptoKey, ciphertextB64, ivB64) {
  const ciphertext = fromBase64(ciphertextB64);
  const iv = fromBase64(ivB64);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    cryptoKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
