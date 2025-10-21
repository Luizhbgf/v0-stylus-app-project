import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreatePlanForm } from "@/components/create-plan-form"

export default async function CriarPlanoPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/staff/planos" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Planos
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Criar Plano de Assinatura</h1>
          <p className="text-muted-foreground">Configure um novo plano mensal para seus clientes</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>Informações do Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePlanForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
