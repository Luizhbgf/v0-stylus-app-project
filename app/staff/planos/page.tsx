import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Edit, Trash } from "lucide-react"
import Link from "next/link"

export default async function PlanosStaffPage() {
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
    .order("price", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/staff" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Meus Planos de Assinatura</h1>
              <p className="text-muted-foreground">Gerencie seus planos mensais</p>
            </div>
            <Button asChild className="bg-gold hover:bg-gold/90 text-black">
              <Link href="/staff/planos/criar">
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano
              </Link>
            </Button>
          </div>
        </div>

        {plans && plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`border-gold/20 ${!plan.is_active ? "opacity-50" : ""}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        plan.is_active ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-gold">R$ {Number(plan.price).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">/mês</div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      • {plan.service_type === "haircut" ? "Corte" : "Corte + Barba"}
                    </p>
                    <p className="text-sm text-muted-foreground">• {plan.frequency_per_week}x por semana</p>
                    {plan.description && <p className="text-sm text-muted-foreground">• {plan.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-gold/20 bg-transparent">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-500/20 text-red-500 bg-transparent">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gold/20">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum plano criado</h3>
              <p className="text-muted-foreground mb-6">Crie planos de assinatura para seus clientes</p>
              <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                <Link href="/staff/planos/criar">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
