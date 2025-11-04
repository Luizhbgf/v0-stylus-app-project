import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Plus, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

function getAppointmentColor(appointment: any) {
  // Check if client has active subscription
  if (appointment.client?.subscription_status === "active") {
    return "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
  }

  // Check payment status - overdue (debtor)
  if (appointment.payment_status === "overdue") {
    return "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300"
  }

  // Sporadic client (no registration)
  if (appointment.client_type === "sporadic") {
    return "bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300"
  }

  // Standard client
  return "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300"
}

function getClientTypeLabel(appointment: any) {
  if (appointment.client?.subscription_status === "active") return "Assinante"
  if (appointment.payment_status === "overdue") return "Devedor"
  if (appointment.client_type === "sporadic") return "Esporádico"
  return "Padrão"
}

export default async function StaffAgenda() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  // Get all appointments for the next 30 days
  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      client:client_id(
        id,
        full_name,
        phone,
        subscriptions(status)
      )
    `,
    )
    .eq("staff_id", user.id)
    .gte("appointment_date", today.toISOString())
    .lte("appointment_date", thirtyDaysLater.toISOString())
    .order("appointment_date", { ascending: true })

  const { data: pendingRequests } = await supabase
    .from("appointment_requests")
    .select(
      `
      *,
      client:client_id(full_name, phone),
      service:services(name, price, duration)
    `,
    )
    .eq("staff_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const startDate = today.toISOString().split("T")[0] // YYYY-MM-DD format
  const endDate = thirtyDaysLater.toISOString().split("T")[0] // YYYY-MM-DD format

  const { data: approvedRequests } = await supabase
    .from("appointment_requests")
    .select(
      `
      *,
      client:client_id(full_name, phone),
      service:services(name, price, duration)
    `,
    )
    .eq("staff_id", user.id)
    .in("status", ["approved", "modified"])
    .gte("preferred_date", startDate)
    .lte("preferred_date", endDate)
    .order("preferred_date", { ascending: true })

  // Group appointments by date
  const appointmentsByDate = appointments?.reduce(
    (acc, apt) => {
      const date = new Date(apt.appointment_date).toLocaleDateString("pt-BR")
      if (!acc[date]) acc[date] = []
      acc[date].push({
        ...apt,
        type: "appointment",
        client: apt.client
          ? {
              ...apt.client,
              subscription_status: apt.client.subscriptions?.[0]?.status || null,
            }
          : null,
      })
      return acc
    },
    {} as Record<string, any[]>,
  )

  approvedRequests?.forEach((req) => {
    if (!req.preferred_date || !req.preferred_time) return

    const dateTimeStr = `${req.preferred_date}T${req.preferred_time}`
    const date = new Date(dateTimeStr).toLocaleDateString("pt-BR")

    if (!appointmentsByDate[date]) appointmentsByDate[date] = []
    appointmentsByDate[date].push({
      ...req,
      type: "approved_request",
      appointment_date: dateTimeStr,
    })
  })

  // Sort each day's items by time
  Object.keys(appointmentsByDate || {}).forEach((date) => {
    appointmentsByDate[date].sort(
      (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime(),
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
            <p className="text-muted-foreground">Gerencie seus agendamentos dos próximos 30 dias</p>
          </div>
          <Link href="/staff/agenda/adicionar">
            <Button className="bg-gold hover:bg-gold/90 text-black w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Agendamento
            </Button>
          </Link>
        </div>

        {pendingRequests && pendingRequests.length > 0 && (
          <Card className="mb-6 border-gold/20 bg-gold/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-gold" />
                Solicitações Pendentes ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-background rounded-lg border border-gold/20"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{request.service?.name}</h3>
                    <p className="text-sm text-muted-foreground">Cliente: {request.client?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Data solicitada:{" "}
                      {request.preferred_date && request.preferred_time
                        ? `${new Date(request.preferred_date + "T00:00:00").toLocaleDateString("pt-BR")} às ${request.preferred_time.substring(0, 5)}`
                        : "Data não especificada"}
                    </p>
                    {request.notes && <p className="text-sm text-muted-foreground mt-1">Obs: {request.notes}</p>}
                  </div>
                  <Link href={`/staff/agenda/solicitacoes/${request.id}`}>
                    <Button size="sm" variant="outline" className="border-gold/20 w-full sm:w-auto bg-transparent">
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-gold/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/50" />
                <span className="text-muted-foreground">Assinante</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/50" />
                <span className="text-muted-foreground">Cliente Padrão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/50" />
                <span className="text-muted-foreground">Cliente Esporádico</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/50" />
                <span className="text-muted-foreground">Pagamento Pendente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {appointmentsByDate && Object.keys(appointmentsByDate).length > 0 ? (
            Object.entries(appointmentsByDate).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" />
                  {date}
                </h2>
                <div className="grid gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className={`border ${item.type === "approved_request" ? "border-gold/50 bg-gold/5" : getAppointmentColor(item)}`}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {item.type === "approved_request"
                                  ? item.service?.name
                                  : item.event_title || item.service?.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {item.type === "approved_request" ? "Solicitação Aprovada" : getClientTypeLabel(item)}
                              </Badge>
                            </div>
                            {item.type === "approved_request" ? (
                              <>
                                <p className="text-sm text-muted-foreground mb-1">Cliente: {item.client?.full_name}</p>
                                <p className="text-sm text-muted-foreground mb-1">Telefone: {item.client?.phone}</p>
                              </>
                            ) : item.client_type === "sporadic" ? (
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
                            {item.staff_notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Observações do profissional: {item.staff_notes}
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            {item.type === "approved_request" ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold">
                                Aprovada
                              </span>
                            ) : (
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
                            )}
                            {item.service?.price && (
                              <p className="text-sm text-muted-foreground mt-2">R$ {item.service.price}</p>
                            )}
                            {item.type === "appointment" && (
                              <Link href={`/staff/agenda/${item.id}`}>
                                <Button size="sm" variant="outline" className="mt-2 w-full sm:w-auto bg-transparent">
                                  Gerenciar
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gold mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento nos próximos 30 dias</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
