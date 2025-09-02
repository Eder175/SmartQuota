import React, { useEffect, useState } from "react";

type Alert = {
  id: string;
  coinId: string;
  type: "percent" | "price";
  direction: "up" | "down";
  value: number;
  active: boolean;
};

export default function Alertas() {
  // state inicial com fallback seguro
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("alerts") || "[]");
    } catch (e) {
      console.warn("Erro ao carregar alerts do localStorage", e);
      return [];
    }
  });
  const [newAlert, setNewAlert] = useState<any>({
    coinId: "",
    type: "percent",
    direction: "down",
    value: 0,
  });

  // persistência segura
  useEffect(() => {
    try {
      localStorage.setItem("alerts", JSON.stringify(alerts));
    } catch (e) {
      console.error("Erro ao salvar alerts no localStorage", e);
    }
  }, [alerts]);

  // checar alertas a cada 60s
  useEffect(() => {
    const t = setInterval(async () => {
      if (alerts.length === 0) return;

      const coinIds = [...new Set(alerts.map((a) => a.coinId).filter(Boolean))];
      if (coinIds.length === 0) return;

      const vs = (localStorage.getItem("portfolioCurrency") || "eur").toLowerCase();

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=${vs}`
        );
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        const data = await res.json();

        for (const al of alerts) {
          if (!al.active) continue;
          const price = data?.[al.coinId]?.[vs];
          if (!price) continue;

          if (al.type === "price") {
            if (al.direction === "up" && price >= al.value) {
              window.alert(`📈 Alerta ${al.coinId}: preço >= ${al.value} ${vs.toUpperCase()}`);
            }
            if (al.direction === "down" && price <= al.value) {
              window.alert(`📉 Alerta ${al.coinId}: preço <= ${al.value} ${vs.toUpperCase()}`);
            }
          } else {
            // buscar referência no localStorage
            let investments: any[] = [];
            try {
              investments = JSON.parse(localStorage.getItem("investments") || "[]");
            } catch (e) {
              console.warn("Erro ao ler investments p/ alerta", e);
            }
            const inv = investments.find((i: any) => i.coinId === al.coinId);
            if (!inv || !inv.purchasePrice) continue;

            const refPrice = inv.purchasePrice;
            const pct = ((price - refPrice) / refPrice) * 100;

            if (al.direction === "up" && pct >= al.value) {
              window.alert(`📈 Alerta ${al.coinId}: subiu ${pct.toFixed(2)}%`);
            }
            if (al.direction === "down" && pct <= -Math.abs(al.value)) {
              window.alert(`📉 Alerta ${al.coinId}: caiu ${pct.toFixed(2)}%`);
            }
          }
        }
      } catch (e) {
        console.error("Erro ao checar alertas", e);
      }
    }, 60_000);

    return () => clearInterval(t);
  }, [alerts]);

  // adicionar alerta
  function addAlert() {
    if (!newAlert.coinId || !newAlert.value) {
      console.warn("Tentativa de adicionar alerta inválido", newAlert);
      return;
    }
    setAlerts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        coinId: newAlert.coinId.toLowerCase(), // normalizado
        type: newAlert.type,
        direction: newAlert.direction,
        value: Number(newAlert.value),
        active: true,
      },
    ]);
    setNewAlert({ coinId: "", type: "percent", direction: "down", value: 0 });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Alertas</h2>

      {/* Criar novo alerta */}
      <div className="mb-4 flex gap-2 items-center flex-wrap">
        <input
          placeholder="coinId (ex: bitcoin)"
          value={newAlert.coinId}
          onChange={(e) => setNewAlert({ ...newAlert, coinId: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <select
          value={newAlert.type}
          onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
        >
          <option value="percent">Percentual</option>
          <option value="price">Preço</option>
        </select>
        <select
          value={newAlert.direction}
          onChange={(e) => setNewAlert({ ...newAlert, direction: e.target.value })}
        >
          <option value="down">Queda</option>
          <option value="up">Alta</option>
        </select>
        <input
          type="number"
          value={newAlert.value}
          onChange={(e) =>
            setNewAlert({ ...newAlert, value: Number(e.target.value) })
          }
          className="border rounded px-2 py-1 w-24"
        />
        <button
          onClick={addAlert}
          className="px-3 py-1 bg-primary text-white rounded"
        >
          Adicionar
        </button>
      </div>

      {/* Lista de alertas */}
      <div>
        {alerts.length === 0 && <div>Nenhum alerta configurado.</div>}
        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex justify-between items-center border-b py-2 text-sm"
          >
            <div>
              {a.coinId} — {a.type} {a.direction} {a.value}
              {" "}— {a.active ? "✅ Ativo" : "⏸️ Inativo"}
            </div>
            <div>
              <button
                onClick={() =>
                  setAlerts((prev) =>
                    prev.map((x) =>
                      x.id === a.id ? { ...x, active: !x.active } : x
                    )
                  )
                }
                className="mr-2 px-2 py-1 bg-gray-200 rounded"
              >
                {a.active ? "Desativar" : "Ativar"}
              </button>
              <button
                onClick={() =>
                  setAlerts((prev) => prev.filter((x) => x.id !== a.id))
                }
                className="px-2 py-1 bg-red-200 rounded"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}