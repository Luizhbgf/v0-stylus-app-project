import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, Bell, Lock, User, Shield } from "lucide-react"

export default async function AdminConfiguracoes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 30) redirect("/cliente")

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie configurações administrativas e do sistema</p>
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
                <Settings className="h-5 w-5 text-gold" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>Configure parâmetros gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="business-name">Nome do Estabelecimento</Label>
                <Input id="business-name" defaultValue="Styllus Estética e Beleza" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business-hours">Horário de Funcionamento</Label>
                <Input id="business-hours" defaultValue="Seg-Sex: 9h-18h, Sáb: 9h-14h" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="booking-advance">Antecedência Mínima para Agendamento (horas)</Label>
                <Input id="booking-advance" type="number" defaultValue="2" />
              </div>
              <Button className="bg-gold hover:bg-gold/90 text-black">Salvar Configurações</Button>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gold" />
                Permissões e Segurança
              </CardTitle>
              <CardDescription>Gerencie permissões de usuários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Permitir Auto-Registro de Staff</p>
                  <p className="text-sm text-muted-foreground">Novos usuários podem se registrar como staff</p>
                </div>
                <input type="checkbox" className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Aprovação Manual de Agendamentos</p>
                  <p className="text-sm text-muted-foreground">Todos os agendamentos precisam de aprovação</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <Button className="bg-gold hover:bg-gold/90 text-black">Salvar Permissões</Button>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold" />
                Notificações
              </CardTitle>
              <CardDescription>Configure notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Alertas de Sistema</p>
                  <p className="text-sm text-muted-foreground">Receba alertas sobre problemas do sistema</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Relatórios Diários</p>
                  <p className="text-sm text-muted-foreground">Receba relatórios diários por email</p>
                </div>
                <input type="checkbox" className="h-5 w-5" />
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
