"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, Filter, Trash2, CheckCircle, CreditCard, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function StaffFinanceiro() {
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (!profileData || profileData.user_level < 20) {
      router.push("/cliente")
      return
    }
    setProfile(profileData)

    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        status,
        payment_status,
        staff_id,
        custom_price,
        original_price,
        service:services(name, price, category),
        client:profiles!client_id(full_name),
        sporadic_client_name,
        client_type,
        pay_later,
        service_ids,
        service_names,
        service_prices,
        service_categories
      `,
      )
      .eq("staff_id", user.id)
      .order("appointment_date", { ascending: false })

    setAppointments(appointmentsData || [])

    const appointmentIds = appointmentsData?.map((apt) => apt.id) || []
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("appointment_id, payment_method, status")
      .in("appointment_id", appointmentIds)

    setPayments(paymentsData || [])
  }

  const handleFilter = () => {
    // A filtragem acontece automaticamente quando startDate ou endDate mudam
  }

  const handleClearFilter = () => {
    setStartDate("")
    setEndDate("")
  }

  const handleDeleteCompleted = async (appointmentId: string) => {
    if (profile.user_level < 30) {
      toast.error("Apenas administradores podem excluir registros concluídos")
      return
    }

    if (!confirm("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase.from("appointments").delete().eq("id", appointmentId)

      if (error) throw error

      toast.success("Registro excluído com sucesso")
      loadData()
    } catch (error) {
      console.error("Erro ao excluir registro:", error)
      toast.error("Erro ao excluir registro")
    }
  }

  const openPaymentMethodDialog = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
    setSelectedPaymentMethod("")
    setShowPaymentMethodDialog(true)
  }

  const handleMarkAsPaid = async (appointmentId: string) => {
    if (!selectedPaymentMethod) {
      toast.error("Selecione uma forma de pagamento")
      return
    }

    try {
      const { error: aptError } = await supabase
        .from("appointments")
        .update({
          payment_status: "paid",
          pay_later: false,
        })
        .eq("id", appointmentId)

      if (aptError) throw aptError

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

      toast.success("Pagamento marcado como pago!")
      setShowPaymentMethodDialog(false)
      setSelectedAppointmentId(null)
      setSelectedPaymentMethod("")
      loadData()
    } catch (error) {
      console.error("Erro ao marcar como pago:", error)
      toast.error("Erro ao atualizar pagamento")
    }
  }

  const paymentMap = new Map(payments?.map((p) => [p.appointment_id, p.payment_method]) || [])

  const earnings: any[] = []

  appointments?.forEach((apt) => {
    if (apt.status === "cancelled") return

    const isPaid = apt.payment_status === "paid"
    const isPayLater = apt.pay_later === true

    const clientName =
      apt.client_type === "sporadic" ? apt.sporadic_client_name : apt.client?.full_name || "Cliente não identificado"

    const amount = apt.custom_price || apt.service?.price || 0
    const originalPrice = apt.original_price || apt.service?.price || 0

    earnings.push({
      id: apt.id,
      type: "appointment",
      amount: amount,
      original_price: originalPrice,
      custom_price: apt.custom_price,
      payment_date: apt.appointment_date,
      payment_method: paymentMap.get(apt.id) || "Não informado",
      status: isPaid ? "paid" : "pending",
      isPayLater: isPayLater,
      service_name: apt.service?.name || "Serviço não especificado",
      service_category: apt.service?.category || "",
      client_name: clientName,
      notes: `${apt.service?.name || "Serviço"} - ${clientName}`,
      service_ids: apt.service_ids,
      service_names: apt.service_names,
      service_prices: apt.service_prices,
      service_categories: apt.service_categories,
    })
  })

  const filteredEarnings = earnings.filter((e) => {
    const earningDate = new Date(e.payment_date)
    if (startDate && earningDate < new Date(startDate)) return false
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      if (earningDate > endDateTime) return false
    }
    return true
  })

  filteredEarnings.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())

  const totalPaid = filteredEarnings.filter((e) => e.status === "paid").reduce((sum, e) => sum + Number(e.amount), 0)
  const totalPending = filteredEarnings
    .filter((e) => e.status === "pending" && !e.isPayLater)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyEarnings = filteredEarnings
    .filter((e) => new Date(e.payment_date) >= firstDayOfMonth && e.status === "paid")
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const paymentMethodStats: Record<string, { count: number; revenue: number }> = {}
  filteredEarnings.forEach((e) => {
    if (e.status === "paid" && e.payment_method && e.payment_method !== "Não informado") {
      const method = e.payment_method
      if (!paymentMethodStats[method]) {
        paymentMethodStats[method] = { count: 0, revenue: 0 }
      }
      paymentMethodStats[method].count++
      paymentMethodStats[method].revenue += Number(e.amount)
    }
  })

  const serviceGroups = {
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

  filteredEarnings.forEach((e) => {
    if (e.status === "paid") {
      if (e.service_ids && e.service_ids.length > 0) {
        // Process each service separately
        e.service_ids.forEach((serviceId: string, index: number) => {
          const servicePrice = e.service_prices?.[serviceId] || e.amount / e.service_ids.length
          const serviceName = e.service_names?.[index] || `Serviço ${index + 1}`
          const serviceCategory = e.service_categories?.[index]?.toLowerCase() || ""

          let group = "Outros"
          for (const [groupName, keywords] of Object.entries(serviceGroups)) {
            if (
              keywords.some(
                (keyword) => serviceName.toLowerCase().includes(keyword) || serviceCategory.includes(keyword),
              )
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
        // Legacy single service earning
        const serviceName = e.service_name || "Desconhecido"
        const serviceCategory = e.service_category?.toLowerCase() || ""

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
        groupedServiceStats[group][serviceName].revenue += Number(e.amount)
      }
    }
  })

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe seus ganhos e pagamentos</p>
        </div>

        <Card className="border-gold/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrar por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="start-date">Data Início</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="end-date">Data Fim</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="bg-gold hover:bg-gold/90">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                {(startDate || endDate) && (
                  <Button variant="outline" onClick={handleClearFilter}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                <DollarSign className="h-4 w-4 text-gold" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPaid.toFixed(2)}</div>
              {(startDate || endDate) && <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>}
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <Calendar className="h-4 w-4 text-gold" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPending.toFixed(2)}</div>
              {(startDate || endDate) && <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>}
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-gold" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {monthlyEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(paymentMethodStats).length > 0 && (
          <Card className="border-gold/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gold" />
                Seus Recebimentos por Método
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <p className="text-xl font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.count} pagamentos</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Histórico de Pagamentos</h2>
          <div className="grid gap-4">
            {filteredEarnings && filteredEarnings.length > 0 ? (
              filteredEarnings.map((earning) => (
                <Card key={`${earning.type}-${earning.id}`} className="border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-semibold text-foreground mb-1">
                          R$ {Number(earning.amount).toFixed(2)}
                        </p>
                        {earning.custom_price &&
                          earning.original_price &&
                          Number(earning.custom_price) !== Number(earning.original_price) && (
                            <div className="text-xs mt-1 space-y-0.5">
                              <p className="text-muted-foreground">
                                Original:{" "}
                                <span className="line-through">R$ {Number(earning.original_price).toFixed(2)}</span>
                              </p>
                              <p
                                className={
                                  Number(earning.custom_price) > Number(earning.original_price)
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {Number(earning.custom_price) > Number(earning.original_price) ? "↑" : "↓"} R${" "}
                                {Math.abs(Number(earning.custom_price) - Number(earning.original_price)).toFixed(2)}
                              </p>
                            </div>
                          )}
                        <p className="text-sm text-muted-foreground mb-1">
                          Data: {new Date(earning.payment_date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">Cliente: {earning.client_name}</p>
                        <p className="text-sm text-muted-foreground mb-1">Serviço: {earning.service_name}</p>
                        {earning.payment_method && earning.payment_method !== "Não informado" && (
                          <p className="text-sm text-muted-foreground">
                            Método: {earning.payment_method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                        )}
                        {earning.isPayLater && (
                          <p className="text-xs text-yellow-500 mt-1 italic">⚠ Marcado como "pagar depois"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            earning.status === "paid"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {earning.status === "paid" ? "Pago" : "Pendente"}
                        </span>
                        {earning.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentMethodDialog(earning.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Pago
                          </Button>
                        )}
                        {profile.user_level >= 30 && earning.status === "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCompleted(earning.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gold/20">
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-gold mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {startDate || endDate
                      ? "Nenhum pagamento encontrado no período selecionado"
                      : "Nenhum pagamento registrado"}
                  </p>
                </CardContent>
              </Card>
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
              Voltar
            </Button>
            <Button
              onClick={() => selectedAppointmentId && handleMarkAsPaid(selectedAppointmentId)}
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
