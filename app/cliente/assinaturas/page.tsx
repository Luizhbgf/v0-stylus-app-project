import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Calendar, DollarSign, CheckCircle, XCircle, CreditCard, Plus } from "lucide-react"
import Link from "next/link"

export default async function AssinaturasPage() {
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

  // Get client subscriptions with plan details
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`
      *,
      plan:subscription_plans(*,
        staff:staff_id(full_name)
      )
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })

  // Get available subscription plans
  const { data: availablePlans } = await supabase
    .from("subscription_plans")
    .select(`
      *,
      staff:staff_id(full_name)
    `)
    .eq("is_active", true)
    .order("price", { ascending: true })

  // Get payment methods
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("client_id", user.id)
    .order("is_default", { ascending: false })

  const activeSubscriptions = subscriptions?.filter((s) => s.status === "active") || []
  const hasActiveSubscription = activeSubscriptions.length > 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/cliente" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Minhas Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie seus planos e métodos de pagamento</p>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Métodos de Pagamento</h2>
            <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-black">
              <Link href="/cliente/assinaturas/adicionar-cartao">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartão
              </Link>
            </Button>
          </div>
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="border-gold/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-gold" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {method.card_brand.toUpperCase()} •••• {method.card_last_four}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.card_holder_name} - {method.expiry_month}/{method.expiry_year}
                          </p>
                        </div>
                      </div>
                      {method.is_default && (
                        <span className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full">Padrão</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Nenhum método de pagamento cadastrado</p>
                <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                  <Link href="/cliente/assinaturas/adicionar-cartao">Adicionar Cartão</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Active Subscriptions */}
        {subscriptions && subscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Minhas Assinaturas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {subscriptions.map((subscription) => (
                <Card
                  key={subscription.id}
                  className={`border-gold/20 ${subscription.status === "active" ? "ring-2 ring-gold/20" : ""}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-foreground mb-2">{subscription.plan?.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mb-1">
                          Profissional: {subscription.plan?.staff?.full_name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            subscription.status === "active"
                              ? "bg-green-500/10 text-green-500"
                              : subscription.status === "cancelled"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {subscription.status === "active" ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </>
                          ) : subscription.status === "cancelled" ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              Cancelado
                            </>
                          ) : (
                            "Expirado"
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gold">R$ {Number(subscription.price).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">/mês</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {subscription.plan?.service_type === "haircut" ? "Corte" : "Corte + Barba"} -{" "}
                      {subscription.plan?.frequency_per_week}x por semana
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 text-gold" />
                        Início: {new Date(subscription.start_date).toLocaleDateString("pt-BR")}
                      </div>
                      {subscription.next_billing_date && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4 mr-2 text-gold" />
                          Próxima cobrança: {new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                    {subscription.status === "active" && (
                      <Button
                        variant="outline"
                        className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 bg-transparent"
                      >
                        Cancelar Assinatura
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Plans */}
        {!hasActiveSubscription && availablePlans && availablePlans.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Planos Disponíveis</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <Card key={plan.id} className="border-gold/20 hover:border-gold/40 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Profissional: {plan.staff?.full_name}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-gold">R$ {Number(plan.price).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">/mês</div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-muted-foreground">
                        • {plan.service_type === "haircut" ? "Corte" : "Corte + Barba"}
                      </p>
                      <p className="text-sm text-muted-foreground">• {plan.frequency_per_week}x por semana</p>
                      {plan.description && <p className="text-sm text-muted-foreground">• {plan.description}</p>}
                    </div>
                    <Button className="w-full bg-gold hover:bg-gold/90 text-black">Assinar Plano</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!hasActiveSubscription && (!availablePlans || availablePlans.length === 0) && (
          <Card className="border-gold/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum plano disponível</h3>
              <p className="text-muted-foreground">Em breve teremos planos de assinatura disponíveis</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
