import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, CreditCard, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function PagamentosPage() {
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

  // Get all payments
  const { data: payments } = await supabase
    .from("payments")
    .select(
      `
      *,
      appointment:appointments(
        appointment_date,
        service:services(name)
      )
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })

  const totalPaid = payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const pendingPayments = payments?.filter((p) => p.status === "pending") || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/cliente" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Pagamentos</h1>
          <p className="text-muted-foreground">Histórico de pagamentos e transações</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Pago</span>
                <DollarSign className="h-4 w-4 text-gold" />
              </div>
              <div className="text-2xl font-bold text-foreground">R$ {totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pagamentos Pendentes</span>
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{pendingPayments.length}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total de Transações</span>
                <CreditCard className="h-4 w-4 text-gold" />
              </div>
              <div className="text-2xl font-bold text-foreground">{payments?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {payments && payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="border-gold/20">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {payment.appointment?.service?.name || "Serviço"}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-gold" />
                          {new Date(payment.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4 mr-2 text-gold" />
                          {payment.payment_method === "credit_card"
                            ? "Cartão de Crédito"
                            : payment.payment_method === "debit_card"
                              ? "Cartão de Débito"
                              : payment.payment_method === "pix"
                                ? "PIX"
                                : "Dinheiro"}
                        </div>
                        {payment.transaction_id && (
                          <div className="text-xs text-muted-foreground">ID: {payment.transaction_id}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                          payment.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : payment.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : payment.status === "failed"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {payment.status === "completed" ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Pago
                          </>
                        ) : payment.status === "pending" ? (
                          <>
                            <Clock className="h-3 w-3" />
                            Pendente
                          </>
                        ) : payment.status === "failed" ? (
                          <>
                            <XCircle className="h-3 w-3" />
                            Falhou
                          </>
                        ) : (
                          "Reembolsado"
                        )}
                      </span>
                      <div className="flex items-center justify-end text-xl font-bold text-gold">
                        R$ {Number(payment.amount).toFixed(2)}
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
              <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum pagamento ainda</h3>
              <p className="text-muted-foreground">Seus pagamentos aparecerão aqui</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
