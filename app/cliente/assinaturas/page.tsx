import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Sparkles, TrendingUp, Star, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

  const { data: mySubscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("client_id", user.id)
    .eq("status", "active")

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="relative bg-gradient-to-br from-[#054547] via-[#065557] to-[#054547] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <Image src="/logo-styllus.png" alt="Styllus Logo" width={300} height={100} className="object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Imagine estar sempre com o visual impecável!
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">Sem pagar a mais por isso!</p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-black font-bold text-lg px-8 py-6 animate-bounce-subtle"
          >
            <a href="#planos">CONHEÇA O CLUBE STYLLUS</a>
          </Button>
        </div>
      </div>
      {/* </CHANGE> */}

      <div className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Por que assinar o Clube Styllus?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:scale-105 duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Cabelo SEMPRE na régua</h3>
                <p className="text-muted-foreground">Mantenha seu visual impecável todos os dias</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:scale-105 duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Barba SEMPRE alinhada</h3>
                <p className="text-muted-foreground">Aparência profissional em qualquer ocasião</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:scale-105 duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Visual SEMPRE impecável</h3>
                <p className="text-muted-foreground">Pronto para qualquer compromisso</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:scale-105 duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Você SEMPRE economizando</h3>
                <p className="text-muted-foreground">Valor fixo mensal, sem surpresas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* </CHANGE> */}

      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Como funciona?</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Pague apenas uma vez e faça corte, barba ou os dois. <strong>Quantas vezes quiser!</strong>
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            O <strong>Clube Styllus</strong> foi criado para você que gosta de andar sempre no estilo, seja pra aquele
            encontro especial, pra reunião de negócios ou pra aquele rolê no shopping. Não importa a ocasião, é preciso
            estar com o visual em dia. No <strong>Clube Styllus</strong>, você paga um valor fixo mensal e pode fazer
            barba, cortar o cabelo ou os dois, quantas vezes quiser.
          </p>
          <p className="text-base text-muted-foreground mt-4">
            Mais que um corte de cabelo, o <strong>Clube Styllus</strong> é uma experiência de conveniência, economia e
            valorização de quem é mais importante pra nós: <strong>Você!</strong>
          </p>
        </div>
      </div>
      {/* </CHANGE> */}

      <div id="planos" className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">PLANOS DE ASSINATURA CLUBE STYLLUS:</h2>
          </div>

          {plans && plans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => {
                const hasSubscription = mySubscriptions?.some((s) => s.plan_id === plan.id)
                const features = plan.features || []
                features.sort((a: any, b: any) => a.display_order - b.display_order)

                return (
                  <Card
                    key={plan.id}
                    className="border-2 border-primary/30 overflow-hidden hover:border-primary/60 transition-all hover:scale-105 duration-300 hover:shadow-2xl"
                  >
                    <div className="bg-gradient-to-r from-primary via-[#C9A961] to-primary p-6 text-center">
                      <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                    </div>

                    <CardContent className="p-6 bg-card">
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
                                feature.is_included ? "text-foreground" : "text-muted-foreground line-through"
                              }`}
                            >
                              {feature.feature_text}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Button
                        asChild
                        className="w-full bg-black hover:bg-black/90 text-white font-semibold py-6 text-lg transition-all hover:scale-105"
                        disabled={hasSubscription}
                      >
                        {hasSubscription ? (
                          <span>Plano Ativo</span>
                        ) : (
                          <Link href={`/cliente/assinaturas/plano/${plan.id}/assinar`}>Clique aqui</Link>
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
        </div>
      </div>
      {/* </CHANGE> */}

      {/* My active subscriptions section */}
      {mySubscriptions && mySubscriptions.length > 0 && (
        <div className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">Minhas Assinaturas Ativas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mySubscriptions.map((subscription) => {
                const plan = plans?.find((p) => p.id === subscription.plan_id)
                return (
                  <Card key={subscription.id} className="border-primary/20">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">{plan?.name}</h3>
                      <div className="space-y-2 text-sm mb-4">
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
                        className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 bg-transparent"
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
        </div>
      )}

      <div className="py-16 bg-gradient-to-br from-[#054547] via-[#065557] to-[#054547] text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Você merece estar com o visual em dia!</h2>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold text-lg px-8 py-6">
            <a href="#planos">ASSINAR AGORA</a>
          </Button>
        </div>
      </div>
      {/* </CHANGE> */}
    </div>
  )
}
