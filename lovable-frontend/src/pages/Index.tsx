import Navbar from "../components/Navbar"
import HeroSection from "../components/HeroSection"
import FeatureSection from "../components/FeatureSection"
import DashboardStats from "../components/DashboardStats"
import ConsortiumCard from "../components/ConsortiumCard"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { ArrowRight, Calculator, TrendingUp } from "lucide-react"

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeatureSection />

      {/* Dashboard Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Seu{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                painel financeiro
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Veja todos os seus consórcios e projeções em um só lugar.
            </p>
          </div>

          <DashboardStats />

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            <div className="lg:col-span-2 space-y-6">
              <ConsortiumCard
                title="Consórcio Imóvel São Paulo"
                totalValue={450000}
                paidInstallments={24}
                totalInstallments={120}
                nextPayment="15/Jan"
                status="active"
                progressPercentage={20}
              />
              <ConsortiumCard
                title="Consórcio Veículo Premium"
                totalValue={80000}
                paidInstallments={45}
                totalInstallments={60}
                nextPayment="Contemplado"
                status="contemplated"
                progressPercentage={75}
              />
            </div>

            <div className="space-y-6">
              <Card className="shadow-l rounded-xl border border-border bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span>Simulador Rápido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Calcule chances de contemplação e estratégias de lance.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Calculator className="h-4 w-4 mr-2" /> Simular Agora
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-l rounded-xl border border-border bg-gradient-to-br from-card to-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    <span>Economia Total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-success">R$ 85.000</p>
                  <p className="text-sm text-muted-foreground">
                    comparado ao financiamento tradicional
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto text-center px-6 text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">Transforme seus consórcios HOJE!</h2>
          <p className="text-lg opacity-90 mb-8">
            Junte-se a milhares de brasileiros que já descobriram como planejar melhor.
          </p>
          <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
            Começar Gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Index