import { Button } from "./ui/button"
import { ArrowRight, Brain, TrendingUp, Shield } from "lucide-react"

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-primary-muted/20 to-accent/10">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-primary font-medium">
              <Brain className="w-5 h-5" />
              <span>Inteligência Financeira</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              O primeiro sistema{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                inteligente
              </span>{" "}
              de consórcios
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Transforme seu consórcio em uma estratégia vencedora.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg">
                Começar Grátis <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="border-2 hover:bg-primary hover:text-primary-foreground">
                Ver Demonstração
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-3 mx-auto">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-medium">Economia Inteligente</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3 mx-auto">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">IA Estratégica</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-3 mx-auto">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <p className="text-sm font-medium">Controle Total</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <img
              src="https://source.unsplash.com/800x600/?finance,technology"
              alt="Dashboard SmartQuota"
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection