import React, { Suspense, lazy, useState } from "react";
import Navbar from "../../components/Navbar";

const Carteira = lazy(() => import("./Carteira"));
const Historico = lazy(() => import("./Historico"));
const Alertas = lazy(() => import("./Alertas"));
const Inteligencia = lazy(() => import("./Inteligencia"));

export default function CryptoIndex() {
  const [tab, setTab] = useState<"carteira" | "historico" | "alertas" | "inteligencia">("carteira");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-6 flex gap-2">
          <button onClick={() => setTab("carteira")} className={`px-4 py-2 rounded ${tab === "carteira" ? "bg-primary text-white" : "bg-muted/10"}`}>Carteira</button>
          <button onClick={() => setTab("historico")} className={`px-4 py-2 rounded ${tab === "historico" ? "bg-primary text-white" : "bg-muted/10"}`}>Histórico</button>
          <button onClick={() => setTab("alertas")} className={`px-4 py-2 rounded ${tab === "alertas" ? "bg-primary text-white" : "bg-muted/10"}`}>Alertas</button>
          <button onClick={() => setTab("inteligencia")} className={`px-4 py-2 rounded ${tab === "inteligencia" ? "bg-primary text-white" : "bg-muted/10"}`}>Inteligência</button>
        </nav>

        <Suspense fallback={<div>Carregando...</div>}>
          {tab === "carteira" && <Carteira />}
          {tab === "historico" && <Historico />}
          {tab === "alertas" && <Alertas />}
          {tab === "inteligencia" && <Inteligencia />}
        </Suspense>
      </div>
    </div>
  );
}
