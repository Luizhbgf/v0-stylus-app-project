import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

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
      client:client_id(full_name, phone)
    `,
    )
    .eq("staff_id", user.id)
    .gte("appointment_date", today.toISOString())
    .lte("appointment_date", thirtyDaysLater.toISOString())
    .order("appointment_date", { ascending: true })

  // Group appointments by date
  const appointmentsByDate = appointments?.reduce(
    (acc, apt) => {
      const date = new Date(apt.appointment_date).toLocaleDateString("pt-BR")
      if (!acc[date]) acc[date] = []
      acc[date].push(apt)
      return acc
    },
    {} as Record<string, typeof appointments>,
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Agenda</h1>
          <p className="text-muted-foreground">Visualize seus agendamentos dos próximos 30 dias</p>
        </div>

        <div className="space-y-6">
          {appointmentsByDate && Object.keys(appointmentsByDate).length > 0 ? (
            Object.entries(appointmentsByDate).map(([date, apts]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" />
                  {date}
                </h2>
                <div className="grid gap-4">
                  {apts.map((apt) => (
                    <Card key={apt.id} className="border-gold/20">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{apt.service?.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">Cliente: {apt.client?.full_name}</p>
                            <p className="text-sm text-muted-foreground mb-1">Telefone: {apt.client?.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              Horário:{" "}
                              {new Date(apt.appointment_date).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
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
                            <p className="text-sm text-muted-foreground mt-2">R$ {apt.service?.price}</p>
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
