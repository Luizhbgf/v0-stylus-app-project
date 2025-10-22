import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function StaffAssinaturasPage() {
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

  // Get staff's subscription plans
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("staff_id", user.id)
    .order("created_at", { ascending: false })

  // Get active subscriptions count for each plan
  const { data: subscriptions } = await supabase.from("subscriptions").select("*").eq("status", "active")

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

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Minhas Assinaturas</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gerenciar planos de assinatura</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-black w-full sm:w-auto">
            <Link href="/staff/assinaturas/criar">
              <Plus className="h-4 w-4 mr-2" />
              Criar Plano
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plansWithStats && plansWithStats.length > 0 ? (
            plansWithStats.map((plan) => (
              <Card key={plan.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                    <Badge variant={plan.is_active ? "default" : "secondary"} className="ml-2">
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{plan.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequência:</span>
                      <span className="font-medium">{plan.frequency_per_week}x/semana</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assinantes:</span>
                      <span className="font-medium text-primary">{plan.active_subscriptions}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-4">R$ {plan.price}/mês</div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1 bg-transparent" size="sm">
                        <Link href={`/staff/assinaturas/${plan.id}`}>Ver</Link>
                      </Button>
                      <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-black" size="sm">
                        <Link href={`/staff/assinaturas/${plan.id}/editar`}>Editar</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-primary/20 col-span-full">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Nenhum plano de assinatura criado</p>
                <Button asChild className="bg-primary hover:bg-primary/90 text-black">
                  <Link href="/staff/assinaturas/criar">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Plano
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
