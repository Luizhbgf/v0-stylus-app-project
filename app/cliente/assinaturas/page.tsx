import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react"
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

  // Get all subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })

  const activeSubscriptions = subscriptions?.filter((s) => s.status === "active") || []

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
          <p className="text-muted-foreground">Gerencie seus planos e assinaturas</p>
        </div>

        {subscriptions && subscriptions.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {subscriptions.map((subscription) => (
              <Card
                key={subscription.id}
                className={`border-gold/20 ${subscription.status === "active" ? "ring-2 ring-gold/20" : ""}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl text-foreground mb-2">{subscription.plan_name}</CardTitle>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          subscription.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : subscription.status === "cancelled"
                              ? "bg-red-500/10 text-red-500"
                              : subscription.status === "expired"
                                ? "bg-gray-500/10 text-gray-500"
                                : "bg-yellow-500/10 text-yellow-500"
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
                        ) : subscription.status === "expired" ? (
                          "Expirado"
                        ) : (
                          "Pausado"
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gold">R$ {Number(subscription.price).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        /
                        {subscription.billing_cycle === "monthly"
                          ? "mês"
                          : subscription.billing_cycle === "quarterly"
                            ? "trimestre"
                            : "ano"}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{subscription.description}</p>
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
                    {subscription.end_date && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 text-gold" />
                        Término: {new Date(subscription.end_date).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Package className="h-4 w-4 mr-2 text-gold" />
                      Renovação automática: {subscription.auto_renew ? "Sim" : "Não"}
                    </div>
                  </div>
                  {subscription.status === "active" && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-gold/20 hover:bg-gold/10 bg-transparent">
                        Gerenciar
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/20 hover:bg-red-500/10 text-red-500 bg-transparent"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gold/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma assinatura ativa</h3>
              <p className="text-muted-foreground mb-6">Assine um plano para ter acesso a benefícios exclusivos</p>
              <Button className="bg-gold hover:bg-gold/90 text-black">Explorar Planos</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
