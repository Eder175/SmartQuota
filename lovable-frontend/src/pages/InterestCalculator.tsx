import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, Percent } from "lucide-react";

const InterestCalculator = () => {
  const [simpleInterest, setSimpleInterest] = useState({
    initialAmount: "100",
    monthlyContribution: "100",
    rate: "10",
    months: "12"
  });

  const [compoundInterest, setCompoundInterest] = useState({
    initialAmount: "100",
    monthlyContribution: "100", 
    rate: "10",
    months: "12"
  });

  const calculateSimpleInterest = () => {
    const initial = parseFloat(simpleInterest.initialAmount) || 0;
    const monthly = parseFloat(simpleInterest.monthlyContribution) || 0;
    const rate = parseFloat(simpleInterest.rate) || 0;
    const months = parseInt(simpleInterest.months) || 1;

    let totalInvested = initial;
    let totalWithInterest = initial;

    for (let i = 0; i < months; i++) {
      if (i > 0) {
        totalInvested += monthly;
      }
      // Juros simples: apenas sobre o valor inicial
      totalWithInterest = initial * (1 + (rate / 100) * ((i + 1) / 12)) + (monthly * i);
    }

    return {
      totalInvested,
      totalWithInterest,
      interest: totalWithInterest - totalInvested,
      monthlyBreakdown: generateSimpleInterestBreakdown(initial, monthly, rate, months)
    };
  };

  const calculateCompoundInterest = () => {
    const initial = parseFloat(compoundInterest.initialAmount) || 0;
    const monthly = parseFloat(compoundInterest.monthlyContribution) || 0;
    const monthlyRate = (parseFloat(compoundInterest.rate) || 0) / 100 / 12;
    const months = parseInt(compoundInterest.months) || 1;

    let totalInvested = initial;
    let balance = initial;
    const breakdown = [];

    for (let i = 0; i < months; i++) {
      if (i > 0) {
        totalInvested += monthly;
        balance += monthly;
      }
      
      const interestEarned = balance * monthlyRate;
      balance += interestEarned;
      
      breakdown.push({
        month: i + 1,
        contribution: i === 0 ? initial : monthly,
        balance: balance,
        interestEarned: interestEarned,
        totalInvested: totalInvested
      });
    }

    return {
      totalInvested,
      totalWithInterest: balance,
      interest: balance - totalInvested,
      monthlyBreakdown: breakdown
    };
  };

  const generateSimpleInterestBreakdown = (initial: number, monthly: number, rate: number, months: number) => {
    const breakdown = [];
    let totalInvested = initial;

    for (let i = 0; i < months; i++) {
      if (i > 0) {
        totalInvested += monthly;
      }
      
      const totalWithInterest = initial * (1 + (rate / 100) * ((i + 1) / 12)) + (monthly * i);
      const interestEarned = totalWithInterest - totalInvested;
      
      breakdown.push({
        month: i + 1,
        contribution: i === 0 ? initial : monthly,
        balance: totalWithInterest,
        interestEarned: interestEarned,
        totalInvested: totalInvested
      });
    }

    return breakdown;
  };

  const simpleResult = calculateSimpleInterest();
  const compoundResult = calculateCompoundInterest();
  const difference = compoundResult.totalWithInterest - simpleResult.totalWithInterest;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-accent" />
            Calculadora de Juros
          </h1>
          <p className="text-muted-foreground">
            Compare a diferença entre juros simples e juros compostos em seus investimentos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Forms */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Percent className="w-5 h-5 mr-2 text-primary" />
                  Parâmetros de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="initial-amount">Valor Inicial (€)</Label>
                  <Input
                    id="initial-amount"
                    type="number"
                    placeholder="100"
                    value={simpleInterest.initialAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSimpleInterest({...simpleInterest, initialAmount: value});
                      setCompoundInterest({...compoundInterest, initialAmount: value});
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-contribution">Aporte Mensal (€)</Label>
                  <Input
                    id="monthly-contribution"
                    type="number"
                    placeholder="100"
                    value={simpleInterest.monthlyContribution}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSimpleInterest({...simpleInterest, monthlyContribution: value});
                      setCompoundInterest({...compoundInterest, monthlyContribution: value});
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="interest-rate">Taxa de Juros (% ao ano)</Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    placeholder="10"
                    value={simpleInterest.rate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSimpleInterest({...simpleInterest, rate: value});
                      setCompoundInterest({...compoundInterest, rate: value});
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="time-period">Período (meses)</Label>
                  <Input
                    id="time-period"
                    type="number"
                    placeholder="12"
                    value={simpleInterest.months}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSimpleInterest({...simpleInterest, months: value});
                      setCompoundInterest({...compoundInterest, months: value});
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Juros Simples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">€{simpleResult.totalWithInterest.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +€{simpleResult.interest.toFixed(2)} em juros
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-card to-success/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Juros Compostos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">€{compoundResult.totalWithInterest.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +€{compoundResult.interest.toFixed(2)} em juros
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-card to-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Diferença
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent flex items-center">
                    <TrendingUp className="w-5 h-5 mr-1" />
                    €{difference.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((difference / simpleResult.totalWithInterest) * 100).toFixed(1)}% a mais
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Evolução Mensal dos Investimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="compound" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compound">Juros Compostos</TabsTrigger>
                    <TabsTrigger value="simple">Juros Simples</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="compound" className="mt-4">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {compoundResult.monthlyBreakdown.map((month) => (
                        <div key={month.month} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">Mês {month.month}</span>
                            <span className="text-sm text-muted-foreground">
                              +€{month.contribution.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">€{month.balance.toFixed(2)}</div>
                            <div className="text-xs text-success">
                              +€{month.interestEarned.toFixed(2)} juros
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="simple" className="mt-4">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {simpleResult.monthlyBreakdown.map((month) => (
                        <div key={month.month} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">Mês {month.month}</span>
                            <span className="text-sm text-muted-foreground">
                              +€{month.contribution.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">€{month.balance.toFixed(2)}</div>
                            <div className="text-xs text-primary">
                              +€{month.interestEarned.toFixed(2)} juros
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestCalculator;