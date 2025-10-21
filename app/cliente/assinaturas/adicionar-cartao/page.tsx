import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddCardForm } from "@/components/add-card-form"

export default async function AdicionarCartaoPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/cliente/assinaturas" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Assinaturas
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Adicionar Cartão</h1>
          <p className="text-muted-foreground">Cadastre um novo método de pagamento</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>Informações do Cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <AddCardForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
