"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function StaffFinanceiro() {
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
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
        service:services(name, price),
        client:profiles!client_id(full_name),
        sporadic_client_name,
        client_type
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

  const paymentMap = new Map(payments?.map((p) => [p.appointment_id, p.payment_method]) || [])

  const earnings: any[] = []

  appointments?.forEach((apt) => {
    if (apt.status === "cancelled") return

    const isPaid = apt.payment_status === "paid" || apt.status === "completed"

    const clientName =
      apt.client_type === "sporadic" ? apt.sporadic_client_name : apt.client?.full_name || "Cliente não identificado"

    const amount = apt.custom_price || apt.service?.price || 0

    earnings.push({
      id: apt.id,
      type: "appointment",
      amount: amount,
      payment_date: apt.appointment_date,
      payment_method: paymentMap.get(apt.id) || "Não informado",
      status: isPaid ? "paid" : "pending",
      service_name: apt.service?.name || "Serviço não especificado",
      client_name: clientName,
      notes: `${apt.service?.name || "Serviço"} - ${clientName}`,
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
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyEarnings = filteredEarnings
    .filter((e) => new Date(e.payment_date) >= firstDayOfMonth && e.status === "paid")
    .reduce((sum, e) => sum + Number(e.amount), 0)

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPaid.toFixed(2)}</div>
              {(startDate || endDate) && <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>}
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPending.toFixed(2)}</div>
              {(startDate || endDate) && <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>}
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {monthlyEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
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
                        <p className="text-sm text-muted-foreground mb-1">
                          Data: {new Date(earning.payment_date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">Cliente: {earning.client_name}</p>
                        <p className="text-sm text-muted-foreground mb-1">Serviço: {earning.service_name}</p>
                        {earning.payment_method && (
                          <p className="text-sm text-muted-foreground">Método: {earning.payment_method}</p>
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
    </div>
  )
}
