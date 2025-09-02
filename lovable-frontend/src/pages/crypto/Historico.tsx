import React from "react";

// função segura com fallback
const formatCurrency = (value: number, fiat?: string) => {
  if (!fiat) {
    console.warn("formatCurrency chamado sem fiat em Historico.tsx", { value, fiat });
    return value.toFixed(2);
  }
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: fiat.toUpperCase() }).format(value);
  } catch (e) {
    console.warn("Erro em formatCurrency Historico, fallback usado", { value, fiat, e });
    return `${value.toFixed(2)} ${fiat.toUpperCase()}`;
  }
};

export default function Historico() {
  const investments = JSON.parse(localStorage.getItem("investments") || "[]");
  const portfolioCurrency = localStorage.getItem("portfolioCurrency") || "eur";

  // recuperar preços armazenados no cache local (keys prices:...)
  const priceCacheKeys = Object.keys(localStorage).filter(k => k.startsWith("prices:"));
  const priceMap = priceCacheKeys.reduce((acc: any, k: any) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(k) || "{}");
      if (parsed && parsed.data) Object.assign(acc, parsed.data);
    } catch (e) {
      console.warn("Erro ao ler cache prices em Historico", k, e);
    }
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Histórico de Compras</h2>
      {investments.length === 0 && <div>Nenhuma compra registrada.</div>}
      <div className="space-y-3">
        {investments.map((inv: any) => {
          const coinPrices = priceMap[inv.coinId] || {};
          const priceInPurchase = coinPrices[inv.purchaseCurrency] || inv.purchasePrice;
          const priceInPortfolio = coinPrices[portfolioCurrency] || inv.purchasePrice;
          const converted =
            priceInPurchase && priceInPortfolio
              ? inv.totalInvested * (priceInPortfolio / priceInPurchase)
              : inv.totalInvested;

          return (
            <div key={inv.id} className="flex flex-wrap justify-between border-b py-2 text-sm">
              <div className="w-1/6">{new Date(inv.purchaseDate).toLocaleDateString()}</div>
              <div className="w-2/6">{inv.name} ({inv.symbol})</div>
              <div className="w-1/6">{formatCurrency(inv.totalInvested, inv.purchaseCurrency)}</div>
              <div className="w-1/6">
                Preço: {inv.purchasePrice?.toFixed(2)} {inv.purchaseCurrency?.toUpperCase() || ""}
              </div>
              <div className="w-1/6">Qtd: {inv.quantity?.toFixed(8)}</div>
              <div className="w-full mt-1">
                Equiv. em {portfolioCurrency?.toUpperCase()}: {formatCurrency(converted, portfolioCurrency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}