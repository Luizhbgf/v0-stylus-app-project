import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function AdminFinanceiroPage() {
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

  // Get all payments
  const { data: payments } = await supabase
    .from("payments")
    .select(
      `
      *,
      client:client_id(full_name),
      staff:staff_id(full_name)
    `,
    )
    .order("payment_date", { ascending: false })

  // Calculate monthly revenue
  const currentMonth = new Date()
  const lastMonth = subMonths(currentMonth, 1)

  const currentMonthStart = startOfMonth(currentMonth)
  const currentMonthEnd = endOfMonth(currentMonth)
  const lastMonthStart = startOfMonth(lastMonth)
  const lastMonthEnd = endOfMonth(lastMonth)

  const currentMonthRevenue =
    payments
      ?.filter((p) => {
        const date = new Date(p.payment_date)
        return date >= currentMonthStart && date <= currentMonthEnd && p.status === "completed"
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const lastMonthRevenue =
    payments
      ?.filter((p) => {
        const date = new Date(p.payment_date)
        return date >= lastMonthStart && date <= lastMonthEnd && p.status === "completed"
      })
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  // Calculate total revenue
  const totalRevenue =
    payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Calculate pending payments
  const pendingRevenue =
    payments?.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Visão geral financeira do negócio</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {currentMonthRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variação Mensal</CardTitle>
              {revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${revenueChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {revenueChange >= 0 ? "+" : ""}
                {revenueChange.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs. mês anterior</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {pendingRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-foreground">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-gold/10"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {payment.client?.full_name || "Cliente não identificado"}
                      </h3>
                      <p className="text-sm text-muted-foreground">Profissional: {payment.staff?.full_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(payment.payment_date), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold">R$ {Number(payment.amount).toFixed(2)}</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          payment.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : payment.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {payment.status === "completed"
                          ? "Concluído"
                          : payment.status === "pending"
                            ? "Pendente"
                            : "Cancelado"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{payment.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nenhum pagamento registrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
