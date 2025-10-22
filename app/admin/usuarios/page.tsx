import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, UserCheck, UserX, Shield } from "lucide-react"

export default async function AdminUsuariosPage() {
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

  // Get all users
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  const getUserLevelLabel = (level: number) => {
    switch (level) {
      case 10:
        return "Cliente"
      case 20:
        return "Staff"
      case 30:
        return "Admin"
      case 40:
        return "Super Admin"
      default:
        return "Desconhecido"
    }
  }

  const getUserLevelColor = (level: number) => {
    switch (level) {
      case 10:
        return "bg-blue-500/10 text-blue-500"
      case 20:
        return "bg-green-500/10 text-green-500"
      case 30:
        return "bg-gold/10 text-gold"
      case 40:
        return "bg-purple-500/10 text-purple-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.is_active).length || 0,
    inactive: users?.filter((u) => !u.is_active).length || 0,
    staff: users?.filter((u) => u.user_level >= 20).length || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Gerenciar Usuários</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Visualizar e gerenciar todas as contas do sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10">
                  <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Ativos</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-red-500/10">
                  <UserX className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Inativos</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-gold/10">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-gold" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Staff</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.staff}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Todos os Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users && users.length > 0 ? (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm md:text-base font-medium text-primary">
                          {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{u.full_name || "Sem nome"}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <Badge className={getUserLevelColor(u.user_level)}>{getUserLevelLabel(u.user_level)}</Badge>
                      <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Ativo" : "Inativo"}</Badge>
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-black">
                        <Link href={`/admin/usuarios/${u.id}`}>Gerenciar</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
