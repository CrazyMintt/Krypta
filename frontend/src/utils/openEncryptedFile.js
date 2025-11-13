import { decryptFile } from "./decryptFile";
import { mimeFromExtension } from "./mimeTypes";

export async function openEncryptedFile(cryptoKey, item) {
  try {
    const decryptedBuffer = await decryptFile(
      cryptoKey,
      item.fileCipher,
      item.fileIv
    );

    const mime = mimeFromExtension(item.fileExtension);

    const blob = new Blob([decryptedBuffer], { type: mime });

    const url = URL.createObjectURL(blob);

    const newTab = window.open(url, "_blank");

    if (!newTab) {
      const a = document.createElement("a");
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setTimeout(() => URL.revokeObjectURL(url), 5000);

  } catch (err) {
    console.error("Erro ao abrir arquivo:", err);
    alert("Não foi possível abrir o arquivo.");
  }
}
