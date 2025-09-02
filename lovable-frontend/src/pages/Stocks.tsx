import { useState } from "react"
import Navbar from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, Plus, Calculator, Trash2, FileText } from "lucide-react"

interface StockInvestment {
  id: string
  name: string
  symbol: string
  purchasePrice: number
  currentPrice: number
  shares: number
  purchaseDate: string
  totalInvested: number
}

const Stocks = () => {
  const [investments, setInvestments] = useState<StockInvestment[]>([])

  const [newInvestment, setNewInvestment] = useState({
    name: "",
    symbol: "",
    shares: "",
    price: "",
    date: ""
  })

  // 🔹 Agrupamento por símbolo
  const groupedInvestments = investments.reduce((acc, inv) => {
    const key = inv.symbol
    if (!acc[key]) {
      acc[key] = {
        name: inv.name,
        symbol: inv.symbol,
        totalShares: 0,
        totalInvested: 0,
        currentPrice: inv.currentPrice,
        investments: []
      }
    }
    acc[key].totalShares += inv.shares
    acc[key].totalInvested += inv.totalInvested
    acc[key].currentPrice = inv.currentPrice
    acc[key].investments.push(inv)
    return acc
  }, {} as Record<string, {
    name: string
    symbol: string
    totalShares: number
    totalInvested: number
    currentPrice: number
    investments: StockInvestment[]
  }>)

  // 🔹 Preço médio ponderado
  const calculateAveragePrice = (grouped: any) => {
    if (grouped.totalShares === 0) return 0
    const totalCost = grouped.investments.reduce(
      (sum: number, inv: StockInvestment) => sum + inv.purchasePrice * inv.shares,
      0
    )
    return totalCost / grouped.totalShares
  }

  const calculateProfitLoss = (grouped: any) => {
    const currentValue = grouped.totalShares * grouped.currentPrice
    return currentValue - grouped.totalInvested
  }

  const calculateProfitLossPercentage = (grouped: any) => {
    const profitLoss = calculateProfitLoss(grouped)
    return (profitLoss / grouped.totalInvested) * 100
  }

  // 🔹 Adicionar nova compra
  const addInvestment = () => {
    if (!newInvestment.name || !newInvestment.shares || !newInvestment.price) return

    const shares = parseFloat(newInvestment.shares)
    const price = parseFloat(newInvestment.price)
    const totalInvested = shares * price

    const investment: StockInvestment = {
      id: crypto.randomUUID(),
      name: newInvestment.name,
      symbol: newInvestment.symbol.toUpperCase(),
      purchasePrice: price,
      currentPrice: price, // futuramente puxamos de API
      shares,
      purchaseDate: newInvestment.date || new Date().toISOString().split("T")[0],
      totalInvested
    }

    setInvestments([...investments, investment])
    setNewInvestment({ name: "", symbol: "", shares: "", price: "", date: "" })
  }

  // 🔹 Remover compra individual
  const deleteInvestment = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id))
  }

  // 🔹 Exportar relatório
  const exportReport = () => {
    const data = JSON.stringify(investments, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stocks-report.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  // 🔹 Totais do portfólio
  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0)
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.shares * inv.currentPrice), 0)
  const totalProfitLoss = totalCurrentValue - totalInvested
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-primary" />
              Carteira de Ações
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas ações com cálculo de preço médio e análise de performance
            </p>
          </div>
          {investments.length > 0 && (
            <Button variant="outline" onClick={exportReport}>
              <FileText className="w-4 h-4 mr-2" /> Exportar Relatório
            </Button>
          )}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Investido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalInvested.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalCurrentValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lucro/Prejuízo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? "text-success" : "text-danger"}`}>
                €{totalProfitLoss.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-card to-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rentabilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center ${totalProfitLossPercentage >= 0 ? "text-success" : "text-danger"}`}>
                {totalProfitLossPercentage >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                {totalProfitLossPercentage.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-primary" />
                  Suas Ações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.values(groupedInvestments).map((grouped) => {
                  const profitLoss = calculateProfitLoss(grouped)
                  const profitLossPercentage = calculateProfitLossPercentage(grouped)
                  const averagePrice = calculateAveragePrice(grouped)

                  return (
                    <div key={grouped.symbol} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center">
                            {grouped.name}
                            <Badge variant="secondary" className="ml-2">{grouped.symbol}</Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {grouped.investments.length} compra(s) registrada(s)
                          </p>
                        </div>
                        <div className={`text-right ${profitLoss >= 0 ? "text-success" : "text-danger"}`}>
                          <div className="font-semibold flex items-center">
                            {profitLoss >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {profitLossPercentage.toFixed(2)}%
                          </div>
                          <div className="text-sm">€{profitLoss.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Quantidade</p>
                          <p className="font-medium">{grouped.totalShares.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Preço Médio</p>
                          <p className="font-medium">€{averagePrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Preço Atual</p>
                          <p className="font-medium">€{grouped.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Investido</p>
                          <p className="font-medium">€{grouped.totalInvested.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Compras individuais */}
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground mb-2">Compras individuais:</p>
                        <div className="space-y-2">
                          {grouped.investments.map((inv) => (
                            <div key={inv.id} className="flex justify-between items-center text-xs bg-background/50 p-2 rounded">
                              <span>{new Date(inv.purchaseDate).toLocaleDateString("pt-BR")}</span>
                              <span>€{inv.totalInvested.toFixed(2)}</span>
                              <span>{inv.shares} ações</span>
                              <Button 
                                variant="ghost" size="sm"
                                onClick={() => deleteInvestment(inv.id)}
                                className="h-6 w-6 p-0 text-danger hover:bg-danger/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {Object.keys(groupedInvestments).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma ação cadastrada ainda.</p>
                    <p className="text-sm">Adicione sua primeira ação para começar!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulário */}
          <div>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-primary" />
                  Adicionar Ação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stock-name">Nome da Empresa</Label>
                  <Input
                    id="stock-name" placeholder="Ex: Apple Inc."
                    value={newInvestment.name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="stock-symbol">Símbolo</Label>
                  <Input
                    id="stock-symbol" placeholder="Ex: AAPL"
                    value={newInvestment.symbol}
                    onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="shares-amount">Quantidade de Ações</Label>
                  <Input
                    id="shares-amount" type="number" placeholder="10"
                    value={newInvestment.shares}
                    onChange={(e) => setNewInvestment({ ...newInvestment, shares: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="stock-price">Preço por Ação (€)</Label>
                  <Input
                    id="stock-price" type="number" placeholder="150.00"
                    value={newInvestment.price}
                    onChange={(e) => setNewInvestment({ ...newInvestment, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="purchase-date">Data da Compra</Label>
                  <Input
                    id="purchase-date" type="date"
                    value={newInvestment.date}
                    onChange={(e) => setNewInvestment({ ...newInvestment, date: e.target.value })}
                  />
                </div>

                <Button onClick={addInvestment} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Adicionar Ação
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stocks