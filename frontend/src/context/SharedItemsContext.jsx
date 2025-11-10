import React, { createContext, useState, useContext, useEffect } from "react";
import { getMyShares, deleteShare } from "../services/shareService";

const SharedItemsContext = createContext();

export const useSharedItems = () => useContext(SharedItemsContext);

export const SharedItemsProvider = ({ children }) => {
  const [sharedItems, setSharedItems] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShares = async () => {
      try {
        const data = await getMyShares();
        const formatted = data.map((share) => ({
          id: share.id,
          name: share.token_acesso || "Compartilhamento",
          sharedWith: "link",
          accessesLeft: share.n_acessos_total - share.n_acessos_atual,
          expiresIn: new Date(share.data_expiracao).toLocaleString(),
        }));
        setSharedItems(formatted);
      } catch (err) {
        console.error("Erro ao buscar compartilhamentos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShares();
  }, []);

  const addSharedItem = (item) => {
    setSharedItems((prev) => [item, ...prev]);
  };

  const removeSharedItem = async (itemId) => {
    try {
      await deleteShare(itemId);
      setSharedItems((prev) => prev.filter((item) => item.id !== itemId));

      const newLogEntry = {
        type: "delete",
        title: `Compartilhamento ${itemId} removido`,
        time: new Date().toLocaleString(),
      };
      setActivityLog((prev) => [newLogEntry, ...prev]);
    } catch (err) {
      console.error("Erro ao remover compartilhamento:", err);
      alert("Erro ao remover compartilhamento.");
    }
  };

  const value = {
    sharedItems,
    addSharedItem,
    removeSharedItem,
    activityLog,
    setActivityLog,
    loading,
  };

  return (
    <SharedItemsContext.Provider value={value}>
      {children}
    </SharedItemsContext.Provider>
  );
};
