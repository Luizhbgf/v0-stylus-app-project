import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, CheckCircle, DollarSign, TrendingUp, BookOpen, Briefcase } from "lucide-react"
import Link from "next/link"

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
      client:profiles!client_id(full_name, email, phone)
    `,
    )
    .eq("staff_id", user.id)
    .order("appointment_date", { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayAppointments = appointments?.filter((apt) => {
    const aptDate = new Date(apt.appointment_date)
    aptDate.setHours(0, 0, 0, 0)
    return aptDate.getTime() === today.getTime() && apt.status !== "cancelled"
  })

  const completedToday = todayAppointments?.filter((apt) => apt.status === "completed").length || 0

  const clientIds = new Set()
  appointments?.forEach((apt) => {
    if (apt.status === "cancelled") return
    if (apt.client_type === "sporadic" && apt.sporadic_client_name) {
      clientIds.add(`sporadic-${apt.sporadic_client_name}`)
    } else if (apt.client_id) {
      clientIds.add(apt.client_id)
    }
  })
  const totalClients = clientIds.size

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const monthlyAppointments = appointments?.filter(
    (apt) =>
      new Date(apt.appointment_date) >= firstDayOfMonth &&
      (apt.status === "completed" || apt.payment_status === "paid") &&
      apt.status !== "cancelled",
  )
  const totalEarnings = monthlyAppointments?.reduce((sum, apt) => sum + Number(apt.service?.price || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        {/* Quick Access Menu */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Acesso Rápido</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/staff/agenda">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Calendar className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Agenda</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ver calendário</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/clientes">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Users className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Clientes</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerenciar clientes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/financeiro">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <TrendingUp className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Financeiro</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ver ganhos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/servicos">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Briefcase className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Serviços</h3>
                  <p className="text-sm text-muted-foreground mt-1">Meus serviços</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/assinaturas">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <DollarSign className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Assinaturas</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerenciar planos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/cursos">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <BookOpen className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Cursos</h3>
                  <p className="text-sm text-muted-foreground mt-1">Treinamentos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/perfil">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Users className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-semibold text-foreground">Perfil</h3>
                  <p className="text-sm text-muted-foreground mt-1">Editar perfil</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel do Profissional</h1>
          <p className="text-muted-foreground">Olá, {profile.full_name}! Gerencie seu trabalho</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{todayAppointments?.length || 0}</div>
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completedToday}</div>
              <p className="text-xs text-muted-foreground">hoje</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalClients}</div>
              <p className="text-xs text-muted-foreground">total</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
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
      </div>
    </div>
  )
}
