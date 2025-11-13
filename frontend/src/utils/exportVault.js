import * as dataService from "../services/dataService";
import { decryptText } from "./decryptText";

function downloadFile(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export async function exportVaultDecryptedJSON(cryptoKey) {
  if (!cryptoKey) {
    throw new Error("Chave de criptografia ausente. Faça login novamente.");
  }

  const items = await dataService.searchData({
    page_size: 9999,
    page_number: 1,
    id_separadores: [],
  });

  const result = [];

  for (const item of items) {
    const encrypted = item.senha?.senha_cripto;
    const iv = item.senha?.iv_senha_cripto;

    let password = "";
    if (encrypted && iv) {
      try {
        password = await decryptText(cryptoKey, encrypted, iv);
      } catch {
        password = "[erro]";
      }
    }

    result.push({
      id: item.id,
      name: item.nome_aplicacao,
      email: item.senha?.email || "",
      password,
      url: item.senha?.host_url || "",
      tags:
        (item.separadores || [])
          .filter((s) => s.tipo === "tag")
          .map((s) => s.nome) || [],
      created_at: item.criado_em,
    });
  }

  downloadFile(
    JSON.stringify(result, null, 2),
    "krypta-export.json",
    "application/json"
  );
}

/* ---------- CSV ---------- */
export async function exportVaultDecryptedCSV(cryptoKey) {
  if (!cryptoKey) {
    throw new Error("Chave de criptografia ausente. Faça login novamente.");
  }

  const items = await dataService.searchData({
    page_size: 9999,
    page_number: 1,
    id_separadores: [],
  });

  const lines = [];
  lines.push("name,email,password,url,tags");

  for (const item of items) {
    const encrypted = item.senha?.senha_cripto;
    const iv = item.senha?.iv_senha_cripto;

    let password = "";
    if (encrypted && iv) {
      try {
        password = await decryptText(cryptoKey, encrypted, iv);
      } catch {
        password = "[erro]";
      }
    }

    const tagsStr = (item.separadores || [])
      .filter((s) => s.tipo === "tag")
      .map((s) => s.nome)
      .join(", ");

    const row = [
      `"${item.nome_aplicacao || ""}"`,
      `"${item.senha?.email || ""}"`,
      `"${password}"`,
      `"${item.senha?.host_url || ""}"`,
      `"${tagsStr}"`,
    ].join(",");

    lines.push(row);
  }

  const csvContent = lines.join("\n");

  downloadFile(csvContent, "krypta-export.csv", "text/csv");
}