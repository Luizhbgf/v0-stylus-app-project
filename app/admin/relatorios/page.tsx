import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, DollarSign, Calendar, Award } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function AdminRelatoriosPage() {
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

  // Get all data for reports
  const { data: appointments } = await supabase.from("appointments").select(
    `
      *,
      service:services(*),
      staff:staff_id(full_name)
    `,
  )

  const { data: payments } = await supabase.from("payments").select("*")

  const { data: clients } = await supabase.from("profiles").select("*").eq("user_level", 10)

  const { data: staff } = await supabase.from("profiles").select("*").gte("user_level", 20)

  // Calculate metrics
  const currentMonth = new Date()
  const currentMonthStart = startOfMonth(currentMonth)
  const currentMonthEnd = endOfMonth(currentMonth)

  const monthlyAppointments = appointments?.filter((a) => {
    const date = new Date(a.appointment_date)
    return date >= currentMonthStart && date <= currentMonthEnd
  })

  const completedAppointments = monthlyAppointments?.filter((a) => a.status === "completed").length || 0

  const monthlyRevenue =
    payments
      ?.filter((p) => {
        const date = new Date(p.payment_date)
        return date >= currentMonthStart && date <= currentMonthEnd && p.status === "completed"
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Top performing staff
  const staffPerformance = staff?.map((s) => {
    const staffAppointments = appointments?.filter((a) => a.staff_id === s.id && a.status === "completed") || []
    const revenue = staffAppointments.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)
    return {
      name: s.full_name,
      appointments: staffAppointments.length,
      revenue,
    }
  })

  const topStaff = staffPerformance?.sort((a, b) => b.revenue - a.revenue).slice(0, 5) || []

  // Most popular services
  const serviceStats: Record<string, { count: number; revenue: number }> = {}
  appointments
    ?.filter((a) => a.status === "completed")
    .forEach((a) => {
      const serviceName = a.service?.name || "Desconhecido"
      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = { count: 0, revenue: 0 }
      }
      serviceStats[serviceName].count++
      serviceStats[serviceName].revenue += Number(a.service?.price || 0)
    })

  const topServices = Object.entries(serviceStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Relatórios e Análises</h1>
          <p className="text-muted-foreground">Visão analítica do desempenho do negócio</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos (Mês)</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{monthlyAppointments?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{completedAppointments} concluídos</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita (Mês)</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{clients?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
              <Award className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{staff?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5 text-gold" />
                Top 5 Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStaff.map((s, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.appointments} agendamentos</p>
                    </div>
                    <p className="text-lg font-bold text-gold">R$ {s.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-gold" />
                Top 5 Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topServices.map(([name, stats], index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground">{stats.count} vezes</p>
                    </div>
                    <p className="text-lg font-bold text-gold">R$ {stats.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
