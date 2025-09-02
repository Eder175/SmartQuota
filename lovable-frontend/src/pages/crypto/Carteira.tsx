import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Configurações
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos para reduzir requisições
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#DC143C", "#2E8B57"];
const API_BASE_URL = "/api/coingecko";
const TOP_COINS = [
  "bitcoin", "ethereum", "tether", "binancecoin", "solana", "ripple", "cardano",
  "dogecoin", "tron", "polkadot", "avalanche-2", "matic-network", "litecoin",
  "shiba-inu", "chainlink", "uniswap", "stellar", "bitcoin-cash", "internet-computer",
  "aptos", "hedera", "filecoin", "arbitrum", "vechain", "aave", "near", "optimism",
  "cosmos", "maker", "algorand", "elrond-erd-2", "quant-network", "flow", "the-graph",
  "immutable-x", "sui", "mina-protocol", "curve-dao-token", "kaspa",
];
const SUPPORTED_CURRENCIES = ["eur", "usd", "brl", "gbp"];

// Tipos de dados
type Investment = {
  id: string;
  coinId: string;
  name: string;
  symbol: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
  totalInvested: number;
  purchaseCurrency: string;
};

type Alert = {
  coinId: string;
  percentage: number;
  type: "rise" | "fall";
};

// Função para formatação de moeda
const formatCurrency = (value: number, currency: string): string => {
  if (typeof value !== "number" || isNaN(value)) return `0,00 ${currency.toUpperCase()}`;
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(value);
  } catch {
    return `${value.toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`;
  }
};

