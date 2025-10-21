import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User } from "lucide-react"
import { format, addDays, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function AdminAgendaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 30) {
    redirect("/cliente")
  }

  // Get all appointments from all staff with staff and client info
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      staff:staff_id(id, full_name),
      client:client_id(id, full_name)
    `,
    )
    .order("appointment_date", { ascending: true })

  // Group appointments by date
  const appointmentsByDate: Record<string, any[]> = {}
  const today = startOfDay(new Date())

  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i)
    const dateKey = format(date, "yyyy-MM-dd")
    appointmentsByDate[dateKey] = []
  }

  appointments?.forEach((apt) => {
    const dateKey = format(new Date(apt.appointment_date), "yyyy-MM-dd")
    if (appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey].push(apt)
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Agenda Geral</h1>
          <p className="text-muted-foreground">Visualize todos os agendamentos de todos os profissionais</p>
        </div>

        <div className="space-y-6">
          {Object.entries(appointmentsByDate).map(([dateKey, dayAppointments]) => {
            const date = new Date(dateKey + "T12:00:00")
            const hasAppointments = dayAppointments.length > 0

            return (
              <Card key={dateKey} className={`border-gold/20 ${!hasAppointments && "opacity-50"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5 text-gold" />
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {dayAppointments.length} agendamento(s)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasAppointments ? (
                    <div className="space-y-3">
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-gold/10"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-gold/10 rounded-lg">
                              <Clock className="h-5 w-5 text-gold mb-1" />
                              <span className="text-xs font-medium text-foreground">
                                {format(new Date(apt.appointment_date), "HH:mm")}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{apt.service?.name}</h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Cliente: {apt.client?.full_name || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Profissional: {apt.staff?.full_name || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                apt.status === "completed"
                                  ? "bg-green-500/10 text-green-500"
                                  : apt.status === "confirmed"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : apt.status === "cancelled"
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-yellow-500/10 text-yellow-500"
                              }`}
                            >
                              {apt.status === "completed"
                                ? "Concluído"
                                : apt.status === "confirmed"
                                  ? "Confirmado"
                                  : apt.status === "cancelled"
                                    ? "Cancelado"
                                    : "Pendente"}
                            </span>
                            <p className="text-lg font-bold text-gold mt-2">R$ {apt.service?.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Nenhum agendamento para este dia</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
