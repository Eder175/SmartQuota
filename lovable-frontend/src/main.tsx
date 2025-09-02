import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Patch para evitar erros de removeChild por extensões (ex.: Google Translate)
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (node) {
  if (node.parentNode !== this) {
    console.warn("Tentativa de remover nó inválido ignorada. Verifique extensões ou Service Worker.", node);
    return node;
  }
  return originalRemoveChild.apply(this, arguments);
};

// Verificação do elemento root
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado!");
}

// Renderização do app
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 🔥 Registro do Service Worker desativado temporariamente para depuração
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then((reg) => {
//         console.log("✅ Service Worker registrado com sucesso:", reg.scope);
//       })
//       .catch((err) => {
//         console.error("❌ Falha ao registrar o Service Worker:", err);
//       });
//   });
// }