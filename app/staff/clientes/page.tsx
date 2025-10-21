import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Star } from "lucide-react"

export default async function StaffClientes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  const { data: clients } = await supabase
    .from("staff_clients")
    .select(
      `
      *,
      client:client_id(full_name, email, phone)
    `,
    )
    .eq("staff_id", user.id)
    .order("last_visit", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Meus Clientes</h1>
          <p className="text-muted-foreground">Gerencie seu relacionamento com os clientes</p>
        </div>

        <div className="grid gap-4">
          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <Card key={client.id} className="border-gold/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{client.client?.full_name}</h3>
                        {client.is_favorite && <Star className="h-4 w-4 text-gold fill-gold" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Email: {client.client?.email}</p>
                      <p className="text-sm text-muted-foreground mb-1">Telefone: {client.client?.phone}</p>
                      <p className="text-sm text-muted-foreground">
                        Primeira visita: {new Date(client.first_visit).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Última visita: {new Date(client.last_visit).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        <p className="text-2xl font-bold text-foreground">{client.total_visits}</p>
                        <p className="text-xs text-muted-foreground">visitas</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gold">R$ {Number(client.total_spent).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">total gasto</p>
                      </div>
                    </div>
                  </div>
                  {client.notes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {client.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gold mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
