import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Clock, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function HistoricoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 10) {
    redirect("/auth/login")
  }

  // Get all past appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      staff:staff_id(full_name)
    `,
    )
    .eq("client_id", user.id)
    .order("appointment_date", { ascending: false })

  const pastAppointments = appointments?.filter(
    (apt) => new Date(apt.appointment_date) < new Date() || apt.status === "completed" || apt.status === "cancelled",
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/cliente" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Histórico de Agendamentos</h1>
          <p className="text-muted-foreground">Todos os seus agendamentos anteriores</p>
        </div>

        {pastAppointments && pastAppointments.length > 0 ? (
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-gold/20">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">{appointment.service?.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-gold" />
                          {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="h-4 w-4 mr-2 text-gold" />
                          {appointment.staff?.full_name || "Profissional não definido"}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2 text-gold" />
                          {appointment.service?.duration} minutos
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-3">
                          <strong>Observações:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                          appointment.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : appointment.status === "cancelled"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {appointment.status === "completed"
                          ? "Concluído"
                          : appointment.status === "cancelled"
                            ? "Cancelado"
                            : "Pendente"}
                      </span>
                      <div className="flex items-center justify-end text-lg font-bold text-gold">
                        <DollarSign className="h-5 w-5" />
                        {appointment.service?.price}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gold/20">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum histórico ainda</h3>
              <p className="text-muted-foreground">Seus agendamentos concluídos aparecerão aqui</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
