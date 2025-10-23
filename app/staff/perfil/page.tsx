import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, Shield, Edit, Briefcase, Clock, Activity } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500">Ativo</Badge>
      case "vacation":
        return <Badge className="bg-yellow-500/10 text-yellow-500">Férias</Badge>
      case "inactive":
        return <Badge className="bg-red-500/10 text-red-500">Inativo</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const workingHours = profile.working_hours || {}

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">Informações da sua conta</p>
          </div>
          <Link href="/staff/perfil/editar">
            <Button className="bg-gold hover:bg-gold/90 text-black">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-gold" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{profile.full_name || "Nome não definido"}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4" />
                    {userLevelText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gold/20">
                <Activity className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(profile.staff_status || "active")}</div>
                </div>
              </div>

              {profile.bio && (
                <div className="pt-4 border-t border-gold/20">
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              {profile.specialties && profile.specialties.length > 0 && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidades</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.specialties.map((specialty: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gold/10 text-gold text-sm rounded-md">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

              {profile.portfolio_images && profile.portfolio_images.length > 0 && (
                <div className="pt-4 border-t border-gold/20">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Portfolio</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.portfolio_images.map((url: string, index: number) => (
                      <Image
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt={`Portfolio ${index + 1}`}
                        width={200}
                        height={200}
                        className="rounded-lg object-cover aspect-square"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold" />
                Horário de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(workingHours).map(([day, hours]: [string, any]) => {
                  const dayNames: Record<string, string> = {
                    monday: "Segunda-feira",
                    tuesday: "Terça-feira",
                    wednesday: "Quarta-feira",
                    thursday: "Quinta-feira",
                    friday: "Sexta-feira",
                    saturday: "Sábado",
                    sunday: "Domingo",
                  }

                  return (
                    <div key={day} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <span className="font-medium text-foreground">{dayNames[day]}</span>
                      {hours?.enabled ? (
                        <span className="text-muted-foreground">
                          {hours.start} - {hours.end}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Fechado</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
