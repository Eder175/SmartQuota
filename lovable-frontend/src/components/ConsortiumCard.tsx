import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { TrendingUp, Calendar, DollarSign, Target } from "lucide-react"

interface ConsortiumCardProps {
  title: string
  totalValue: number
  paidInstallments: number
  totalInstallments: number
  nextPayment: string
  status: "active" | "contemplated" | "overdue"
  progressPercentage: number
}

const ConsortiumCard = ({ title, totalValue, paidInstallments, totalInstallments, nextPayment, status, progressPercentage }: ConsortiumCardProps) => {
  const statusMap = {
    active: { text: "Ativo", color: "bg-success text-success-foreground" },
    contemplated: { text: "Contemplado", color: "bg-secondary text-secondary-foreground" },
    overdue: { text: "Atrasado", color: "bg-danger text-danger-foreground" }
  }

  return (
    <Card className="hover:shadow-lg transition-all border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge className={statusMap[status]?.color || "bg-muted"}>{statusMap[status]?.text || "Indefinido"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center text-sm text-muted-foreground space-x-1"><DollarSign className="w-4 h-4" /> <span>Valor Total</span></div>
            <p className="text-lg font-semibold">R$ {totalValue.toLocaleString("pt-BR")}</p>
          </div>
          <div>
            <div className="flex items-center text-sm text-muted-foreground space-x-1"><Target className="w-4 h-4" /> <span>Parcelas</span></div>
            <p className="text-lg font-semibold">{paidInstallments}/{totalInstallments}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progresso</span><span>{progressPercentage}%</span></div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Próximo: {nextPayment}</span>
          </div>
          <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground">
            <TrendingUp className="w-4 h-4 mr-1" /> Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ConsortiumCard