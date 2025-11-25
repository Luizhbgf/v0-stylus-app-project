"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bot,
  Send,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Award,
  Sparkles,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface BusinessMetrics {
  totalRevenue: number
  totalAppointments: number
  totalClients: number
  averageRating: number
  topService: string
  topStaff: string
  revenueGrowth: number
  appointmentsThisMonth: number
  newClientsThisMonth: number
}

export default function AdminChatAI() {
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMetrics()
    // Initial greeting
    setMessages([
      {
        role: "assistant",
        content:
          "Olá! Sou seu assistente de análise de negócios. Posso ajudá-lo a entender o desempenho do seu salão, identificar oportunidades de crescimento e responder perguntas sobre seus dados. Como posso ajudar?",
        timestamp: new Date(),
      },
    ])
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadMetrics() {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [paymentsRes, appointmentsRes, clientsRes, feedbackRes, servicesRes, staffRes] = await Promise.all([
      supabase.from("payments").select("amount, created_at").eq("status", "completed"),
      supabase.from("appointments").select("id, created_at, service_id, staff_id"),
      supabase.from("profiles").select("id, created_at").eq("user_level", 10),
      supabase.from("feedback").select("rating"),
      supabase.from("services").select("id, name, price").order("price", { ascending: false }),
      supabase.from("profiles").select("id, full_name").gte("user_level", 20).lte("user_level", 29),
    ])

    const payments = paymentsRes.data || []
    const appointments = appointmentsRes.data || []
    const clients = clientsRes.data || []
    const feedbacks = feedbackRes.data || []

    // Calculate metrics
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const appointmentsThisMonth = appointments.filter((a) => new Date(a.created_at) >= firstDayOfMonth).length
    const appointmentsLastMonth = appointments.filter(
      (a) => new Date(a.created_at) >= lastMonth && new Date(a.created_at) <= lastMonthEnd,
    ).length
    const newClientsThisMonth = clients.filter((c) => new Date(c.created_at) >= firstDayOfMonth).length
    const averageRating = feedbacks.length ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length : 0

    // Revenue growth
    const revenueThisMonth = payments
      .filter((p) => new Date(p.created_at) >= firstDayOfMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const revenueLastMonth = payments
      .filter((p) => new Date(p.created_at) >= lastMonth && new Date(p.created_at) <= lastMonthEnd)
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const revenueGrowth = revenueLastMonth ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0

    // Top service by count
    const serviceCounts: Record<string, number> = {}
    appointments.forEach((a) => {
      if (a.service_id) {
        serviceCounts[a.service_id] = (serviceCounts[a.service_id] || 0) + 1
      }
    })
    const topServiceId = Object.keys(serviceCounts).sort((a, b) => serviceCounts[b] - serviceCounts[a])[0]
    const topService = servicesRes.data?.find((s) => s.id === topServiceId)?.name || "N/A"

    // Top staff by appointments
    const staffCounts: Record<string, number> = {}
    appointments.forEach((a) => {
      if (a.staff_id) {
        staffCounts[a.staff_id] = (staffCounts[a.staff_id] || 0) + 1
      }
    })
    const topStaffId = Object.keys(staffCounts).sort((a, b) => staffCounts[b] - staffCounts[a])[0]
    const topStaff = staffRes.data?.find((s) => s.id === topStaffId)?.full_name || "N/A"

    setMetrics({
      totalRevenue,
      totalAppointments: appointments.length,
      totalClients: clients.length,
      averageRating,
      topService,
      topStaff,
      revenueGrowth,
      appointmentsThisMonth,
      newClientsThisMonth,
    })
  }

  async function analyzeQuery(query: string): Promise<string> {
    if (!metrics) return "Ainda estou carregando os dados do negócio. Por favor, aguarde um momento."

    const lowerQuery = query.toLowerCase()

    // Revenue analysis
    if (lowerQuery.includes("receita") || lowerQuery.includes("faturamento") || lowerQuery.includes("ganho")) {
      return `Análise de Receita:\n\n💰 Receita Total: R$ ${metrics.totalRevenue.toFixed(2)}\n📈 Crescimento: ${metrics.revenueGrowth > 0 ? "+" : ""}${metrics.revenueGrowth.toFixed(1)}% em relação ao mês passado\n\n${
        metrics.revenueGrowth > 0
          ? "Excelente! Sua receita está crescendo. Continue investindo nos serviços mais populares."
          : "A receita caiu este mês. Considere:\n- Campanhas promocionais\n- Novos serviços\n- Melhorar retenção de clientes"
      }`
    }

    // Appointments analysis
    if (lowerQuery.includes("agendamento") || lowerQuery.includes("horário") || lowerQuery.includes("marcação")) {
      return `Análise de Agendamentos:\n\n📅 Total de Agendamentos: ${metrics.totalAppointments}\n📊 Este Mês: ${metrics.appointmentsThisMonth}\n\n🏆 Serviço Mais Popular: ${metrics.topService}\n\nDica: Analise os horários de pico e considere adicionar mais profissionais nesses períodos.`
    }

    // Client analysis
    if (lowerQuery.includes("cliente") || lowerQuery.includes("customer")) {
      return `Análise de Clientes:\n\n👥 Total de Clientes: ${metrics.totalClients}\n🆕 Novos Este Mês: ${metrics.newClientsThisMonth}\n⭐ Avaliação Média: ${metrics.averageRating.toFixed(1)}/5\n\nDica: ${
        metrics.newClientsThisMonth > 10
          ? "Ótima aquisição de clientes! Foque em retenção agora."
          : "Considere investir em marketing para atrair novos clientes."
      }`
    }

    // Staff analysis
    if (lowerQuery.includes("funcionário") || lowerQuery.includes("profissional") || lowerQuery.includes("staff")) {
      return `Análise de Profissionais:\n\n🥇 Profissional Destaque: ${metrics.topStaff}\n\nDica: Reconheça e recompense os melhores profissionais. Considere bônus por desempenho para manter a motivação alta.`
    }

    // Success/failure analysis
    if (
      lowerQuery.includes("sucesso") ||
      lowerQuery.includes("fracasso") ||
      lowerQuery.includes("problema") ||
      lowerQuery.includes("melhoria")
    ) {
      const successes = []
      const improvements = []

      if (metrics.revenueGrowth > 5) successes.push("✅ Crescimento significativo da receita")
      else if (metrics.revenueGrowth < -5) improvements.push("⚠️ Receita em queda - revisar estratégia de preços")

      if (metrics.averageRating >= 4.5) successes.push("✅ Excelente satisfação dos clientes")
      else if (metrics.averageRating < 4) improvements.push("⚠️ Avaliação baixa - melhorar qualidade do serviço")

      if (metrics.newClientsThisMonth > 15) successes.push("✅ Boa aquisição de novos clientes")
      else improvements.push("⚠️ Poucos clientes novos - investir em marketing")

      return `Relatório de Desempenho:\n\n🎉 SUCESSOS:\n${successes.join("\n") || "Nenhum destaque no momento"}\n\n💡 OPORTUNIDADES DE MELHORIA:\n${improvements.join("\n") || "Tudo está indo bem!"}`
    }

    // Investment advice
    if (lowerQuery.includes("investir") || lowerQuery.includes("investimento") || lowerQuery.includes("gastar")) {
      return `Recomendações de Investimento:\n\n${
        metrics.revenueGrowth > 0
          ? "💼 Com receita crescente, considere:\n- Contratar mais profissionais\n- Investir em equipamentos modernos\n- Expandir serviços premium"
          : "💡 Com receita estável/baixa, foque em:\n- Marketing digital (ROI mais rápido)\n- Programas de fidelidade\n- Treinamento da equipe atual"
      }\n\n📊 Priorize investimentos que impactem o serviço mais popular: ${metrics.topService}`
    }

    // General insights
    return `Insights Gerais do Negócio:\n\n📊 Resumo Executivo:\n- Receita: R$ ${metrics.totalRevenue.toFixed(2)} (${metrics.revenueGrowth > 0 ? "+" : ""}${metrics.revenueGrowth.toFixed(1)}%)\n- Agendamentos: ${metrics.totalAppointments} total (${metrics.appointmentsThisMonth} este mês)\n- Clientes: ${metrics.totalClients} (${metrics.newClientsThisMonth} novos)\n- Satisfação: ${metrics.averageRating.toFixed(1)}/5 ⭐\n\n🏆 Destaques:\n- Serviço Top: ${metrics.topService}\n- Profissional Top: ${metrics.topStaff}\n\nPergunta específica? Tente perguntar sobre receita, clientes, agendamentos ou investimentos!`
  }

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const analysis = await analyzeQuery(input)

      const assistantMessage: Message = {
        role: "assistant",
        content: analysis,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      toast({
        title: "Erro ao analisar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Bot className="h-10 w-10 text-primary" />
          Assistente de Análise AI
        </h1>
        <p className="text-muted-foreground">Análises inteligentes e insights sobre seu negócio</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Metrics Cards */}
        <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {metrics?.totalRevenue.toFixed(2) || "0.00"}</div>
              {metrics && (
                <div
                  className={`text-xs flex items-center gap-1 mt-1 ${metrics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {metrics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {metrics.revenueGrowth > 0 ? "+" : ""}
                  {metrics.revenueGrowth.toFixed(1)}% vs mês anterior
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.appointmentsThisMonth || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Este mês</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalClients || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">+{metrics?.newClientsThisMonth || 0} novos</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Satisfação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.averageRating.toFixed(1) || "0.0"}/5</div>
              <div className="text-xs text-muted-foreground mt-1">Avaliação média</div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Chat com Assistente AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-[600px]">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm">Analisando...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Pergunte sobre receita, clientes, investimentos..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Quick Questions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Como está minha receita?")}
                  disabled={loading}
                >
                  Receita
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInput("Análise de clientes")} disabled={loading}>
                  Clientes
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInput("Onde devo investir?")} disabled={loading}>
                  Investimentos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Quais são meus sucessos e fracassos?")}
                  disabled={loading}
                >
                  Relatório Completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
