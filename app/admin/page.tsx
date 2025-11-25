import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  TrendingUp,
  Settings,
  BookOpen,
  MessageSquare,
  Package,
} from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
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

  // Get statistics
  const { data: appointments } = await supabase.from("appointments").select("*, service:services(*)")

  const { data: clients } = await supabase.from("profiles").select("*").eq("user_level", 10)

  const { data: staff } = await supabase.from("profiles").select("*").gte("user_level", 20)

  const { data: services } = await supabase.from("services").select("*")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayAppointments = appointments?.filter((apt) => {
    const aptDate = new Date(apt.appointment_date)
    aptDate.setHours(0, 0, 0, 0)
    return aptDate.getTime() === today.getTime()
  })

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const monthlyRevenue = appointments
    ?.filter((apt) => new Date(apt.appointment_date) >= thisMonth && apt.status === "completed")
    .reduce((sum, apt) => sum + Number(apt.service?.price || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do negócio e gerenciamento</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/admin/agenda">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <Calendar className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Agenda</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ver calendário</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/clientes">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <Users className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Clientes</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerenciar clientes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/financeiro">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <TrendingUp className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Financeiro</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ver ganhos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/servicos">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <Briefcase className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Serviços</h3>
                  <p className="text-sm text-muted-foreground mt-1">Meus serviços</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/assinaturas">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <Package className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Assinaturas</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerenciar planos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/cursos">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <BookOpen className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Cursos</h3>
                  <p className="text-sm text-muted-foreground mt-1">Treinamentos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/relatorios">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <TrendingUp className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Relatórios</h3>
                  <p className="text-sm text-muted-foreground mt-1">Análises</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/solicitacoes">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <MessageSquare className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Solicitações</h3>
                  <p className="text-sm text-muted-foreground mt-1">Pedidos</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/chat-ia">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <MessageSquare className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Chat IA</h3>
                  <p className="text-sm text-muted-foreground mt-1">Assistente</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/usuarios">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <Users className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Usuários</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerenciar</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/perfil">
              <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 bg-gold/10 rounded-lg mb-3">
                    <Users className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-semibold text-foreground">Perfil</h3>
                  <p className="text-sm text-muted-foreground mt-1">Editar perfil</p>
                </CardContent>
              </Card>
            </Link>

            {profile.user_level >= 40 && (
              <Link href="/admin/configuracoes">
                <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-gold/10 rounded-lg mb-3">
                      <Settings className="h-8 w-8 text-gold" />
                    </div>
                    <h3 className="font-semibold text-foreground">Configurações</h3>
                    <p className="text-sm text-muted-foreground mt-1">Sistema</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{todayAppointments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{clients?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {monthlyRevenue?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{staff?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Painel do Administrador</h2>
          <div className="grid md:grid-cols-4 gap-6">
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
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{clients?.length || 0}</div>
                <p className="text-xs text-muted-foreground">total</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff</CardTitle>
                <Users className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{staff?.length || 0}</div>
                <p className="text-xs text-muted-foreground">profissionais</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita</CardTitle>
                <DollarSign className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {monthlyRevenue?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">este mês</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Agendamentos Recentes</h2>
          {appointments && appointments.length > 0 ? (
            <div className="grid gap-4">
              {appointments.slice(0, 5).map((appointment) => (
                <Card key={appointment.id} className="border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{appointment.service?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Data:{" "}
                          {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === "completed"
                              ? "bg-green-500/10 text-green-500"
                              : appointment.status === "confirmed"
                                ? "bg-blue-500/10 text-blue-500"
                                : appointment.status === "cancelled"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {appointment.status === "completed"
                            ? "Concluído"
                            : appointment.status === "confirmed"
                              ? "Confirmado"
                              : appointment.status === "cancelled"
                                ? "Cancelado"
                                : "Pendente"}
                        </span>
                        <p className="text-lg font-bold text-gold mt-2">R$ {appointment.service?.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhum agendamento registrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
