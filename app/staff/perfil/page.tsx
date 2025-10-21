import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, Shield } from "lucide-react"

export default async function StaffPerfil() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Informações da sua conta</p>
        </div>

        <div className="max-w-2xl">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gold/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{profile.full_name || "Nome não definido"}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4" />
                    {userLevelText}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gold/20">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="text-foreground">{profile.phone || "Não informado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="text-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
