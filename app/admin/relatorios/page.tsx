"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, DollarSign, Calendar, Award, TrendingUp, Star, Target, Download } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, subWeeks } from "date-fns"
import { toast } from "sonner"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

type PeriodType = "quinzenal" | "mensal" | "semestral"

export default function AdminRelatoriosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>("mensal")
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [staff, setStaff] = useState<Profile[]>([])
  const [reportData, setReportData] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [services, setServices] = useState<any[]>([])

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

      const { data: staffData } = await supabase.from("profiles").select("*").gte("user_level", 20).order("full_name")

      setStaff(staffData || [])
      setLoading(false)

      const { data: servicesData } = await supabase.from("services").select("*")

      setServices(servicesData || [])
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    if (profile) {
      loadReportData()

      const appointmentsChannel = supabase
        .channel("admin-reports-appointments")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
          },
          (payload) => {
            console.log("[v0] Appointments changed, reloading reports:", payload)
            loadReportData()
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
          },
          (payload) => {
            console.log("[v0] Payments changed, reloading reports:", payload)
            loadReportData()
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "feedback",
          },
          (payload) => {
            console.log("[v0] Feedback changed, reloading reports:", payload)
            loadReportData()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(appointmentsChannel)
      }
    }
  }, [period, selectedStaff, profile])

  async function loadReportData() {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case "quinzenal":
        startDate = subWeeks(now, 2)
        break
      case "mensal":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case "semestral":
        startDate = subMonths(now, 6)
        break
    }

    let appointmentsQuery = supabase
      .from("appointments")
      .select(
        `
        *,
        service:services(*),
        staff:staff_id(id, full_name),
        client:client_id(id, full_name, email)
      `,
      )
      .gte("appointment_date", startDate.toISOString())
      .lte("appointment_date", endDate.toISOString())

    if (selectedStaff !== "all") {
      appointmentsQuery = appointmentsQuery.eq("staff_id", selectedStaff)
    }

    const { data: appointments } = await appointmentsQuery

    const paymentsQuery = supabase
      .from("payments")
      .select("*")
      .gte("payment_date", startDate.toISOString())
      .lte("payment_date", endDate.toISOString())

    const { data: payments } = await paymentsQuery

    let feedbackQuery = supabase
      .from("feedback")
      .select(
        `
        *,
        staff:staff_id(full_name),
        client:client_id(full_name)
      `,
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (selectedStaff !== "all") {
      feedbackQuery = feedbackQuery.eq("staff_id", selectedStaff)
    }

    const { data: feedback } = await feedbackQuery

    const completedAppointments = appointments?.filter((a) => a.status === "completed") || []

    const totalRevenue = completedAppointments.reduce((sum, a) => {
      const price = a.custom_price || a.service?.price || 0
      return sum + Number(price)
    }, 0)

    const avgRating =
      feedback && feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

    const serviceStats: Record<
      string,
      { count: number; revenue: number; avgRating: number; feedbackCount: number; category: string }
    > = {}

    completedAppointments.forEach((a) => {
      // Handle multiple services if service_ids exists
      if (a.service_ids && Array.isArray(a.service_ids) && a.service_ids.length > 0) {
        const servicePrices = a.service_prices || []

        a.service_ids.forEach((serviceId: string, index: number) => {
          // Find the service to get its name and category
          const serviceData = services.find((s: any) => s.id === serviceId)
          const serviceName = serviceData?.name || "Desconhecido"
          const serviceCategory = serviceData?.category || "Sem categoria"

          // Get price for this specific service
          const priceData = servicePrices.find((sp: any) => sp.service_id === serviceId)
          const servicePrice = priceData?.price || serviceData?.price || 0

          if (!serviceStats[serviceName]) {
            serviceStats[serviceName] = {
              count: 0,
              revenue: 0,
              avgRating: 0,
              feedbackCount: 0,
              category: serviceCategory,
            }
          }
          serviceStats[serviceName].count++
          serviceStats[serviceName].revenue += Number(servicePrice)
        })
      } else {
        // Fallback for old single-service appointments
        const serviceName = a.service?.name || "Desconhecido"
        const serviceCategory = a.service?.category || "Sem categoria"

        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = {
            count: 0,
            revenue: 0,
            avgRating: 0,
            feedbackCount: 0,
            category: serviceCategory,
          }
        }
        serviceStats[serviceName].count++
        serviceStats[serviceName].revenue += Number(a.custom_price || a.service?.price || 0)
      }

      // Handle feedback ratings
      const serviceFeedback = feedback?.filter((f) => f.appointment_id === a.id)
      if (serviceFeedback && serviceFeedback.length > 0) {
        // Distribute rating across all services in the appointment
        const serviceNames =
          a.service_ids && a.service_ids.length > 0
            ? a.service_ids.map((id: string) => services.find((s: any) => s.id === id)?.name || "Desconhecido")
            : [a.service?.name || "Desconhecido"]

        serviceNames.forEach((name: string) => {
          if (serviceStats[name]) {
            serviceStats[name].avgRating +=
              serviceFeedback.reduce((sum, f) => sum + f.rating, 0) / serviceFeedback.length
            serviceStats[name].feedbackCount++
          }
        })
      }
    })

    Object.keys(serviceStats).forEach((key) => {
      if (serviceStats[key].feedbackCount > 0) {
        serviceStats[key].avgRating = serviceStats[key].avgRating / serviceStats[key].feedbackCount
      }
    })

    const staffPerformance = staff.map((s) => {
      const staffAppointments = completedAppointments.filter((a) => a.staff_id === s.id)
      const staffFeedback = feedback?.filter((f) => f.staff_id === s.id) || []
      const revenue = staffAppointments.reduce((sum, a) => sum + Number(a.custom_price || a.service?.price || 0), 0)
      const avgStaffRating =
        staffFeedback.length > 0 ? staffFeedback.reduce((sum, f) => sum + f.rating, 0) / staffFeedback.length : 0

      return {
        id: s.id,
        name: s.full_name,
        appointments: staffAppointments.length,
        revenue,
        avgRating: avgStaffRating,
        feedbackCount: staffFeedback.length,
      }
    })

    const clientStats: Record<string, { visits: number; spent: number; lastVisit: Date }> = {}
    completedAppointments.forEach((a) => {
      const clientId = a.client_id
      if (!clientId) return

      if (!clientStats[clientId]) {
        clientStats[clientId] = { visits: 0, spent: 0, lastVisit: new Date(a.appointment_date) }
      }
      clientStats[clientId].visits++
      clientStats[clientId].spent += Number(a.custom_price || a.service?.price || 0)
      const appointmentDate = new Date(a.appointment_date)
      if (appointmentDate > clientStats[clientId].lastVisit) {
        clientStats[clientId].lastVisit = appointmentDate
      }
    })

    const returningClients = Object.values(clientStats).filter((c) => c.visits > 1).length
    const retentionRate =
      Object.keys(clientStats).length > 0 ? (returningClients / Object.keys(clientStats).length) * 100 : 0

    const servicesByCategory = Object.entries(serviceStats).reduce(
      (acc, [name, stats]) => {
        const category = stats.category || "Sem categoria"
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push({ name, ...stats })
        return acc
      },
      {} as Record<
        string,
        Array<{
          name: string
          count: number
          revenue: number
          avgRating: number
          feedbackCount: number
          category: string
        }>
      >,
    )

    setReportData({
      appointments: appointments || [],
      completedAppointments,
      totalRevenue,
      avgRating,
      serviceStats,
      staffPerformance: staffPerformance.sort((a, b) => b.revenue - a.revenue),
      feedback: feedback || [],
      clientStats,
      retentionRate,
      totalClients: Object.keys(clientStats).length,
      returningClients,
      period,
      periodLabel: period === "quinzenal" ? "Últimas 2 Semanas" : period === "mensal" ? "Mês Atual" : "Últimos 6 Meses",
      startDate,
      endDate,
      lastUpdate: new Date(), // Add timestamp for real-time indicator
      servicesByCategory,
    })
  }

  async function exportToPDF() {
    if (!reportData) return

    setExporting(true)
    toast.info("Gerando PDF...")

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportData,
          staffName: selectedStaff === "all" ? "Todos" : staff.find((s) => s.id === selectedStaff)?.full_name,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao gerar PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `relatorio-${format(new Date(), "yyyy-MM-dd-HHmmss")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("PDF gerado com sucesso!")
    } catch (error) {
      console.error("[v0] Error exporting PDF:", error)
      toast.error("Erro ao gerar PDF")
    } finally {
      setExporting(false)
    }
  }

  if (loading || !profile || !reportData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  const topServices = Object.entries(reportData.serviceStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  const bestRatedService = Object.entries(reportData.serviceStats)
    .filter(([_, stats]) => stats.feedbackCount > 0)
    .sort((a, b) => b[1].avgRating - a[1].avgRating)[0]

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Relatórios e Análises</h1>
            <p className="text-muted-foreground">Visão analítica e insights de desempenho</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">
                Atualizado em tempo real • Última atualização: {format(reportData.lastUpdate, "HH:mm:ss")}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
              <SelectTrigger className="w-[180px] border-gold/20">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quinzenal">Últimas 2 Semanas</SelectItem>
                <SelectItem value="mensal">Mês Atual</SelectItem>
                <SelectItem value="semestral">Últimos 6 Meses</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[200px] border-gold/20">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportToPDF} disabled={exporting} className="bg-gold hover:bg-gold/90 text-black">
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData.completedAppointments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">de {reportData.appointments.length} totais</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {reportData.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Média: R${" "}
                {reportData.completedAppointments.length > 0
                  ? (reportData.totalRevenue / reportData.completedAppointments.length).toFixed(2)
                  : "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData.avgRating.toFixed(1)} ⭐</div>
              <p className="text-xs text-muted-foreground mt-1">{reportData.feedback.length} avaliações</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reportData.retentionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">{reportData.returningClients} clientes retornaram</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-gold" />
                Serviços por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(reportData.servicesByCategory)
                  .sort((a, b) => {
                    const revenueA = a[1].reduce((sum, s) => sum + s.revenue, 0)
                    const revenueB = b[1].reduce((sum, s) => sum + s.revenue, 0)
                    return revenueB - revenueA
                  })
                  .map(([category, services]) => {
                    const categoryRevenue = services.reduce((sum, s) => sum + s.revenue, 0)
                    const categoryCount = services.reduce((sum, s) => sum + s.count, 0)

                    return (
                      <div key={category} className="border border-gold/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg text-foreground">{category}</h3>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gold">R$ {categoryRevenue.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">{categoryCount} serviços</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {services
                            .sort((a, b) => b.revenue - a.revenue)
                            .map((service, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-card/30 rounded">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                                  <p className="text-xs text-muted-foreground">{service.count} vendas</p>
                                </div>
                                <p className="text-sm font-semibold text-gold">R$ {service.revenue.toFixed(2)}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="bg-card border border-gold/20">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="staff">Por Profissional</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="mentoria">Insights de Mentoria</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Award className="h-5 w-5 text-gold" />
                    Top 5 Profissionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.staffPerformance.slice(0, 5).map((s: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{s.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{s.appointments} agendamentos</span>
                            {s.feedbackCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-gold fill-gold" />
                                {s.avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gold">R$ {s.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="h-5 w-5 text-gold" />
                    Top 5 Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topServices.map(([name, stats]: [string, any], index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{stats.count} vezes</span>
                            {stats.feedbackCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-gold fill-gold" />
                                {stats.avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <div className="grid gap-6">
              {reportData.staffPerformance.map((s: any) => (
                <Card key={s.id} className="border-gold/20">
                  <CardHeader>
                    <CardTitle className="text-foreground">{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Agendamentos</p>
                        <p className="text-2xl font-bold text-foreground">{s.appointments}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Receita</p>
                        <p className="text-2xl font-bold text-gold">R$ {s.revenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avaliação</p>
                        <p className="text-2xl font-bold text-foreground">
                          {s.feedbackCount > 0 ? `${s.avgRating.toFixed(1)} ⭐` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                        <p className="text-2xl font-bold text-foreground">
                          R$ {s.appointments > 0 ? (s.revenue / s.appointments).toFixed(2) : "0.00"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="servicos" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <DollarSign className="h-5 w-5 text-gold" />
                    Serviços Mais Lucrativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(reportData.serviceStats)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .slice(0, 10)
                      .map(([name, stats]: [string, any], index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{name}</p>
                            <p className="text-sm text-muted-foreground">{stats.count} vendas</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {(stats.revenue / stats.count).toFixed(2)} / venda
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Star className="h-5 w-5 text-gold" />
                    Serviços Mais Bem Avaliados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(reportData.serviceStats)
                      .filter(([_, stats]) => stats.feedbackCount > 0)
                      .sort((a, b) => b[1].avgRating - a[1].avgRating)
                      .slice(0, 10)
                      .map(([name, stats]: [string, any], index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{name}</p>
                            <p className="text-sm text-muted-foreground">{stats.feedbackCount} avaliações</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">{stats.avgRating.toFixed(1)} ⭐</p>
                            <p className="text-xs text-muted-foreground">{stats.count} vendas</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{reportData.totalClients}</div>
                </CardContent>
              </Card>

              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gold">{reportData.returningClients}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportData.retentionRate.toFixed(1)}% de retenção
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    R${" "}
                    {reportData.totalClients > 0
                      ? (reportData.totalRevenue / reportData.totalClients).toFixed(2)
                      : "0.00"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-gold" />
                  Top 10 Clientes por Gasto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.clientStats)
                    .sort((a, b) => b[1].spent - a[1].spent)
                    .slice(0, 10)
                    .map(([clientId, stats]: [string, any], index: number) => {
                      const client = reportData.appointments.find((a: any) => a.client_id === clientId)?.client
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-card/30 rounded">
                          <div>
                            <p className="text-sm font-medium text-foreground">{client?.full_name || "Cliente"}</p>
                            <p className="text-xs text-muted-foreground">
                              {stats.visits} visitas • Última: {format(new Date(stats.lastVisit), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gold">R$ {stats.spent.toFixed(2)}</p>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentoria" className="space-y-6">
            <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="h-5 w-5 text-gold" />
                  Insights e Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Most profitable service insight */}
                {reportData.staffPerformance.length > 0 && reportData.staffPerformance[0].revenue > 0 && (
                  <div className="p-4 bg-card rounded-lg border border-gold/20">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gold" />
                      Serviço Mais Lucrativo
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      <span className="font-semibold text-gold">
                        {Object.entries(reportData.serviceStats).find(
                          ([name, stats]) =>
                            name ===
                            reportData.staffPerformance.find(
                              (s) =>
                                s.revenue ===
                                reportData.staffPerformance.reduce((max, s) => Math.max(max, s.revenue), 0),
                            )?.services?.name,
                        )}
                      </span>
                      gerou R${" "}
                      {reportData.staffPerformance
                        .find(
                          (s) =>
                            s.revenue === reportData.staffPerformance.reduce((max, s) => Math.max(max, s.revenue), 0),
                        )
                        ?.revenue.toFixed(2)}{" "}
                      em{" "}
                      {
                        reportData.staffPerformance.find(
                          (s) =>
                            s.revenue === reportData.staffPerformance.reduce((max, s) => Math.max(max, s.revenue), 0),
                        )?.appointments
                      }{" "}
                      vendas.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Recomendação:</strong> Considere criar promoções ou pacotes incluindo este serviço para
                      aumentar ainda mais as vendas. Treine mais profissionais nesta especialidade.
                    </p>
                  </div>
                )}

                {/* Best rated service insight */}
                {bestRatedService && (
                  <div className="p-4 bg-card rounded-lg border border-gold/20">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-gold" />
                      Serviço Mais Bem Avaliado
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      <span className="font-semibold text-gold">{bestRatedService[0]}</span> tem avaliação média de{" "}
                      {bestRatedService[1].avgRating.toFixed(1)} ⭐ com {bestRatedService[1].feedbackCount} avaliações.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Recomendação:</strong> Use este serviço como destaque no marketing. Identifique o que
                      torna este serviço especial e replique as melhores práticas em outros serviços.
                    </p>
                  </div>
                )}

                {/* Retention rate insight */}
                <div className="p-4 bg-card rounded-lg border border-gold/20">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold" />
                    Taxa de Retenção de Clientes
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    {reportData.retentionRate.toFixed(1)}% dos clientes retornaram para novos agendamentos (
                    {reportData.returningClients} de {reportData.totalClients} clientes).
                  </p>
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Recomendação:</strong>{" "}
                    {reportData.retentionRate < 50
                      ? "A taxa de retenção está baixa. Implemente programas de fidelidade, envie lembretes personalizados e colete feedback para entender por que clientes não retornam."
                      : reportData.retentionRate < 70
                        ? "Boa taxa de retenção! Para melhorar ainda mais, considere criar um programa VIP para clientes frequentes e ofereça benefícios exclusivos."
                        : "Excelente taxa de retenção! Continue mantendo a qualidade do serviço e considere pedir indicações aos clientes satisfeitos."}
                  </p>
                </div>

                {/* Staff performance insight */}
                {reportData.staffPerformance.length > 0 && (
                  <div className="p-4 bg-card rounded-lg border border-gold/20">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-gold" />
                      Desempenho da Equipe
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      <span className="font-semibold text-gold">{reportData.staffPerformance[0].name}</span> lidera em
                      receita com R$ {reportData.staffPerformance[0].revenue.toFixed(2)}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Recomendação:</strong> Organize sessões de mentoria onde os profissionais de melhor
                      desempenho compartilhem suas técnicas e estratégias de atendimento. Considere bonificações por
                      desempenho para motivar toda a equipe.
                    </p>
                  </div>
                )}

                {/* Feedback insight */}
                {reportData.avgRating > 0 && (
                  <div className="p-4 bg-card rounded-lg border border-gold/20">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-gold" />
                      Satisfação Geral
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Avaliação média de {reportData.avgRating.toFixed(1)} ⭐ com {reportData.feedback.length}{" "}
                      avaliações recebidas.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Recomendação:</strong>{" "}
                      {reportData.avgRating < 3.5
                        ? "A satisfação está abaixo do ideal. Revise os feedbacks negativos, identifique padrões e implemente melhorias urgentes. Considere treinamento adicional para a equipe."
                        : reportData.avgRating < 4.5
                          ? "Boa avaliação! Analise os comentários para identificar pontos de melhoria específicos. Incentive mais clientes a deixarem avaliações."
                          : "Excelente avaliação! Mantenha o padrão de qualidade e use as avaliações positivas no marketing. Considere criar estudos de caso com clientes satisfeitos."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
