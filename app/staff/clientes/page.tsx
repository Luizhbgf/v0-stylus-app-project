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

  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      status,
      payment_status,
      client_id,
      service:services(price),
      client:profiles!client_id(id, full_name, email, phone)
    `,
    )
    .eq("staff_id", user.id)

  const { data: requestsData } = await supabase
    .from("appointment_requests")
    .select(
      `
      id,
      preferred_date,
      status,
      client_id,
      service:services(price),
      client:profiles!client_id(id, full_name, email, phone)
    `,
    )
    .eq("staff_id", user.id)

  // Aggregate client data
  const clientsMap = new Map()

  // Process appointments
  appointmentsData?.forEach((apt) => {
    if (!apt.client_id || !apt.client) return

    const clientId = apt.client_id
    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        id: clientId,
        full_name: apt.client.full_name,
        email: apt.client.email,
        phone: apt.client.phone,
        total_visits: 0,
        total_spent: 0,
        first_visit: apt.appointment_date,
        last_visit: apt.appointment_date,
        is_favorite: false,
      })
    }

    const client = clientsMap.get(clientId)
    if (apt.status === "completed") {
      client.total_visits++
      if (apt.payment_status === "paid" && apt.service?.price) {
        client.total_spent += Number(apt.service.price)
      }
    }

    // Update first and last visit dates
    if (new Date(apt.appointment_date) < new Date(client.first_visit)) {
      client.first_visit = apt.appointment_date
    }
    if (new Date(apt.appointment_date) > new Date(client.last_visit)) {
      client.last_visit = apt.appointment_date
    }
  })

  // Process appointment requests
  requestsData?.forEach((req) => {
    if (!req.client_id || !req.client) return

    const clientId = req.client_id
    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        id: clientId,
        full_name: req.client.full_name,
        email: req.client.email,
        phone: req.client.phone,
        total_visits: 0,
        total_spent: 0,
        first_visit: req.preferred_date,
        last_visit: req.preferred_date,
        is_favorite: false,
      })
    }
  })

  // Convert map to array and sort by last visit
  const clients = Array.from(clientsMap.values()).sort(
    (a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime(),
  )

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
                        <h3 className="text-lg font-semibold text-foreground">{client.full_name}</h3>
                        {client.is_favorite && <Star className="h-4 w-4 text-gold fill-gold" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Email: {client.email}</p>
                      <p className="text-sm text-muted-foreground mb-1">Telefone: {client.phone}</p>
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
