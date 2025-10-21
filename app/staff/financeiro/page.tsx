import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar } from "lucide-react"

export default async function StaffFinanceiro() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  const { data: earnings } = await supabase
    .from("staff_earnings")
    .select("*")
    .eq("staff_id", user.id)
    .order("payment_date", { ascending: false })

  const totalPaid = earnings?.filter((e) => e.status === "paid").reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const totalPending =
    earnings?.filter((e) => e.status === "pending").reduce((sum, e) => sum + Number(e.amount), 0) || 0

  // Calculate this month earnings
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyEarnings =
    earnings
      ?.filter((e) => new Date(e.payment_date) >= firstDayOfMonth && e.status === "paid")
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe seus ganhos e pagamentos</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {monthlyEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Histórico de Pagamentos</h2>
          <div className="grid gap-4">
            {earnings && earnings.length > 0 ? (
              earnings.map((earning) => (
                <Card key={earning.id} className="border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-semibold text-foreground mb-1">
                          R$ {Number(earning.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          Data: {new Date(earning.payment_date).toLocaleDateString("pt-BR")}
                        </p>
                        {earning.payment_method && (
                          <p className="text-sm text-muted-foreground">Método: {earning.payment_method}</p>
                        )}
                        {earning.commission_rate && (
                          <p className="text-sm text-muted-foreground">Comissão: {earning.commission_rate}%</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          earning.status === "paid"
                            ? "bg-green-500/10 text-green-500"
                            : earning.status === "cancelled"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {earning.status === "paid" ? "Pago" : earning.status === "cancelled" ? "Cancelado" : "Pendente"}
                      </span>
                    </div>
                    {earning.notes && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground">{earning.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gold/20">
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-gold mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
