import React from "react";
import ReactDOM from "react-dom/client";
import KryptaApp from "./App";
import { CryptoKeyProvider } from "./context/cryptoKeyContext";

ReactDOM.createRoot(document.getElementById("root")).render(    
  <React.StrictMode>
    <CryptoKeyProvider>
      <KryptaApp />
    </CryptoKeyProvider>
  </React.StrictMode>,
  
);