// Componente de Limite de Erro
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-800 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Ocorreu um erro. Tente recarregar a página.
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente principal da Carteira
export default function Carteira() {
  // Estados principais
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [fiats, setFiats] = useState<string[]>(SUPPORTED_CURRENCIES); // Fallback inicial
  const [portfolioCurrency, setPortfolioCurrency] = useState<string>("eur");
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Estados do formulário de investimento
  const [newInv, setNewInv] = useState({
    coinId: "",
    amount: "",
    price: "",
    date: new Date().toISOString().split("T")[0],
    currency: "eur",
  });

  // Estados do formulário de alerta
  const [newAlert, setNewAlert] = useState({ 
    coinId: "", 
    percentage: "", 
    type: "fall" 
  });

  // Estados de controle
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [requestCount, setRequestCount] = useState(0); // Contador de requisições
  const MAX_REQUESTS = 40; // Limite ajustado para evitar 429 (CoinGecko permite ~50/min)

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedInv = localStorage.getItem("crypto_investments");
      const savedCur = localStorage.getItem("portfolio_currency");
      const savedCoins = localStorage.getItem("crypto_coins_list");
      const savedFiats = localStorage.getItem("crypto_fiats_list");
      const savedAlerts = localStorage.getItem("crypto_alerts");

      if (savedInv) {
        setInvestments(JSON.parse(savedInv));
      }
      
      if (savedCur && SUPPORTED_CURRENCIES.includes(savedCur)) {
        setPortfolioCurrency(savedCur);
        setNewInv((prev) => ({ ...prev, currency: savedCur }));
      }
      
      if (savedCoins) {
        setCoins(JSON.parse(savedCoins));
      }
      
      if (savedFiats) {
        setFiats(JSON.parse(savedFiats));
      }
      
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }
    } catch (e) {
      console.error("Erro ao carregar do localStorage:", e);
      setError("Erro ao carregar dados salvos.");
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    try {
      if (investments.length > 0) {
        localStorage.setItem("crypto_investments", JSON.stringify(investments));
      }
      localStorage.setItem("portfolio_currency", portfolioCurrency);
      localStorage.setItem("crypto_alerts", JSON.stringify(alerts));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
      setError("Erro ao salvar dados.");
    }
  }, [investments, portfolioCurrency, alerts]);

  // 🔄 Carregar lista de moedas e fiats (com fallback + cache + controle de taxa)
  useEffect(() => {
    const loadCoinsAndFiats = async () => {
      const lastFetch = localStorage.getItem("last_fetch_time");

      // ✅ Usar cache se ainda está dentro do TTL (default 5 min)
      if (lastFetch && Date.now() - parseInt(lastFetch) < CACHE_TTL) {
        const cachedCoins = localStorage.getItem("crypto_coins_list");
        const cachedFiats = localStorage.getItem("crypto_fiats_list");

        if (cachedCoins) {
          setCoins(JSON.parse(cachedCoins));
        }
        if (cachedFiats) {
          setFiats(JSON.parse(cachedFiats));
        }
        return;
      }

      try {
        setRequestCount((prev) => prev + 1);

        // ✅ Uma única chamada em paralelo (Promise.all)
        const [coinsResponse, fiatsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/coins/list`),
          fetch(`${API_BASE_URL}/simple/supported_vs_currencies`)
        ]);

        if (!coinsResponse.ok || !fiatsResponse.ok) {
          throw new Error("Falha nas APIs");
        }

        const coinsJson = await coinsResponse.json();
        const fiatsJson = await fiatsResponse.json();

        // Filtra apenas as moedas que você definiu em TOP_COINS
        const filteredCoins = coinsJson.filter((coin: any) => TOP_COINS.includes(coin.id));

        setCoins(filteredCoins);
        setFiats(fiatsJson.filter((fiat: string) => SUPPORTED_CURRENCIES.includes(fiat)));

        // ✅ Salva em cache
        localStorage.setItem("crypto_coins_list", JSON.stringify(filteredCoins));
        localStorage.setItem("crypto_fiats_list", JSON.stringify(fiatsJson));
        localStorage.setItem("last_fetch_time", Date.now().toString());
      } catch (e) {
        console.error("Erro carregando moedas/fiats:", e);
        setError("Erro ao carregar dados do CoinGecko. Usando fallback.");
        
        // Fallback caso API falhe
        setCoins(TOP_COINS.map((id) => ({
          id, 
          name: id, 
          symbol: id === "bitcoin" ? "BTC" : id.slice(0, 3).toUpperCase()
        })));

        setFiats(SUPPORTED_CURRENCIES);
      }
    };

    if (coins.length === 0 || fiats.length === 0) {
      loadCoinsAndFiats();
    }
  }, [coins.length, fiats.length]);

  // ✅ Buscar preços com controle de taxa (precisa estar definido ANTES do useEffect que usa)
  const fetchPrices = useCallback(async () => {
    if (investments.length === 0 || requestCount >= MAX_REQUESTS) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const coinIds = [...new Set(investments.map((investment) => investment.coinId))];
    const currencies = [...new Set([portfolioCurrency, ...investments.map((investment) => investment.purchaseCurrency), "usd"])];
    
    try {
      setRequestCount((prev) => prev + 1);
      const url = `${API_BASE_URL}/simple/price?ids=${coinIds.join(",")}&vs_currencies=${currencies.join(",")}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setPrices(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erro ao buscar preços:", err);
      setError("Erro ao carregar preços. Usando preços em cache ou valores padrão.");
      
      // Fallback com preços zerados
      const defaultPrices = coinIds.reduce((acc, id) => {
        acc[id] = { [portfolioCurrency]: 0, usd: 0 };
        return acc;
      }, {} as Record<string, Record<string, number>>);
      
      setPrices((prev) => ({ ...prev, ...defaultPrices }));
    } finally {
      setLoading(false);
    }
  }, [investments, portfolioCurrency, requestCount]);

  // ✅ Agora o useEffect que chama fetchPrices funciona sem erros
  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(() => {
      if (requestCount < MAX_REQUESTS) {
        fetchPrices();
      }
    }, CACHE_TTL);
    
    return () => clearInterval(interval);
  }, [fetchPrices, requestCount]);

  // Funções de gerenciamento de investimentos
  
  // Adicionar ou editar investimento
  const handleSaveInvestment = () => {
    if (!newInv.coinId || !newInv.amount || !newInv.price || !newInv.date) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    
    const coin = coins.find((c: any) => c.id === newInv.coinId);
    if (!coin) {
      alert("Moeda não encontrada.");
      return;
    }
    
    const amount = parseFloat(newInv.amount.replace(",", "."));
    const price = parseFloat(newInv.price.replace(",", "."));
    
    if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
      alert("Valores devem ser maiores que zero.");
      return;
    }
    
    const quantity = amount / price;
    
    const investment: Investment = {
      id: editingId || Date.now().toString(),
      coinId: newInv.coinId,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      purchasePrice: price,
      quantity,
      purchaseDate: newInv.date,
      totalInvested: amount,
      purchaseCurrency: newInv.currency,
    };
    
    if (editingId) {
      setInvestments((prev) => prev.map((i) => (i.id === editingId ? investment : i)));
      setEditingId(null);
    } else {
      setInvestments((prev) => [...prev, investment]);
    }
    
    // Limpar formulário
    setNewInv({
      coinId: "",
      amount: "",
      price: "",
      date: new Date().toISOString().split("T")[0],
      currency: portfolioCurrency,
    });
  };

  // Editar investimento existente
  const handleEditInvestment = (investment: Investment) => {
    setEditingId(investment.id);
    setNewInv({
      coinId: investment.coinId,
      amount: investment.totalInvested.toString().replace(".", ","),
      price: investment.purchasePrice.toString().replace(".", ","),
      date: investment.purchaseDate,
      currency: investment.purchaseCurrency,
    });
  };

  // Excluir investimento
  const handleDeleteInvestment = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este investimento?")) {
      setInvestments((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewInv({
      coinId: "",
      amount: "",
      price: "",
      date: new Date().toISOString().split("T")[0],
      currency: portfolioCurrency,
    });
  };

  // Funções de gerenciamento de alertas
  
  // Adicionar alerta
  const handleAddAlert = () => {
    if (!newAlert.coinId || !newAlert.percentage) {
      alert("Preencha todos os campos do alerta.");
      return;
    }
    
    const percentage = parseFloat(newAlert.percentage.replace(",", "."));
    if (isNaN(percentage) || percentage <= 0) {
      alert("Porcentagem deve ser um número positivo.");
      return;
    }
    
    setAlerts((prev) => [...prev, { 
      coinId: newAlert.coinId, 
      percentage, 
      type: newAlert.type as "rise" | "fall" 
    }]);
    
    setNewAlert({ coinId: "", percentage: "", type: "fall" });
  };

  // Remover alerta
  const handleRemoveAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  // Agrupar investimentos por moeda
  const groupedInvestments = Object.values(
    investments.reduce((acc: Record<string, any>, investment: Investment) => {
      const key = investment.coinId;
      if (!acc[key]) {
        acc[key] = {
          coinId: investment.coinId,
          symbol: investment.symbol,
          name: investment.name,
          purchaseCurrency: investment.purchaseCurrency,
          investments: [],
          totalQuantity: 0,
          totalInvested: 0,
        };
      }
      acc[key].investments.push(investment);
      acc[key].totalQuantity += investment.quantity;
      acc[key].totalInvested += investment.purchaseCurrency.toLowerCase() === portfolioCurrency.toLowerCase() 
        ? investment.totalInvested 
        : 0;
      return acc;
    }, {})
  );

  // Calcular métricas finais para cada grupo
  const finalGroupedData = groupedInvestments.map((group: any) => {
    let totalInvestedInBaseCurrency = 0;
    
    // Calcular total investido na moeda base do portfólio
    group.investments.forEach((investment: Investment) => {
      const coinPrices = prices[investment.coinId] || {};
      const priceInPurchaseCurrency = coinPrices[investment.purchaseCurrency.toLowerCase()] || 0;
      const priceInPortfolioCurrency = coinPrices[portfolioCurrency.toLowerCase()] || 0;
      
      if (investment.purchaseCurrency.toLowerCase() === portfolioCurrency.toLowerCase()) {
        totalInvestedInBaseCurrency += investment.totalInvested;
      } else if (priceInPurchaseCurrency > 0 && priceInPortfolioCurrency > 0) {
        totalInvestedInBaseCurrency += investment.totalInvested * (priceInPortfolioCurrency / priceInPurchaseCurrency);
      } else {
        totalInvestedInBaseCurrency += investment.totalInvested; // Fallback conservador
      }
    });
    
    const currentPrice = prices[group.coinId]?.[portfolioCurrency.toLowerCase()] || 0;
    const currentValue = group.totalQuantity * currentPrice;
    const averagePriceInBaseCurrency = group.totalQuantity > 0 ? totalInvestedInBaseCurrency / group.totalQuantity : 0;
    const profit = currentValue - totalInvestedInBaseCurrency;
    const profitPercentage = totalInvestedInBaseCurrency > 0 ? (profit / totalInvestedInBaseCurrency) * 100 : 0;
    
    return { 
      ...group, 
      totalInvestedInBaseCurrency, 
      averagePriceInBaseCurrency, 
      currentPrice, 
      currentValue, 
      profit, 
      profitPercentage 
    };
  });

  // Calcular totais do portfólio
  const totalInvestedInPortfolio = finalGroupedData.reduce((sum, group) => sum + (group.totalInvestedInBaseCurrency || 0), 0);
  const totalCurrentValueInPortfolio = finalGroupedData.reduce((sum, group) => sum + (group.currentValue || 0), 0);
  const totalProfitInPortfolio = totalCurrentValueInPortfolio - totalInvestedInPortfolio;
  const totalProfitPercentageInPortfolio = totalInvestedInPortfolio > 0 ? (totalProfitInPortfolio / totalInvestedInPortfolio) * 100 : 0;

  // Funções de exportação
  
  // Exportar para Excel
  const exportToExcel = () => {
    const data = investments.map((investment) => ({
      Moeda: investment.name,
      Símbolo: investment.symbol,
      Data: new Date(investment.purchaseDate).toLocaleDateString("pt-BR"),
      "Valor Investido": investment.totalInvested,
      "Preço de Compra": investment.purchasePrice,
      Quantidade: investment.quantity,
      "Moeda de Compra": investment.purchaseCurrency.toUpperCase(),
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investimentos");
    XLSX.writeFile(workbook, "carteira-crypto.xlsx");
  };

  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório da Carteira de Criptomoedas", 10, 10);
    
    const tableBody = finalGroupedData.map((group: any) => [
      group.name,
      group.symbol,
      group.totalQuantity.toFixed(8),
      formatCurrency(group.totalInvestedInBaseCurrency, portfolioCurrency),
      formatCurrency(group.currentValue, portfolioCurrency),
      `${group.profitPercentage.toFixed(2)}%`,
    ]);
    
    autoTable(doc, {
      head: [
        ["Moeda", "Símbolo", "Quantidade", `Investido (${portfolioCurrency.toUpperCase()})`, `Atual (${portfolioCurrency.toUpperCase()})`, "Rentabilidade"],
      ],
      body: tableBody,
      startY: 20,
    });
    
    doc.save("carteira-crypto.pdf");
  };

  // Painel de Inteligência (RSI simulado)
  const getIntelligenceData = () => {
    return finalGroupedData.map((group) => {
      const price = prices[group.coinId]?.[portfolioCurrency.toLowerCase()] || 0;
      const rsi = Math.random() * (70 - 30) + 30; // Simulação de RSI
      let status = "Neutro";
      if (rsi > 70) status = "Venda possível";
      else if (rsi < 30) status = "Compra possível";
      
      return {
        coinId: group.coinId,
        name: group.name,
        price,
        rsi: rsi.toFixed(2),
        status,
      };
    });
  };

  // Verificar alertas
  const checkAlerts = () => {
    const triggeredAlerts: string[] = [];
    
    alerts.forEach((alert) => {
      const currentPrice = prices[alert.coinId]?.[portfolioCurrency.toLowerCase()] || 0;
      const investment = investments.find(inv => inv.coinId === alert.coinId);
      
      if (investment && currentPrice > 0) {
        const priceChange = ((currentPrice - investment.purchasePrice) / investment.purchasePrice) * 100;
        
        if (alert.type === "rise" && priceChange >= alert.percentage) {
          triggeredAlerts.push(`${investment.name} subiu ${priceChange.toFixed(2)}%`);
        } else if (alert.type === "fall" && priceChange <= -alert.percentage) {
          triggeredAlerts.push(`${investment.name} caiu ${Math.abs(priceChange).toFixed(2)}%`);
        }
      }
    });
    
    return triggeredAlerts;
  };

  const triggeredAlerts = checkAlerts();

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        {/* Mensagens de erro e carregamento */}
        {error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : null}
        
        {loading ? (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Carregando preços...
          </div>
        ) : null}

        {/* Alertas disparados */}
        {triggeredAlerts.length > 0 ? (
          <div className="p-4 bg-blue-100 text-blue-800 rounded">
            <p className="font-semibold">Alertas Disparados:</p>
            {triggeredAlerts.map((alert, index) => (
              <p key={`alert-${index}`} className="text-sm">{alert}</p>
            ))}
          </div>
        ) : null}

        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Carteira de Criptomoedas</h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={fetchPrices} 
              disabled={loading || requestCount >= MAX_REQUESTS} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {lastUpdate ? (
              <span className="text-sm text-muted-foreground">
                Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
              </span>
            ) : null}
          </div>
        </div>

        {/* Configurações e Exportação */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium">Moeda do Portfólio:</label>
              <Select value={portfolioCurrency} onValueChange={setPortfolioCurrency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fiats.map((fiat) => (
                    <SelectItem key={`fiat-${fiat}`} value={fiat}>
                      {fiat.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button onClick={exportToExcel} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={exportToPDF} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo do portfólio */}
        {investments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Investido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalInvestedInPortfolio, portfolioCurrency)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Valor Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {isNaN(totalCurrentValueInPortfolio) 
                    ? "Indisponível" 
                    : formatCurrency(totalCurrentValueInPortfolio, portfolioCurrency)
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lucro/Prejuízo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${
                  isNaN(totalProfitInPortfolio) 
                    ? "text-gray-600" 
                    : totalProfitInPortfolio >= 0 
                      ? "text-green-600" 
                      : "text-red-600"
                }`}>
                  {isNaN(totalProfitInPortfolio) 
                    ? "N/A" 
                    : formatCurrency(totalProfitInPortfolio, portfolioCurrency)
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rentabilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${
                  isNaN(totalProfitPercentageInPortfolio) 
                    ? "text-gray-600" 
                    : totalProfitPercentageInPortfolio >= 0 
                      ? "text-green-600" 
                      : "text-red-600"
                }`}>
                  {isNaN(totalProfitPercentageInPortfolio) 
                    ? "N/A" 
                    : `${totalProfitPercentageInPortfolio.toFixed(2)}%`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Gráfico de distribuição */}
        {finalGroupedData.length > 0 && finalGroupedData.some(group => group.currentValue > 0) ? (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição da Carteira</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={finalGroupedData
                        .filter((group: any) => group.currentValue > 0)
                        .map((group: any) => ({
                          name: group.symbol,
                          value: Number(group.currentValue.toFixed(2)),
                        }))
                      }
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      label={({ name, percent }) => {
                        if (typeof percent !== "number" || isNaN(percent)) return null;
                        return `${name} ${(percent * 100).toFixed(1)}%`;
                      }}
                    >
                      {finalGroupedData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value), portfolioCurrency)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Lista detalhada de investimentos por moeda */}
        {finalGroupedData.length > 0 ? (
          finalGroupedData.map((group: any) => (
            <Card key={`group-${group.coinId}`} className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {group.name} 
                      <Badge variant="secondary">{group.symbol}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Preço atual: {group.currentPrice === 0 
                        ? "Indisponível" 
                        : formatCurrency(group.currentPrice, portfolioCurrency)
                      } / {group.symbol}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Métricas do grupo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Total</p>
                    <p className="font-semibold">{group.totalQuantity.toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Médio</p>
                    <p className="font-semibold">
                      {formatCurrency(group.averagePriceInBaseCurrency, portfolioCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Investido</p>
                    <p className="font-semibold">
                      {formatCurrency(group.totalInvestedInBaseCurrency, portfolioCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Atual</p>
                    <p className="font-semibold">
                      {group.currentPrice === 0 
                        ? "Indisponível" 
                        : formatCurrency(group.currentValue, portfolioCurrency)
                      }
                    </p>
                  </div>
                </div>

                {/* Indicador de lucro/prejuízo */}
                <div className={`text-center p-3 rounded-lg ${
                  isNaN(group.profit) 
                    ? "bg-gray-50 text-gray-700" 
                    : group.profit >= 0 
                      ? "bg-green-50 text-green-700" 
                      : "bg-red-50 text-red-700"
                }`}>
                  <p className="font-bold">
                    {isNaN(group.profitPercentage) 
                      ? "N/A" 
                      : `${group.profitPercentage.toFixed(2)}%`
                    } (
                    {isNaN(group.profit) 
                      ? "N/A" 
                      : formatCurrency(group.profit, portfolioCurrency)
                    })
                  </p>
                </div>

                {/* Histórico de compras */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Histórico de Compras</h4>
                  {group.investments.map((investment: Investment) => (
                    <div key={`investment-${investment.id}`} className="flex justify-between items-center p-3 border rounded-lg mb-2">
                      <div className="grid grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="text-sm text-muted-foreground">Data</p>
                          <p className="font-medium">
                            {new Date(investment.purchaseDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Investido</p>
                          <p className="font-medium">
                            {formatCurrency(investment.totalInvested, investment.purchaseCurrency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Preço</p>
                          <p className="font-medium">
                            {formatCurrency(investment.purchasePrice, investment.purchaseCurrency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
                          <p className="font-medium">{investment.quantity.toFixed(8)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          onClick={() => handleEditInvestment(investment)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteInvestment(investment.id)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}

        {/* Formulário de investimento */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "✏️ Editar Investimento" : "➕ Adicionar Investimento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Criptomoeda *</label>
                <Select 
                  value={newInv.coinId} 
                  onValueChange={(value) => setNewInv({ ...newInv, coinId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma criptomoeda" />
                  </SelectTrigger>
                  <SelectContent>
                    {coins.map((coin: any) => (
                      <SelectItem key={`coin-${coin.id}`} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Moeda de Compra *</label>
                <Select 
                  value={newInv.currency} 
                  onValueChange={(value) => setNewInv({ ...newInv, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fiats.map((fiat) => (
                      <SelectItem key={`currency-${fiat}`} value={fiat}>
                        {fiat.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Valor Investido *</label>
                <Input
                  type="text"
                  placeholder="100,00"
                  value={newInv.amount}
                  onChange={(e) => setNewInv({ ...newInv, amount: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Preço Unitário *</label>
                <Input
                  type="text"
                  placeholder="50000,00"
                  value={newInv.price}
                  onChange={(e) => setNewInv({ ...newInv, price: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Data da Compra *</label>
                <Input
                  type="date"
                  value={newInv.date}
                  onChange={(e) => setNewInv({ ...newInv, date: e.target.value })}
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Button onClick={handleSaveInvestment} className="flex-1">
                  {editingId ? "Salvar Alterações" : "Adicionar"}
                </Button>
                {editingId ? (
                  <Button onClick={handleCancelEdit} variant="outline">
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>🔔 Gerenciar Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium">Criptomoeda</label>
                <Select 
                  value={newAlert.coinId} 
                  onValueChange={(value) => setNewAlert({ ...newAlert, coinId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    {coins.map((coin: any) => (
                      <SelectItem key={`alert-coin-${coin.id}`} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Porcentagem</label>
                <Input
                  type="text"
                  placeholder="10"
                  value={newAlert.percentage}
                  onChange={(e) => setNewAlert({ ...newAlert, percentage: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select 
                  value={newAlert.type} 
                  onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rise">Subida</SelectItem>
                    <SelectItem value="fall">Queda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleAddAlert} className="w-full">
                  Adicionar Alerta
                </Button>
              </div>
            </div>

            {/* Lista de alertas ativos */}
            {alerts.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-2">Alertas Ativos</h4>
                {alerts.map((alert, index) => {
                  const coin = coins.find(c => c.id === alert.coinId);
                  return (
                    <div key={`active-alert-${index}`} className="flex justify-between items-center p-3 border rounded-lg mb-2">
                      <div>
                        <p className="font-medium">
                          {coin ? coin.name : alert.coinId} - {alert.type === "rise" ? "Subida" : "Queda"} de {alert.percentage}%
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleRemoveAlert(index)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Painel de Inteligência */}
        <Card>
          <CardHeader>
            <CardTitle>🧠 Painel de Inteligência</CardTitle>
          </CardHeader>
          <CardContent>
            {getIntelligenceData().length > 0 ? (
              getIntelligenceData().map((data) => (
                <div key={`intelligence-${data.coinId}`} className="p-3 border rounded-lg mb-2">
                  <p className="font-medium">
                    {data.name} — Preço atual ({portfolioCurrency.toUpperCase()}): {formatCurrency(data.price, portfolioCurrency)} — RSI: {data.rsi} — {data.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                Adicione investimentos para ver análises inteligentes.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mensagem de carteira vazia */}
        {investments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Sua carteira está vazia. Adicione seu primeiro investimento acima!
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </ErrorBoundary>
  );
}