import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Calculator, TrendingUp, Bell, FileText, GraduationCap, Target, BarChart3, Brain } from "lucide-react"

const FeatureSection = () => {
  const features = [
    { icon: Calculator, title: "Simulador Inteligente", description: "Calcule contemplações e lances com precisão.", color: "text-primary" },
    { icon: TrendingUp, title: "Controle de Parcelas", description: "Acompanhe pagamentos e vencimentos.", color: "text-success" },
    { icon: Brain, title: "IA Estratégica", description: "Sugestões personalizadas de lances.", color: "text-accent" },
    { icon: BarChart3, title: "Análise de Evolução", description: "Gráficos claros de progresso.", color: "text-primary" },
    { icon: Bell, title: "Lembretes Inteligentes", description: "Alertas estratégicos e vencimentos.", color: "text-warning" },
    { icon: FileText, title: "Relatórios Completos", description: "Exporte relatórios em PDF.", color: "text-success" },
    { icon: GraduationCap, title: "Educação Financeira", description: "Acesse ebooks e mentorias.", color: "text-accent" },
    { icon: Target, title: "Metas Inteligentes", description: "Defina objetivos financeiros.", color: "text-primary" }
  ]

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Funcionalidades que fazem a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">diferença</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para transformar seu consórcio em sucesso.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all group hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${feature.color.replace("text-", "bg-")}/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureSection