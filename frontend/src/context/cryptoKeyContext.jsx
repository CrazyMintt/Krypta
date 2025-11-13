import { createContext, useContext, useState } from "react";

const CryptoKeyContext = createContext(null);

export function CryptoKeyProvider({ children }) {
  const [cryptoKey, setCryptoKey] = useState(null);
  return (
    <CryptoKeyContext.Provider value={{ cryptoKey, setCryptoKey }}>
      {children}
    </CryptoKeyContext.Provider>
  );
}

export function useCryptoKey() {
  return useContext(CryptoKeyContext);
}