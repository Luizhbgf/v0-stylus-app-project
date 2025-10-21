import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Bell, Heart, History, CreditCard, Package, FileText } from "lucide-react"
import Link from "next/link"

export default async function ClienteDashboard() {
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

  // Get user appointments
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
    .order("appointment_date", { ascending: true })

  const { data: pendingRequests } = await supabase
    .from("appointment_requests")
    .select(`
      *,
      service:services(*)
    `)
    .eq("client_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const { count: favoritesCount } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id)

  const { count: subscriptionsCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("status", "active")

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select(`
      *,
      plan:subscription_plans(*,
        staff:staff_id(full_name)
      )
    `)
    .eq("client_id", user.id)
    .eq("status", "active")
    .single()

  const upcomingAppointments = appointments?.filter(
    (apt) => new Date(apt.appointment_date) >= new Date() && apt.status !== "cancelled",
  )

  const pastAppointments = appointments?.filter(
    (apt) => new Date(apt.appointment_date) < new Date() || apt.status === "completed",
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Olá, {profile.full_name || "Cliente"}!</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu painel de cliente</p>
        </div>

        {activeSubscription && (
          <Card className="border-gold/20 bg-gold/5 mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Plano Ativo: {activeSubscription.plan?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Profissional: {activeSubscription.plan?.staff?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {activeSubscription.plan?.service_type === "haircut" ? "Corte" : "Corte + Barba"} -{" "}
                    {activeSubscription.plan?.frequency_per_week}x por semana
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança:{" "}
                    {activeSubscription.next_billing_date
                      ? new Date(activeSubscription.next_billing_date).toLocaleDateString("pt-BR")
                      : "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gold">R$ {Number(activeSubscription.price).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">/mês</div>
                  <Button asChild variant="outline" size="sm" className="mt-2 border-gold/20 bg-transparent">
                    <Link href="/cliente/assinaturas">Gerenciar</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Link href="/cliente/favoritos">
            <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
                <Heart className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{favoritesCount || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cliente/historico">
            <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Histórico</CardTitle>
                <History className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pastAppointments?.length || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cliente/pagamentos">
            <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
                <CreditCard className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Ver todos</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cliente/assinaturas">
            <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
                <Package className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{subscriptionsCount || 0}</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cliente/solicitacoes">
            <Card className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitações</CardTitle>
                <FileText className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pendingRequests?.length || 0}</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{upcomingAppointments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
              <Bell className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingRequests?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Histórico Total</CardTitle>
              <Clock className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{appointments?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfil</CardTitle>
              <User className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{profile.email}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Button asChild className="bg-gold hover:bg-gold/90 text-black" size="lg">
            <Link href="/agendar">Nova Solicitação de Agendamento</Link>
          </Button>
        </div>

        <div className="space-y-6">
          {pendingRequests && pendingRequests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Solicitações Aguardando Aprovação</h2>
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border-yellow-500/20 bg-yellow-500/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{request.service?.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            Data preferida: {new Date(request.preferred_date).toLocaleDateString("pt-BR")}
                            {request.preferred_time && ` às ${request.preferred_time}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Solicitado em: {new Date(request.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          {request.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Observações:</strong> {request.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                            Aguardando Aprovação
                          </span>
                          <p className="text-lg font-bold text-gold mt-2">R$ {request.service?.price}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Próximos Agendamentos</h2>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="grid gap-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="border-gold/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{appointment.service?.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            Data:{" "}
                            {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Profissional: {appointment.staff?.full_name || "A definir"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              appointment.status === "confirmed"
                                ? "bg-green-500/10 text-green-500"
                                : appointment.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-gray-500/10 text-gray-500"
                            }`}
                          >
                            {appointment.status === "confirmed"
                              ? "Confirmado"
                              : appointment.status === "pending"
                                ? "Pendente"
                                : "Cancelado"}
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
                  <p className="text-muted-foreground">Você não tem agendamentos futuros</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Histórico</h2>
            {pastAppointments && pastAppointments.length > 0 ? (
              <div className="grid gap-4">
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <Card key={appointment.id} className="border-gold/20 opacity-75">
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
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gold">R$ {appointment.service?.price}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gold/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Você ainda não tem histórico de agendamentos</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
