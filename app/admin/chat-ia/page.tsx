"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, TrendingUp, Users, Calendar, DollarSign } from "lucide-react"
import { format, subDays } from "date-fns"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function ChatIAAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente IA do Stylus. Posso ajudá-lo a analisar o desempenho do seu negócio, identificar oportunidades de crescimento e responder perguntas sobre receitas, clientes e agendamentos. Como posso ajudá-lo hoje?",
    },
  ])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profileData || profileData.user_level < 30) {
        router.push("/cliente")
        return
      }

      setProfile(profileData)
      await loadMetrics()
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  async function loadMetrics() {
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*, service:service_id(price)")
      .gte("appointment_date", thirtyDaysAgo)

    const { data: clients } = await supabase.from("profiles").select("*").eq("user_level", 10)

    const completedAppointments = appointments?.filter((a) => a.status === "completed") || []
    const revenue = completedAppointments.reduce((sum, a) => sum + (a.custom_price || a.service?.price || 0), 0)

    setMetrics({
      totalRevenue: revenue,
      totalAppointments: appointments?.length || 0,
      completedAppointments: completedAppointments.length,
      totalClients: clients?.length || 0,
    })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsGenerating(true)

    try {
      const response = await fetch("/api/admin-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          metrics: metrics,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha na requisição")
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("[v0] Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou reformule sua pergunta.",
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const quickQuestions = [
    "Como está o desempenho do meu negócio?",
    "Quais são as oportunidades de crescimento?",
    "Analise minha receita dos últimos 30 dias",
    "Quais serviços são mais rentáveis?",
  ]

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Assistente IA</h1>
          <p className="text-muted-foreground">Análises inteligentes e insights sobre o seu negócio</p>
        </div>

        {metrics && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita (30d)</CardTitle>
                <DollarSign className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {metrics.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                <Calendar className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.totalAppointments}</div>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.completedAppointments}</div>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.totalClients}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-gold/20 h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-foreground">Chat com Assistente</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-gold text-white" : "bg-muted text-foreground border border-gold/20"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground border border-gold/20 rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(question)
                      setTimeout(() => handleSend(), 100)
                    }}
                    disabled={isGenerating}
                    className="text-xs border-gold/20 hover:bg-gold/10"
                  >
                    {question}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Digite sua pergunta..."
                  disabled={isGenerating}
                  className="border-gold/20"
                />
                <Button
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim()}
                  className="bg-gold hover:bg-gold/90"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
