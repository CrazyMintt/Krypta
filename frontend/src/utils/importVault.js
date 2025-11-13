import Papa from "papaparse";
import * as credentialService from "../services/credentialService";
import { encryptText } from "./encryptText";
import { toBase64 } from "./toBase64";

/**
 * Lê arquivo local
 */
export function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function importDecryptedJSON(fileContent, cryptoKey) {
  const entries = JSON.parse(fileContent);

  for (const entry of entries) {
    const encrypted = await encryptText(cryptoKey, entry.password || "");

    const form = {
      nome_aplicacao: entry.name,
      senha: {
        senha_cripto: toBase64(encrypted.ciphertext),
        iv_senha_cripto: toBase64(encrypted.iv),
        ...(entry.email ? { email: entry.email } : {}),
        ...(entry.url ? { host_url: entry.url } : {}),
      }
    };

    await credentialService.createCredential(form);
  }
}

export async function importDecryptedCSV(fileContent, cryptoKey) {
  const { data } = Papa.parse(fileContent, { header: true });

  for (const row of data) {
    if (!row.name) continue;

    const encrypted = await encryptText(cryptoKey, row.password || "");

    const form = {
      nome_aplicacao: row.name,
      senha: {
        senha_cripto: toBase64(encrypted.ciphertext),
        iv_senha_cripto: toBase64(encrypted.iv),
        ...(row.email ? { email: row.email } : {}),
        ...(row.url ? { host_url: row.url } : {}),
      }
    };

    await credentialService.createCredential(form);
  }
}
