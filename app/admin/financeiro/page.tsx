"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Award } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

export default function AdminFinanceiroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<any[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))

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
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    if (profile) {
      loadPayments()
    }
  }, [profile, selectedStaff, startDate, endDate])

  async function loadPayments() {
    const query = supabase
      .from("payments")
      .select(
        `
        *,
        client:client_id(full_name),
        appointment:appointment_id(
          service:services(name),
          staff:staff_id(id, full_name)
        )
      `,
      )
      .gte("payment_date", new Date(startDate).toISOString())
      .lte("payment_date", new Date(endDate + "T23:59:59").toISOString())
      .order("payment_date", { ascending: false })

    const { data } = await query

    let filteredData = data || []
    if (selectedStaff !== "all") {
      filteredData = filteredData.filter((p) => p.appointment?.staff?.id === selectedStaff)
    }

    setPayments(filteredData)
  }

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

  const currentMonth = new Date()
  const lastMonth = subMonths(currentMonth, 1)
  const currentMonthStart = startOfMonth(currentMonth)
  const currentMonthEnd = endOfMonth(currentMonth)
  const lastMonthStart = startOfMonth(lastMonth)
  const lastMonthEnd = endOfMonth(lastMonth)

  const currentMonthRevenue =
    payments
      ?.filter((p) => {
        const date = new Date(p.payment_date)
        return date >= currentMonthStart && date <= currentMonthEnd && p.status === "completed"
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const lastMonthRevenue =
    payments
      ?.filter((p) => {
        const date = new Date(p.payment_date)
        return date >= lastMonthStart && date <= lastMonthEnd && p.status === "completed"
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const totalRevenue =
    payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const pendingRevenue =
    payments?.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const serviceStats: Record<string, { count: number; revenue: number }> = {}
  payments
    .filter((p) => p.status === "completed")
    .forEach((p) => {
      const serviceName = p.appointment?.service?.name || "Desconhecido"
      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = { count: 0, revenue: 0 }
      }
      serviceStats[serviceName].count++
      serviceStats[serviceName].revenue += Number(p.amount)
    })

  const topServices = Object.entries(serviceStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  const staffRevenue: Record<string, { name: string; revenue: number; count: number }> = {}
  payments
    .filter((p) => p.status === "completed")
    .forEach((p) => {
      const staffId = p.appointment?.staff?.id
      const staffName = p.appointment?.staff?.full_name || "Desconhecido"
      if (staffId && !staffRevenue[staffId]) {
        staffRevenue[staffId] = { name: staffName, revenue: 0, count: 0 }
      }
      if (staffId) {
        staffRevenue[staffId].revenue += Number(p.amount)
        staffRevenue[staffId].count++
      }
    })

  const topStaff = Object.values(staffRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Visão geral financeira do negócio</p>
        </div>

        <Card className="border-gold/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-gold" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Profissional</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="border-gold/20">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Período selecionado</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {currentMonthRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variação Mensal</CardTitle>
              {revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${revenueChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {revenueChange >= 0 ? "+" : ""}
                {revenueChange.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs. mês anterior</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {pendingRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5 text-gold" />
                Top 5 Serviços Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topServices.map(([name, stats], index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="font-semibold text-foreground">{name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{stats.count} vendas</p>
                    </div>
                    <p className="text-lg font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                  </div>
                ))}
                {topServices.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5 text-gold" />
                Top 5 Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStaff.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="font-semibold text-foreground">{staff.name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{staff.count} vendas</p>
                    </div>
                    <p className="text-lg font-bold text-gold">R$ {staff.revenue.toFixed(2)}</p>
                  </div>
                ))}
                {topStaff.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-foreground">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-gold/10"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {payment.client?.full_name || "Cliente não identificado"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Profissional: {payment.appointment?.staff?.full_name || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Serviço: {payment.appointment?.service?.name || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(payment.payment_date), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold">R$ {Number(payment.amount).toFixed(2)}</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          payment.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : payment.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {payment.status === "completed"
                          ? "Concluído"
                          : payment.status === "pending"
                            ? "Pendente"
                            : "Cancelado"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{payment.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pagamento registrado no período selecionado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
