import React from "react";
import ReactDOM from "react-dom/client";
import KryptaApp from "./App";
import { CryptoKeyProvider } from "./context/cryptoKeyContext";
import { SharedWithMeProvider } from "./context/SharedWithMeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CryptoKeyProvider>
      <SharedWithMeProvider>
        <KryptaApp />
      </SharedWithMeProvider>
    </CryptoKeyProvider>
  </React.StrictMode>
);
