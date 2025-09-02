import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { TrendingUp, DollarSign, Calendar, Award } from "lucide-react"

const DashboardStats = () => {
  const stats = [
    { title: "Valor Total Investido", value: "R$ 450.000", change: "+12% este mês", icon: DollarSign, color: "text-success" },
    { title: "Consórcios Ativos", value: "3", change: "1 contemplado", icon: Calendar, color: "text-primary" },
    { title: "Economia vs Financiamento", value: "R$ 85.000", change: "27% de economia", icon: TrendingUp, color: "text-success" },
    { title: "Score SmartQuota", value: "850", change: "+25 pontos", icon: Award, color: "text-accent" }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <p className={`text-xs ${stat.color} font-medium`}>{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default DashboardStats