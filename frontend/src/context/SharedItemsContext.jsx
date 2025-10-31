import React, { createContext, useState, useContext } from 'react';

const SharedItemsContext = createContext();

export const useSharedItems = () => {
  return useContext(SharedItemsContext);
};

const mockActiveShares = [
  {
    id: 1,
    name: 'senha_wifi',
    sharedWith: 'user@example.com',
    accessesLeft: 5,
    expiresIn: '2 horas',
  },
  {
    id: 2,
    name: 'relatorio_q3.pdf',
    sharedWith: 'friend@example.com',
    accessesLeft: 1,
    expiresIn: '1 dia',
  },
];

export const SharedItemsProvider = ({ children, activityLog, setActivityLog }) => {
  const [sharedItems, setSharedItems] = useState(mockActiveShares);

  const addSharedItem = (item) => {
    setSharedItems((prevItems) => [item, ...prevItems]);
  };

  const removeSharedItem = (itemId) => {
    setSharedItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const value = {
    sharedItems,
    addSharedItem,
    removeSharedItem,
    activityLog,
    setActivityLog,
  };

  return (
    <SharedItemsContext.Provider value={value}>
      {children}
    </SharedItemsContext.Provider>
  );
};
