"use client"

import { useState, useEffect } from "react"
import { createClient as createClientClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Plus, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function StaffAgenda() {
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const router = useRouter()
  const supabase = createClientClient()

  const getAppointmentColor = (appointment: any) => {
    if (appointment.client?.subscriptions?.[0]?.status === "active") {
      return "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
    }
    if (appointment.payment_status === "overdue") {
      return "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300"
    }
    if (appointment.client_type === "sporadic") {
      return "bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300"
    }
    return "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300"
  }

  const getClientTypeLabel = (appointment: any) => {
    if (appointment.client?.subscriptions?.[0]?.status === "active") return "Assinante"
    if (appointment.payment_status === "overdue") return "Devedor"
    if (appointment.client_type === "sporadic") return "Esporádico"
    return "Padrão"
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
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
    await loadAppointments(user.id)
  }

  const loadAppointments = async (staffId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(today.getDate() + 30)

    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        service:services!service_id(*),
        client:profiles!client_id(
          id,
          full_name,
          phone,
          subscriptions!client_id(status)
        )
      `,
      )
      .eq("staff_id", staffId)
      .neq("status", "cancelled")

    if (startDate) {
      query = query.gte("appointment_date", new Date(startDate).toISOString())
    } else {
      query = query.gte("appointment_date", today.toISOString())
    }

    if (endDate) {
      query = query.lte("appointment_date", new Date(endDate).toISOString())
    } else {
      query = query.lte("appointment_date", thirtyDaysLater.toISOString())
    }

    const { data, error } = await query.order("appointment_date", { ascending: true })

    if (error) {
      console.error("Error loading appointments:", error)
      setIsLoading(false)
      return
    }

    setAppointments(data || [])
    setIsLoading(false)
  }

  const handleFilterChange = () => {
    if (profile) {
      loadAppointments(profile.id)
    }
  }

  const appointmentsByDate: Record<string, any[]> = {}
  appointments.forEach((apt) => {
    try {
      const date = new Date(apt.appointment_date).toLocaleDateString("pt-BR")
      if (!appointmentsByDate[date]) appointmentsByDate[date] = []
      appointmentsByDate[date].push({
        ...apt,
        type: "appointment",
        client: apt.client
          ? {
              ...apt.client,
              subscription_status: apt.client.subscriptions?.[0]?.status || null,
            }
          : null,
      })
    } catch (error) {
      console.error("Error processing appointment:", error)
    }
  })

  Object.keys(appointmentsByDate).forEach((date) => {
    appointmentsByDate[date].sort(
      (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime(),
    )
  })

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
            <p className="text-muted-foreground">Gerencie seus agendamentos</p>
          </div>
          <Link href="/staff/agenda/adicionar">
            <Button className="bg-gold hover:bg-gold/90 text-black w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Agendamento
            </Button>
          </Link>
        </div>

        <Card className="mb-6 border-gold/20">
          <CardHeader>
            <CardTitle className="text-lg">Filtrar por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleFilterChange} className="w-full bg-gold hover:bg-gold/90 text-black">
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-blue-500">Carregando dados...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-500">Aguarde enquanto carregamos seus agendamentos.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && appointments && Object.keys(appointmentsByDate).length > 0 ? (
          Object.entries(appointmentsByDate).map(([date, items]) => (
            <div key={date} className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                {date}
              </h2>
              <div className="grid gap-4">
                {items.map((item) => (
                  <Card key={item.id} className={`border ${getAppointmentColor(item)}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {item.event_title || item.service?.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getClientTypeLabel(item)}
                            </Badge>
                          </div>
                          {item.client_type === "sporadic" ? (
                            <>
                              <p className="text-sm text-muted-foreground mb-1">
                                Cliente: {item.sporadic_client_name}
                              </p>
                              <p className="text-sm text-muted-foreground mb-1">
                                Telefone: {item.sporadic_client_phone}
                              </p>
                            </>
                          ) : item.client ? (
                            <>
                              <p className="text-sm text-muted-foreground mb-1">Cliente: {item.client.full_name}</p>
                              <p className="text-sm text-muted-foreground mb-1">Telefone: {item.client.phone}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-1">Evento sem cliente</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(item.appointment_date).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {item.notes && <p className="text-sm text-muted-foreground mt-2">Obs: {item.notes}</p>}
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : item.status === "confirmed"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : item.status === "cancelled"
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {item.status === "completed"
                              ? "Concluído"
                              : item.status === "confirmed"
                                ? "Confirmado"
                                : item.status === "cancelled"
                                  ? "Cancelado"
                                  : "Pendente"}
                          </span>
                          {item.service?.price && (
                            <p className="text-sm text-muted-foreground mt-2">R$ {item.service.price}</p>
                          )}
                          <Link href={`/staff/agenda/${item.id}`}>
                            <Button size="sm" variant="outline" className="mt-2 w-full sm:w-auto bg-transparent">
                              Gerenciar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          !isLoading && (
            <Card className="border-gold/20">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gold mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento encontrado no período selecionado</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
