import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, DollarSign, Mail, Phone } from "lucide-react"

export default async function AdminClientesPage() {
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

  // Get all clients with their stats
  const { data: clients } = await supabase.from("profiles").select("*").eq("user_level", 10).order("full_name")

  // Get client stats from client_stats table
  const { data: clientStats } = await supabase.from("client_stats").select("*")

  const clientsWithStats = clients?.map((client) => {
    const stats = clientStats?.find((s) => s.client_id === client.id)
    return {
      ...client,
      total_visits: stats?.total_visits || 0,
      total_spent: stats?.total_spent || 0,
      last_visit: stats?.last_visit,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Todos os Clientes</h1>
          <p className="text-muted-foreground">Gerenciar e visualizar todos os clientes do sistema</p>
        </div>

        <div className="grid gap-4">
          {clientsWithStats && clientsWithStats.length > 0 ? (
            clientsWithStats.map((client) => (
              <Card key={client.id} className="border-gold/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gold/10 rounded-lg">
                        <Users className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{client.full_name}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {client.email && (
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {client.email}
                            </p>
                          )}
                          {client.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {client.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gold" />
                        <span className="text-foreground">{client.total_visits} visitas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gold" />
                        <span className="text-foreground">R$ {client.total_spent.toFixed(2)}</span>
                      </div>
                      {client.last_visit && (
                        <p className="text-xs text-muted-foreground">
                          Última visita: {new Date(client.last_visit).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
