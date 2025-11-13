export async function encryptText(cryptoKey, plaintext) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    cryptoKey,
    enc.encode(plaintext)
  );

  return {
    iv: Array.from(iv),                                 // salvar no backend
    ciphertext: Array.from(new Uint8Array(encrypted))   // salvar no backend
  };
}
