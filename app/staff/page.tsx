import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function StaffDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 20) {
    redirect("/cliente")
  }

  // Get staff appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      client:client_id(full_name, email, phone)
    `,
    )
    .eq("staff_id", user.id)
    .order("appointment_date", { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAppointments = appointments?.filter((apt) => {
    const aptDate = new Date(apt.appointment_date)
    aptDate.setHours(0, 0, 0, 0)
    return aptDate.getTime() === today.getTime() && apt.status !== "cancelled"
  })

  const upcomingAppointments = appointments?.filter(
    (apt) => new Date(apt.appointment_date) >= tomorrow && apt.status !== "cancelled",
  )

  const completedToday = todayAppointments?.filter((apt) => apt.status === "completed").length

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel do Profissional</h1>
          <p className="text-muted-foreground">Olá, {profile.full_name}! Gerencie seus agendamentos</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{todayAppointments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
              <Clock className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{upcomingAppointments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
              <CheckCircle className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completedToday || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{appointments?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Agendamentos de Hoje</h2>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="grid gap-4">
                {todayAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-gold/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{appointment.service?.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">Cliente: {appointment.client?.full_name}</p>
                          <p className="text-sm text-muted-foreground mb-1">
                            Telefone: {appointment.client?.phone || "Não informado"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Horário:{" "}
                            {new Date(appointment.appointment_date).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                              appointment.status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : appointment.status === "confirmed"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {appointment.status === "completed"
                              ? "Concluído"
                              : appointment.status === "confirmed"
                                ? "Confirmado"
                                : "Pendente"}
                          </span>
                          <p className="text-sm text-muted-foreground">{appointment.service?.duration} min</p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            <strong>Observações:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                      {appointment.status !== "completed" && (
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" className="bg-gold hover:bg-gold/90 text-black">
                            Marcar como Concluído
                          </Button>
                          <Button size="sm" variant="outline">
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gold/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Próximos Agendamentos</h2>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="grid gap-4">
                {upcomingAppointments.slice(0, 10).map((appointment) => (
                  <Card key={appointment.id} className="border-gold/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{appointment.service?.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">Cliente: {appointment.client?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Data:{" "}
                            {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                            {appointment.status === "confirmed" ? "Confirmado" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gold/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum agendamento futuro</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
