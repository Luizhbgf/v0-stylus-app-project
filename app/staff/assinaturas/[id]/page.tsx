import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Edit, Users, DollarSign, Calendar, Check, UserPlus } from "lucide-react"

export default async function ViewSubscriptionPlanPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 20) {
    redirect("/cliente")
  }

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", params.id)
    .eq("staff_id", user.id)
    .single()

  if (!plan) {
    redirect("/staff/assinaturas")
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, profiles(full_name, email)")
    .eq("plan_id", params.id)
    .order("created_at", { ascending: false })

  const activeSubscriptions = subscriptions?.filter((s) => s.status === "active").length || 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <Link
            href="/staff/assinaturas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Assinaturas
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">{plan.name}</h1>
              <p className="text-sm md:text-base text-muted-foreground">{plan.description}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="bg-transparent">
                <Link href={`/staff/assinaturas/${params.id}/adicionar-cliente`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-black">
                <Link href={`/staff/assinaturas/${params.id}/editar`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Plano
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">clientes inscritos</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">R$ {plan.price}</div>
              <p className="text-xs text-muted-foreground">por mês</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Plano</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <Badge variant={plan.is_active ? "default" : "secondary"}>{plan.is_active ? "Ativo" : "Inativo"}</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {plan.is_active ? "Aceita novos assinantes" : "Não aceita novos assinantes"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Detalhes do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.billing_frequency && (
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-sm text-muted-foreground">Periodicidade de Cobrança</span>
                  <span className="font-medium">
                    {plan.billing_frequency === "weekly" && "Semanal"}
                    {plan.billing_frequency === "biweekly" && "Quinzenal"}
                    {plan.billing_frequency === "monthly" && "Mensal"}
                  </span>
                </div>
              )}

              {plan.service_frequency && (
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-sm text-muted-foreground">Frequência dos Serviços</span>
                  <span className="font-medium">
                    {plan.service_frequency === "weekly" && "Semanal"}
                    {plan.service_frequency === "biweekly" && "Quinzenal"}
                    {plan.service_frequency === "monthly" && "Mensal"}
                  </span>
                </div>
              )}

              {plan.services_per_period && (
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-sm text-muted-foreground">Cortes Incluídos</span>
                  <span className="font-medium">{plan.services_per_period} por período</span>
                </div>
              )}

              {plan.service_type && (
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-sm text-muted-foreground">Tipo de Serviço</span>
                  <span className="font-medium">{plan.service_type}</span>
                </div>
              )}

              {plan.included_services && plan.included_services.length > 0 && (
                <div className="py-2">
                  <span className="text-sm text-muted-foreground block mb-2">Serviços Incluídos</span>
                  <div className="space-y-1">
                    {plan.included_services.map((service: string, index: number) => (
                      <div key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-primary mr-2" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.terms && (
                <div className="py-2">
                  <span className="text-sm text-muted-foreground block mb-2">Termos de Responsabilidade</span>
                  <p className="text-sm">{plan.terms}</p>
                </div>
              )}

              {plan.notes && (
                <div className="py-2">
                  <span className="text-sm text-muted-foreground block mb-2">Observações</span>
                  <p className="text-sm">{plan.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Assinantes Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-3">
                  {subscriptions.slice(0, 5).map((subscription: any) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between py-2 border-b border-primary/10"
                    >
                      <div>
                        <p className="font-medium text-sm">{subscription.profiles?.full_name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">{subscription.profiles?.email}</p>
                      </div>
                      <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                        {subscription.status === "active" ? "Ativo" : subscription.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum assinante ainda</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
