import React from "react"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import { NavLink } from "react-router-dom"

const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SmartQuota
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-6 font-medium">
          <NavLink to="/" className={({ isActive }) => isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground transition"}>Painel</NavLink>
          <NavLink to="/crypto" className={({ isActive }) => isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground transition"}>Criptomoedas</NavLink>
          <NavLink to="/stocks" className={({ isActive }) => isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground transition"}>Ações</NavLink>
          <NavLink to="/calculator" className={({ isActive }) => isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground transition"}>Calculadora</NavLink>
          <a href="#education" className="text-muted-foreground hover:text-foreground transition">Educação</a>
        </div>

        {/* Botões */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="font-medium">Entrar</Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-md hover:scale-105 transition">
            Começar Grátis
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar