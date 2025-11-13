import { createContext, useContext, useEffect, useState } from "react";
import { getSharedData } from "../services/shareService";
import { decryptFile } from "../utils/decryptFile";

const SharedWithMeContext = createContext();

export function SharedWithMeProvider({ children }) {
  const [receivedShares, setReceivedShares] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sharedWithMe") || "[]");
    } catch {
      return [];
    }
  });

  // Salva no localStorage
  useEffect(() => {
    localStorage.setItem("sharedWithMe", JSON.stringify(receivedShares));
  }, [receivedShares]);

  // Remove automaticamente compartilhamentos expirados
  useEffect(() => {
    const now = Date.now();
    const filtered = receivedShares.filter(
      (s) => new Date(s.dataExpiracao).getTime() > now
    );
    if (filtered.length !== receivedShares.length) {
      setReceivedShares(filtered);
    }
  }, []);

  const addSharedToken = async (token) => {
    const data = await getSharedData(token);

    const item = {
      token,
      dataExpiracao: data.data_expiracao,
      itens: data.itens,
      addedAt: new Date().toISOString(),
    };

    setReceivedShares((prev) => [...prev, item]);
  };

  const removeSharedToken = (token) => {
    setReceivedShares((prev) => prev.filter((s) => s.token !== token));
  };

  const decryptSharedItem = async (item, cryptoKey) => {
    // item: { dado_criptografado, iv_dado, meta }
    const decrypted = await decryptFile(
      cryptoKey,
      item.dado_criptografado,
      item.iv_dado
    );

    try {
      return new TextDecoder().decode(decrypted);
    } catch {
      return decrypted;
    }
  };

  return (
    <SharedWithMeContext.Provider
      value={{
        receivedShares,
        addSharedToken,
        removeSharedToken,
        decryptSharedItem,
      }}
    >
      {children}
    </SharedWithMeContext.Provider>
  );
}

export const useSharedWithMe = () => useContext(SharedWithMeContext);
