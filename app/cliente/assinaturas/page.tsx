import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
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

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select(`
      *,
      staff:staff_id(full_name, avatar_url),
      features:subscription_plan_features(*)
    `)
    .eq("is_active", true)
    .order("price", { ascending: true })

  // Get client's active subscriptions
  const { data: mySubscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("client_id", user.id)
    .eq("status", "active")
  // </CHANGE>

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">PLANOS DE ASSINATURA CLUBE STYLLUS</h1>
          <p className="text-muted-foreground text-lg">Escolha o plano ideal para você</p>
        </div>
        {/* </CHANGE> */}

        {plans && plans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => {
              const hasSubscription = mySubscriptions?.some((s) => s.plan_id === plan.id)
              const features = plan.features || []
              features.sort((a: any, b: any) => a.display_order - b.display_order)

              return (
                <Card
                  key={plan.id}
                  className="border-2 border-primary/20 overflow-hidden hover:border-primary/40 transition-all hover:scale-105 duration-300"
                >
                  {/* Gold header like in the image */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
                    <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                  </div>

                  <CardContent className="p-6">
                    {/* Price section */}
                    <div className="text-center mb-6 pb-6 border-b border-primary/20">
                      <div className="flex items-start justify-center gap-1">
                        <span className="text-2xl font-bold text-foreground mt-2">R$</span>
                        <span className="text-6xl font-bold text-foreground">{Math.floor(Number(plan.price))}</span>
                        <span className="text-2xl font-bold text-foreground mt-2">
                          {(Number(plan.price) % 1).toFixed(2).substring(1)}
                        </span>
                      </div>
                      <p className="text-primary font-semibold text-lg mt-2">Mensal</p>
                      <p className="text-sm text-muted-foreground mt-2">Profissional: {plan.staff?.full_name}</p>
                    </div>

                    {/* Features list with checkmarks and X marks */}
                    <div className="space-y-3 mb-6">
                      {features.map((feature: any) => (
                        <div key={feature.id} className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              feature.is_included ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {feature.is_included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </div>
                          <p
                            className={`text-sm flex-1 ${
                              feature.is_included ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {feature.feature_text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      asChild
                      className="w-full bg-black hover:bg-black/90 text-white font-semibold py-6 text-lg transition-all hover:scale-105"
                      disabled={hasSubscription}
                    >
                      {hasSubscription ? (
                        <span>Plano Ativo</span>
                      ) : (
                        <Link href={`/cliente/assinaturas/${plan.id}/assinar`}>Clique aqui</Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum plano disponível</h3>
              <p className="text-muted-foreground">Em breve teremos planos de assinatura disponíveis</p>
            </CardContent>
          </Card>
        )}
        {/* </CHANGE> */}

        {/* My active subscriptions section */}
        {mySubscriptions && mySubscriptions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Minhas Assinaturas Ativas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mySubscriptions.map((subscription) => {
                const plan = plans?.find((p) => p.id === subscription.plan_id)
                return (
                  <Card key={subscription.id} className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-xl">{plan?.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profissional:</span>
                          <span className="font-medium">{plan?.staff?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-primary">
                            R$ {Number(subscription.price).toFixed(2)}/mês
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Início:</span>
                          <span className="font-medium">
                            {new Date(subscription.start_date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {subscription.next_billing_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Próxima cobrança:</span>
                            <span className="font-medium">
                              {new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-red-500/20 hover:bg-red-500/10 text-red-500 bg-transparent"
                        asChild
                      >
                        <Link href={`/cliente/assinaturas/${subscription.id}/cancelar`}>Cancelar Assinatura</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
