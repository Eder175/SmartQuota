import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CryptoInvestment {
  id: string;
  name: string;
  symbol: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
  totalInvested: number;
}

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#DC143C", "#2E8B57"];

const Crypto = () => {
  const [investments, setInvestments] = useState<CryptoInvestment[]>(() => {
    const saved = localStorage.getItem("investments");
    return saved ? JSON.parse(saved) : [];
  });
  const [currency, setCurrency] = useState("eur");
  const [coinList, setCoinList] = useState<CoinGeckoCoin[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
  const [newInvestment, setNewInvestment] = useState({
    name: "",
    symbol: "",
    amount: "",
    price: "",
    date: ""
  });

  const currencies = {
    eur: { symbol: "€", name: "Euro" },
    usd: { symbol: "$", name: "Dólar" },
    brl: { symbol: "R$", name: "Real" },
    gbp: { symbol: "£", name: "Libra" }
  };

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("investments", JSON.stringify(investments));
  }, [investments]);

  // Buscar lista de moedas CoinGecko
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/coins/list")
      .then(res => res.json())
      .then((data: CoinGeckoCoin[]) => setCoinList(data))
      .catch(err => console.error("Erro ao buscar lista de moedas:", err));
  }, []);

  // Buscar preços atuais
  useEffect(() => {
    if (investments.length === 0) return;
    const ids = investments
      .map(inv => coinList.find(c => c.symbol.toLowerCase() === inv.symbol.toLowerCase())?.id)
      .filter(Boolean);
    if (ids.length === 0) return;

    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=${currency}`)
      .then(res => res.json())
      .then(data => {
        const newPrices: Record<string, number> = {};
        ids.forEach(id => {
          const coin = coinList.find(c => c.id === id);
          if (coin && data[id]) {
            newPrices[coin.symbol.toUpperCase()] = data[id][currency];
          }
        });
        setPrices(newPrices);
      })
      .catch(err => console.error("Erro ao buscar preços:", err));
  }, [investments, currency, coinList]);

  // ➕ Adicionar investimento
  const addInvestment = () => {
    if (!newInvestment.name || !newInvestment.amount || !newInvestment.price) return;

    const amount = parseFloat(newInvestment.amount);
    const price = parseFloat(newInvestment.price);
    const quantity = amount / price;

    const investment: CryptoInvestment = {
      id: Date.now().toString(),
      name: newInvestment.name,
      symbol: newInvestment.symbol.toUpperCase(),
      purchasePrice: price,
      quantity,
      purchaseDate: newInvestment.date || new Date().toISOString().split("T")[0],
      totalInvested: amount
    };

    setInvestments([...investments, investment]);
    setNewInvestment({ name: "", symbol: "", amount: "", price: "", date: "" });
  };

  const deleteInvestment = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id));
  };

  // 📊 Agrupar investimentos por moeda
  const groupedInvestments = investments.reduce((acc, inv) => {
    const key = inv.symbol;
    if (!acc[key]) {
      acc[key] = {
        name: inv.name,
        symbol: inv.symbol,
        totalQuantity: 0,
        totalInvested: 0,
        investments: []
      };
    }
    acc[key].totalQuantity += inv.quantity;
    acc[key].totalInvested += inv.totalInvested;
    acc[key].investments.push(inv);
    return acc;
  }, {} as Record<string, {
    name: string;
    symbol: string;
    totalQuantity: number;
    totalInvested: number;
    investments: CryptoInvestment[];
  }>);

  // Totais gerais
  const totalInvested = investments.reduce((s, inv) => s + inv.totalInvested, 0);
  const totalCurrentValue = Object.values(groupedInvestments).reduce((s, g) => {
    const curPrice =
      manualPrices[g.symbol] ||
      prices[g.symbol.toUpperCase()] ||
      g.totalInvested / g.totalQuantity;
    return s + g.totalQuantity * curPrice;
  }, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // 📤 Exportar Excel
  const exportExcel = () => {
    const data = investments.map(inv => ({
      Moeda: inv.name,
      Símbolo: inv.symbol,
      Data: inv.purchaseDate,
      Investido: inv.totalInvested,
      PreçoCompra: inv.purchasePrice,
      Quantidade: inv.quantity
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Investimentos");
    XLSX.writeFile(wb, "investimentos.xlsx");
  };

  // 📤 Exportar PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Investimentos em Cripto", 10, 10);

    autoTable(doc, {
      head: [["Moeda", "Símbolo", "Investido", "Preço Médio", "Preço Atual", "Quantidade", "Valor Atual"]],
      body: Object.values(groupedInvestments).map(g => {
        const curPrice =
          manualPrices[g.symbol] ||
          prices[g.symbol.toUpperCase()] ||
          g.totalInvested / g.totalQuantity;
        const avgPrice = g.totalInvested / g.totalQuantity;
        const currentValue = g.totalQuantity * curPrice;
        return [
          g.name,
          g.symbol,
          g.totalInvested.toFixed(2),
          avgPrice.toFixed(2),
          curPrice.toFixed(2),
          g.totalQuantity.toFixed(8),
          currentValue.toFixed(2)
        ];
      })
    });

    doc.save("investimentos.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* Resumo global */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card><CardHeader><CardTitle>Total Investido</CardTitle></CardHeader>
            <CardContent>{currencies[currency as keyof typeof currencies].symbol}{totalInvested.toFixed(2)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Valor Atual</CardTitle></CardHeader>
            <CardContent>{currencies[currency as keyof typeof currencies].symbol}{totalCurrentValue.toFixed(2)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Lucro/Prejuízo</CardTitle></CardHeader>
            <CardContent className={totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}>
              {currencies[currency as keyof typeof currencies].symbol}{totalProfitLoss.toFixed(2)}
            </CardContent></Card>
          <Card><CardHeader><CardTitle>Rentabilidade</CardTitle></CardHeader>
            <CardContent className={totalProfitLossPercentage >= 0 ? "text-green-600" : "text-red-600"}>
              {totalProfitLossPercentage.toFixed(2)}%
            </CardContent></Card>
        </div>

        {/* Botões de exportação */}
        <div className="flex gap-4 mb-6">
          <Button onClick={exportExcel}>📊 Exportar Excel</Button>
          <Button onClick={exportPDF}>📄 Exportar PDF</Button>
        </div>

        {/* Gráfico de pizza */}
        <Card className="mb-8">
          <CardHeader><CardTitle>Distribuição da Carteira</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={Object.values(groupedInvestments).map(g => ({
                    name: g.symbol,
                    value: g.totalQuantity *
                      (manualPrices[g.symbol] || prices[g.symbol.toUpperCase()] || g.totalInvested / g.totalQuantity)
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label
                >
                  {Object.values(groupedInvestments).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Relatórios por moeda */}
        {Object.values(groupedInvestments).map(grouped => {
          const curPrice =
            manualPrices[grouped.symbol] ||
            prices[grouped.symbol.toUpperCase()] ||
            grouped.totalInvested / grouped.totalQuantity;

          const avgPrice = grouped.totalInvested / grouped.totalQuantity;
          const currentValue = grouped.totalQuantity * curPrice;
          const pl = currentValue - grouped.totalInvested;
          const plPct = (pl / grouped.totalInvested) * 100;

          return (
            <Card key={grouped.symbol} className="mb-6">
              <CardHeader>
                <CardTitle>{grouped.name} <Badge>{grouped.symbol}</Badge></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p>Quantidade</p><p>{grouped.totalQuantity.toFixed(8)}</p></div>
                  <div><p>Preço Médio</p><p>{currencies[currency as keyof typeof currencies].symbol}{avgPrice.toFixed(2)}</p></div>
                  <div><p>Preço Atual</p>
                    <Input
                      type="number"
                      value={manualPrices[grouped.symbol] || curPrice}
                      onChange={e => setManualPrices({...manualPrices, [grouped.symbol]: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div><p>Total Investido</p><p>{currencies[currency as keyof typeof currencies].symbol}{grouped.totalInvested.toFixed(2)}</p></div>
                </div>

                <div className={pl >= 0 ? "text-green-600" : "text-red-600"}>
                  {plPct.toFixed(2)}% ({currencies[currency as keyof typeof currencies].symbol}{pl.toFixed(2)})
                </div>

                <div className="mt-4">
                  <p className="font-bold">Histórico de compras:</p>
                  {grouped.investments.map(inv => (
                    <div key={inv.id} className="flex justify-between text-sm border-b py-1">
                      <span>{new Date(inv.purchaseDate).toLocaleDateString("pt-BR")}</span>
                      <span>{currencies[currency as keyof typeof currencies].symbol}{inv.totalInvested.toFixed(2)}</span>
                      <span>{inv.quantity.toFixed(8)}</span>
                      <Button size="sm" variant="ghost" onClick={() => deleteInvestment(inv.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Form de adicionar */}
        <Card>
          <CardHeader><CardTitle>➕ Adicionar Investimento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Nome (ex: Bitcoin)" value={newInvestment.name} onChange={e => setNewInvestment({...newInvestment, name: e.target.value})}/>
            <Input placeholder="Símbolo (ex: BTC)" value={newInvestment.symbol} onChange={e => setNewInvestment({...newInvestment, symbol: e.target.value})}/>
            <Input type="number" placeholder="Valor Investido (€)" value={newInvestment.amount} onChange={e => setNewInvestment({...newInvestment, amount: e.target.value})}/>
            <Input type="number" placeholder="Preço na Compra (€)" value={newInvestment.price} onChange={e => setNewInvestment({...newInvestment, price: e.target.value})}/>
            <Input type="date" value={newInvestment.date} onChange={e => setNewInvestment({...newInvestment, date: e.target.value})}/>
            <Button className="w-full" onClick={addInvestment}>Salvar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Crypto;