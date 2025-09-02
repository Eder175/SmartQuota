import React, { useEffect, useState } from "react";

function sma(values: number[], period: number) {
  if (!values || values.length < period) return null;
  const arr: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    arr.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return arr;
}

function calcRSI(values: number[], period = 14) {
  if (!values || values.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const rs = losses === 0 ? gains : gains / losses;
  return 100 - (100 / (1 + rs));
}

export default function Inteligencia() {
  const [signals, setSignals] = useState<any[]>([]);
  const investments = JSON.parse(localStorage.getItem("investments") || "[]");
  const coinIds = [...new Set(investments.map((i: any) => i.coinId))];

  useEffect(() => {
    if (!coinIds.length) return;
    (async () => {
      const temp: any[] = [];
      for (const id of coinIds) {
        try {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=90`
          );
          if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
          const json = await res.json();

          const prices = (json.prices || []).map((p: any) => p[1]).filter((v: any) => typeof v === "number");
          if (!prices.length) {
            console.warn("Sem dados de preços para", id);
            continue;
          }

          const sma7 = sma(prices, 7);
          const sma25 = sma(prices, 25);
          const latestSma7 = sma7 ? sma7[sma7.length - 1] : null;
          const latestSma25 = sma25 ? sma25[sma25.length - 1] : null;
          const latest = prices[prices.length - 1] ?? null;
          const rsi = calcRSI(prices, 14);

          let suggestion = "Neutro";
          if (latestSma7 && latestSma25) {
            if (latestSma7 > latestSma25 && rsi && rsi < 60) suggestion = "Possível Compra";
            if (latestSma7 < latestSma25 && rsi && rsi > 40) suggestion = "Possível Venda";
          } else {
            if (rsi !== null) {
              if (rsi < 30) suggestion = "Sobrevenda - Comprar";
              else if (rsi > 70) suggestion = "Sobrecompra - Vender";
            }
          }

          temp.push({ id, latest, sma7: latestSma7, sma25: latestSma25, rsi, suggestion });
        } catch (e) {
          console.warn("Erro inteligência", id, e);
        }
      }
      setSignals(temp);
    })();
  }, [coinIds]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Painel de Inteligência</h2>
      {signals.length === 0 ? (
        <div>Nenhum dado de inteligência ainda. Adicione moedas à carteira.</div>
      ) : (
        signals.map((s) => (
          <div key={s.id} className="border-b py-2">
            <p>
              <b>{s.id}</b> — Preço atual (USD): {s.latest ? s.latest.toFixed(2) : "N/A"} — RSI:{" "}
              {s.rsi !== null ? s.rsi.toFixed(2) : "N/A"} — {s.suggestion}
            </p>
          </div>
        ))
      )}
    </div>
  );
}