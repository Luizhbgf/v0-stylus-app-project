import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default async function ClienteAgenda() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) redirect("/auth/login")

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
      staff:staff_id(
        id,
        full_name,
        phone
      )
    `,
    )
    .eq("client_id", user.id)
    .gte("appointment_date", today.toISOString())
    .lte("appointment_date", thirtyDaysLater.toISOString())
    .order("appointment_date", { ascending: true })

  const itemsByDate: Record<string, any[]> = {}

  appointments?.forEach((apt) => {
    const date = new Date(apt.appointment_date).toLocaleDateString("pt-BR")
    if (!itemsByDate[date]) itemsByDate[date] = []
    itemsByDate[date].push({
      ...apt,
      type: "appointment",
    })
  })

  // Sort each day's items by time
  Object.keys(itemsByDate).forEach((date) => {
    itemsByDate[date].sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
          <p className="text-muted-foreground">Seus agendamentos dos próximos 30 dias</p>
        </div>

        <div className="space-y-6">
          {itemsByDate && Object.keys(itemsByDate).length > 0 ? (
            Object.entries(itemsByDate).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" />
                  {date}
                </h2>
                <div className="grid gap-4">
                  {items.map((item) => (
                    <Card key={item.id} className="border-gold/20">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {item.event_title || item.service?.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                Agendamento
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Profissional: {item.staff?.full_name || "N/A"}
                            </p>
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
