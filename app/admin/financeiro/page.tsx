"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, Filter, Award, Trash2, CheckCircle, RotateCcw, CreditCard } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [appointments, setAppointments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const { toast } = useToast()
  const [servicesMap, setServicesMap] = useState<Map<string, any>>(new Map<string, any>())

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
    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        client:client_id(full_name),
        staff:staff_id(id, full_name)
      `,
      )
      .eq("status", "completed")
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate + "T23:59:59")
      .order("appointment_date", { ascending: false })

    if (selectedStaff !== "all") {
      query = query.eq("staff_id", selectedStaff)
    }

    const { data: appointmentsData } = await query

    const allServiceIds = new Set<string>()
    appointmentsData?.forEach((apt) => {
      if (apt.service_id) allServiceIds.add(apt.service_id)
      if (apt.service_ids && Array.isArray(apt.service_ids)) {
        apt.service_ids.forEach((id: string) => allServiceIds.add(id))
      }
    })

    const { data: servicesData } = await supabase
      .from("services")
      .select("id, name, price, category")
      .in("id", Array.from(allServiceIds))

    const servicesMapData = new Map(servicesData?.map((s) => [s.id, s]) || [])
    setServicesMap(servicesMapData)

    const appointmentIds = appointmentsData?.map((a) => a.id) || []
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("appointment_id, payment_method")
      .in("appointment_id", appointmentIds)

    const paymentMethodMap = new Map(paymentsData?.map((p) => [p.appointment_id, p.payment_method]) || [])

    const paymentsDataMapped =
      appointmentsData?.map((apt) => {
        let totalAmount = 0

        // If has service_prices (multi-service), sum them
        if (apt.service_prices && typeof apt.service_prices === "object") {
          totalAmount = Object.values(apt.service_prices as Record<string, number>).reduce(
            (sum, price) => sum + price,
            0,
          )
        }
        // Fallback to custom_price or single service price
        else {
          const singleService = servicesMapData.get(apt.service_id)
          totalAmount = apt.custom_price || singleService?.price || 0
        }

        return {
          id: apt.id,
          amount: totalAmount,
          original_price: apt.original_price || totalAmount,
          custom_price: apt.custom_price,
          payment_date: apt.appointment_date,
          payment_method: paymentMethodMap.get(apt.id) || "Não especificado",
          payment_status: apt.payment_status,
          pay_later: apt.pay_later,
          status: "completed",
          client: apt.client,
          sporadic_client_name: apt.sporadic_client_name,
          client_type: apt.client_type,
          appointment: {
            ...apt,
            service: servicesMapData.get(apt.service_id), // Legacy single service
            staff: apt.staff,
          },
        }
      }) || []

    setPayments(paymentsDataMapped)
    setAppointments(appointmentsData || [])
  }

  function openPaymentMethodDialog(appointmentId: string) {
    setSelectedAppointmentId(appointmentId)
    setSelectedPaymentMethod("")
    setShowPaymentMethodDialog(true)
  }

  async function handleMarkAsPaid(appointmentId: string) {
    if (!selectedPaymentMethod) {
      toast({
        title: "Erro",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      })
      return
    }

    const { error: aptError } = await supabase
      .from("appointments")
      .update({
        payment_status: "paid",
        pay_later: false,
      })
      .eq("id", appointmentId)

    if (aptError) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como pago.",
        variant: "destructive",
      })
      return
    }

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("appointment_id", appointmentId)
      .single()

    if (existingPayment) {
      await supabase
        .from("payments")
        .update({
          payment_method: selectedPaymentMethod,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id)
    } else {
      const appointment = appointments.find((apt) => apt.id === appointmentId)
      if (appointment) {
        await supabase.from("payments").insert({
          appointment_id: appointmentId,
          client_id: appointment.client_id,
          amount: appointment.custom_price || appointment.service?.price || 0,
          payment_method: selectedPaymentMethod,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
      }
    }

    toast({
      title: "Sucesso",
      description: "Pagamento marcado como pago com sucesso.",
    })

    setShowPaymentMethodDialog(false)
    setSelectedAppointmentId(null)
    setSelectedPaymentMethod("")
    loadPayments()
  }

  async function handleRevertToConfirmed(appointmentId: string) {
    if (!confirm("Tem certeza que deseja reverter este agendamento para o status de confirmado?")) {
      return
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        payment_status: null,
        pay_later: false,
      })
      .eq("id", appointmentId)

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reverter o agendamento.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Sucesso",
      description: "Agendamento revertido para confirmado com sucesso.",
    })

    loadPayments()
  }

  async function handleDelete(appointmentId: string) {
    if (!confirm("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.")) {
      return
    }

    const { error } = await supabase.from("appointments").delete().eq("id", appointmentId)

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Sucesso",
      description: "Registro excluído com sucesso.",
    })

    loadPayments()
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
        return date >= currentMonthStart && date <= currentMonthEnd
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const lastMonthRevenue =
    payments
      ?.filter((p) => {
        const date = new Date(p.payment_date)
        return date >= lastMonthStart && date <= lastMonthEnd
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const totalRevenue =
    payments?.filter((p) => p.payment_status === "paid").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const pendingRevenue =
    payments?.filter((p) => p.pay_later && p.payment_status !== "paid").reduce((sum, p) => sum + Number(p.amount), 0) ||
    0

  const serviceStats: Record<string, { count: number; revenue: number }> = {}
  payments.forEach((p) => {
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
  payments.forEach((p) => {
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

  const filteredPayments = payments

  const paymentMethodStats: Record<string, { count: number; revenue: number }> = {}
  payments.forEach((p) => {
    const method = p.payment_method || "Não especificado"
    if (!paymentMethodStats[method]) {
      paymentMethodStats[method] = { count: 0, revenue: 0 }
    }
    if (p.payment_status === "paid") {
      paymentMethodStats[method].count++
      paymentMethodStats[method].revenue += Number(p.amount)
    }
  })

  const serviceGroups: Record<string, string[]> = {
    "Cortes e Estética": ["corte", "barba", "sobrancelha"],
    Químicas: ["quimica", "coloração", "descoloração", "tintura", "mechas", "luzes"],
    "Unhas e Massagem": ["unha", "manicure", "pedicure", "massagem"],
  }

  const groupedServiceStats: Record<string, Record<string, { count: number; revenue: number }>> = {
    "Cortes e Estética": {},
    Químicas: {},
    "Unhas e Massagem": {},
    Outros: {},
  }

  payments.forEach((p) => {
    const appointment = p.appointment

    if (appointment?.service_ids && appointment.service_ids.length > 0) {
      // Process each service separately
      appointment.service_ids.forEach((serviceId: string) => {
        // Get service price from service_prices jsonb field
        const servicePrice = appointment.service_prices?.[serviceId] || 0

        // Get service details from servicesMap
        const service = servicesMap.get(serviceId)
        const serviceName = service?.name || "Serviço Desconhecido"
        const serviceCategory = service?.category?.toLowerCase() || ""

        let group = "Outros"
        for (const [groupName, keywords] of Object.entries(serviceGroups)) {
          if (
            keywords.some((keyword) => serviceName.toLowerCase().includes(keyword) || serviceCategory.includes(keyword))
          ) {
            group = groupName
            break
          }
        }

        if (!groupedServiceStats[group][serviceName]) {
          groupedServiceStats[group][serviceName] = { count: 0, revenue: 0 }
        }
        groupedServiceStats[group][serviceName].count++
        groupedServiceStats[group][serviceName].revenue += Number(servicePrice)
      })
    } else {
      // Legacy single service appointment
      const serviceName = appointment?.service?.name || "Desconhecido"
      const serviceCategory = appointment?.service?.category?.toLowerCase() || ""

      let group = "Outros"
      for (const [groupName, keywords] of Object.entries(serviceGroups)) {
        if (
          keywords.some((keyword) => serviceName.toLowerCase().includes(keyword) || serviceCategory.includes(keyword))
        ) {
          group = groupName
          break
        }
      }

      if (!groupedServiceStats[group][serviceName]) {
        groupedServiceStats[group][serviceName] = { count: 0, revenue: 0 }
      }
      groupedServiceStats[group][serviceName].count++
      groupedServiceStats[group][serviceName].revenue += Number(p.amount)
    }
  })

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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-gold" />
                Métodos de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(paymentMethodStats).map(([method, stats]) => (
                  <div key={method} className="p-4 bg-card/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {method === "pix"
                        ? "PIX"
                        : method === "dinheiro"
                          ? "Dinheiro"
                          : method === "cartao_credito"
                            ? "Cartão Crédito"
                            : method === "cartao_debito"
                              ? "Cartão Débito"
                              : method}
                    </p>
                    <p className="text-2xl font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.count} transações</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5 text-gold" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {pendingRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Object.entries(groupedServiceStats).map(([groupName, services]) => {
            const groupRevenue = Object.values(services).reduce((sum, s) => sum + s.revenue, 0)
            const groupCount = Object.values(services).reduce((sum, s) => sum + s.count, 0)

            if (groupCount === 0) return null

            return (
              <Card key={groupName} className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Award className="h-5 w-5 text-gold" />
                    {groupName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gold">R$ {groupRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{groupCount} serviços</p>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(services)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .slice(0, 3)
                      .map(([serviceName, stats]) => (
                        <div key={serviceName} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">{serviceName}</span>
                          <span className="text-foreground font-medium">R$ {stats.revenue.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Histórico de Serviços Concluídos</h2>
          <div className="grid gap-4">
            {filteredPayments && filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {payment.client_type === "sporadic"
                            ? payment.sporadic_client_name
                            : payment.client?.full_name || "Cliente não identificado"}
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
                        {payment.pay_later && payment.payment_status !== "paid" && (
                          <p className="text-xs text-yellow-500 mt-1 italic">⚠ Marcado como "pagar depois"</p>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-lg font-bold text-gold">R$ {Number(payment.amount).toFixed(2)}</p>
                          {payment.custom_price &&
                            payment.original_price &&
                            Number(payment.custom_price) !== Number(payment.original_price) && (
                              <div className="text-xs mt-1 space-y-0.5">
                                <p className="text-muted-foreground">
                                  Original:{" "}
                                  <span className="line-through">R$ {Number(payment.original_price).toFixed(2)}</span>
                                </p>
                                <p
                                  className={
                                    Number(payment.custom_price) > Number(payment.original_price)
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }
                                >
                                  {Number(payment.custom_price) > Number(payment.original_price) ? "↑" : "↓"} R${" "}
                                  {Math.abs(Number(payment.custom_price) - Number(payment.original_price)).toFixed(2)}
                                </p>
                              </div>
                            )}
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                              payment.payment_status === "paid"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {payment.payment_status === "paid" ? "Pago" : "Concluído"}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{payment.payment_method}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {payment.payment_status !== "paid" && (
                            <Button
                              size="sm"
                              onClick={() => openPaymentMethodDialog(payment.id)}
                              className="bg-green-600 hover:bg-green-700 text-white h-8"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marcar como Pago
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevertToConfirmed(payment.id)}
                            className="border-blue-500 text-blue-500 hover:bg-blue-50 h-8"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reverter
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhum serviço concluído no período selecionado</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Forma de Pagamento</DialogTitle>
            <DialogDescription>Selecione como o cliente realizou o pagamento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPaymentMethod("pix")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedPaymentMethod === "pix" ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-medium">PIX</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod("dinheiro")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedPaymentMethod === "dinheiro" ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                }`}
              >
                <DollarSign className="h-6 w-6" />
                <span className="font-medium">Dinheiro</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod("cartao_credito")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedPaymentMethod === "cartao_credito"
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50"
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-medium">Cartão Crédito</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod("cartao_debito")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedPaymentMethod === "cartao_debito"
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50"
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-medium">Cartão Débito</span>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentMethodDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedAppointmentId && handleMarkAsPaid(selectedAppointmentId)}
              disabled={!selectedPaymentMethod}
              className="bg-gold hover:bg-gold/90"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
