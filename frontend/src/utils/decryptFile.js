export async function decryptFile(cryptoKey, ciphertextB64, ivB64) {
  if (!cryptoKey) {
    throw new Error("CryptoKey ausente.");
  }
  if (!ciphertextB64 || !ivB64) {
    throw new Error("Ciphertext ou IV ausentes.");
  }

  // Normaliza para string (pode vir string, ArrayBuffer, Uint8Array, etc.)
  const normalizeToString = (value) => {
    if (typeof value === "string") return value;
    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      const buffer = value instanceof Uint8Array ? value : new Uint8Array(value);
      return String.fromCharCode(...buffer);
    }
    // fallback defensivo
    return String(value);
  };

  let cipherStr = normalizeToString(ciphertextB64).replace(/\s/g, "");
  let ivStr = normalizeToString(ivB64).replace(/\s/g, "");

  // Decodifica de Base64 -> Uint8Array
  const ciphertext = Uint8Array.from(atob(cipherStr), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );

  // devolve ArrayBuffer
  return decrypted;
}
