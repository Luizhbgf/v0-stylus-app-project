import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, Shield, Edit } from "lucide-react"
import Link from "next/link"

export default async function AdminPerfilPage() {
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

  const userLevelText =
    profile.user_level === 40
      ? "Super Admin"
      : profile.user_level === 30
        ? "Admin"
        : profile.user_level === 20
          ? "Staff"
          : "Cliente"

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">Informações da sua conta</p>
          </div>
          <Link href="/admin/perfil/editar">
            <Button className="bg-gold hover:bg-gold/90 text-black">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg">
                <User className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium text-foreground">{profile.full_name || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg">
                <Mail className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg">
                <Phone className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium text-foreground">{profile.phone || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card/50 rounded-lg">
                <Shield className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Nível de Acesso</p>
                  <p className="font-medium text-foreground">{userLevelText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
