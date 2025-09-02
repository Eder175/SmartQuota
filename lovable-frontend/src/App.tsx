import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Index from "./pages/Index"
import CryptoIndex from "./pages/crypto"
import Stocks from "./pages/Stocks"
import InterestCalculator from "./pages/InterestCalculator"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          {/* Conteúdo das rotas */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/crypto" element={<CryptoIndex />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/calculator" element={<InterestCalculator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-muted/50 py-4 text-sm text-center">
            <p>© {new Date().getFullYear()} SmartQuota. Todos os direitos reservados.</p>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}