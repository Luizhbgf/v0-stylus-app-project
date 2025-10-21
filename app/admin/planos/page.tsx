import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminPlanosPage() {
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

  // Get all subscription plans with staff info
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select(
      `
      *,
      staff:staff_id(full_name)
    `,
    )
    .order("created_at", { ascending: false })

  // Get active subscriptions count for each plan
  const { data: subscriptions } = await supabase.from("client_subscriptions").select("*").eq("status", "active")

  const plansWithStats = plans?.map((plan) => {
    const activeSubscriptions = subscriptions?.filter((s) => s.plan_id === plan.id).length || 0
    return {
      ...plan,
      active_subscriptions: activeSubscriptions,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Planos de Assinatura</h1>
            <p className="text-muted-foreground">Gerenciar todos os planos de assinatura</p>
          </div>
          <Button asChild className="bg-gold hover:bg-gold/90 text-black">
            <Link href="/admin/planos/criar">Criar Novo Plano</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansWithStats && plansWithStats.length > 0 ? (
            plansWithStats.map((plan) => (
              <Card key={plan.id} className="border-gold/20">
                <CardHeader>
                  <CardTitle className="text-foreground">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Profissional: {plan.staff?.full_name || "N/A"}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Serviços:</span>
                      <span className="font-medium text-foreground">{plan.services}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Frequência:</span>
                      <span className="font-medium text-foreground">{plan.frequency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assinantes ativos:</span>
                      <span className="font-medium text-foreground">{plan.active_subscriptions}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gold/20">
                    <span className="text-2xl font-bold text-gold">R$ {plan.price}/mês</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        plan.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {plan.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href={`/admin/planos/${plan.id}`}>Ver Detalhes</Link>
                    </Button>
                    <Button asChild className="flex-1 bg-gold hover:bg-gold/90 text-black">
                      <Link href={`/admin/planos/${plan.id}/editar`}>Editar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20 col-span-3">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">Nenhum plano cadastrado</p>
                <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                  <Link href="/admin/planos/criar">Criar Primeiro Plano</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
