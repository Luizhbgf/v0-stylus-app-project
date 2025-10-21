import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Lock, User, ImageIcon, Briefcase } from "lucide-react"

export default async function StaffConfiguracoes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil profissional e configurações</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gold" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={profile.full_name || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={profile.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" type="tel" defaultValue={profile.phone || ""} />
              </div>
              <Button className="bg-gold hover:bg-gold/90 text-black">Salvar Alterações</Button>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-gold" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>Adicione ou atualize sua foto de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url || "/placeholder.svg"}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gold/10 flex items-center justify-center">
                    <User className="h-12 w-12 text-gold" />
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" />
                  <p className="text-sm text-muted-foreground mt-2">JPG, PNG ou GIF. Máximo 5MB.</p>
                </div>
              </div>
              <Button className="bg-gold hover:bg-gold/90 text-black">Upload Foto</Button>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gold" />
                Perfil Profissional
              </CardTitle>
              <CardDescription>Personalize seu perfil profissional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você e sua experiência..."
                  defaultValue={profile.bio || ""}
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialties">Especialidades</Label>
                <Input
                  id="specialties"
                  placeholder="Ex: cortes_modernos, barbas, coloracao"
                  defaultValue={profile.specialties?.join(", ") || ""}
                />
                <p className="text-sm text-muted-foreground">Separe as especialidades por vírgula</p>
              </div>
              <div className="grid gap-2">
                <Label>Portfolio (Imagens)</Label>
                <Input type="file" accept="image/*" multiple />
                <p className="text-sm text-muted-foreground">Adicione fotos dos seus trabalhos</p>
              </div>
              {profile.portfolio_images && profile.portfolio_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {profile.portfolio_images.map((img: string, index: number) => (
                    <img
                      key={index}
                      src={img || "/placeholder.svg"}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              <Button className="bg-gold hover:bg-gold/90 text-black">Salvar Perfil</Button>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold" />
                Notificações
              </CardTitle>
              <CardDescription>Configure como você deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Novas Solicitações</p>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações de novas solicitações de agendamento
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Lembretes de Agendamento</p>
                  <p className="text-sm text-muted-foreground">Receba lembretes dos seus próximos agendamentos</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <Button className="bg-gold hover:bg-gold/90 text-black">Salvar Preferências</Button>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gold" />
                Segurança
              </CardTitle>
              <CardDescription>Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="bg-gold hover:bg-gold/90 text-black">Alterar Senha</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
