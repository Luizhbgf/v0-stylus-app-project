import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, DollarSign, Mail, Phone, Filter } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: { search?: string; staffId?: string; minVisits?: string; dateFrom?: string; dateTo?: string }
}) {
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

  const { data: staffList } = await supabase
    .from("profiles")
    .select("id, full_name")
    .gte("user_level", 20)
    .order("full_name")

  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      status,
      payment_status,
      client_id,
      client_type,
      staff_id,
      sporadic_client_name,
      service:services(price),
      client:profiles!client_id(id, full_name, email, phone)
    `,
    )
    .neq("status", "cancelled")

  if (searchParams.staffId) {
    appointmentsQuery = appointmentsQuery.eq("staff_id", searchParams.staffId)
  }

  if (searchParams.dateFrom) {
    appointmentsQuery = appointmentsQuery.gte("appointment_date", searchParams.dateFrom)
  }

  if (searchParams.dateTo) {
    appointmentsQuery = appointmentsQuery.lte("appointment_date", searchParams.dateTo)
  }

  const { data: appointmentsData } = await appointmentsQuery

  const clientsMap = new Map()

  appointmentsData?.forEach((apt) => {
    let clientId: string
    let clientName: string
    let clientEmail: string
    let clientPhone: string

    if (apt.client_type === "sporadic") {
      clientId = `sporadic-${apt.sporadic_client_name}-${apt.staff_id}`
      clientName = apt.sporadic_client_name || "Cliente Esporádico"
      clientEmail = "N/A"
      clientPhone = "N/A"
    } else if (apt.client_id && apt.client) {
      clientId = apt.client_id
      clientName = apt.client.full_name
      clientEmail = apt.client.email
      clientPhone = apt.client.phone || "N/A"
    } else {
      return
    }

    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        id: clientId,
        full_name: clientName,
        email: clientEmail,
        phone: clientPhone,
        total_visits: 0,
        total_spent: 0,
        first_visit: apt.appointment_date,
        last_visit: apt.appointment_date,
        is_sporadic: apt.client_type === "sporadic",
      })
    }

    const client = clientsMap.get(clientId)

    if (apt.status === "completed" || apt.status === "confirmed") {
      client.total_visits++
    }

    if ((apt.payment_status === "paid" || apt.status === "completed") && apt.service?.price) {
      client.total_spent += Number(apt.service.price)
    }

    if (new Date(apt.appointment_date) < new Date(client.first_visit)) {
      client.first_visit = apt.appointment_date
    }
    if (new Date(apt.appointment_date) > new Date(client.last_visit)) {
      client.last_visit = apt.appointment_date
    }
  })

  let clients = Array.from(clientsMap.values())

  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase()
    clients = clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(searchParams.search!),
    )
  }

  if (searchParams.minVisits) {
    const minVisits = Number.parseInt(searchParams.minVisits)
    clients = clients.filter((c) => c.total_visits >= minVisits)
  }

  clients.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime())

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Todos os Clientes</h1>
          <p className="text-muted-foreground">Gerenciar e visualizar todos os clientes do sistema</p>
        </div>

        <Card className="border-gold/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action="" method="get" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Profissional</Label>
                  <select
                    id="staffId"
                    name="staffId"
                    defaultValue={searchParams.staffId || ""}
                    className="w-full border border-gold/20 rounded-md px-3 py-2 bg-background"
                  >
                    <option value="">Todos</option>
                    {staffList?.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Cliente</Label>
                  <Input
                    type="text"
                    id="search"
                    name="search"
                    placeholder="Nome, email ou telefone"
                    defaultValue={searchParams.search || ""}
                    className="border-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minVisits">Visitas Mínimas</Label>
                  <Input
                    type="number"
                    id="minVisits"
                    name="minVisits"
                    placeholder="Ex: 5"
                    defaultValue={searchParams.minVisits || ""}
                    className="border-gold/20"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Data Inicial</Label>
                  <Input
                    type="date"
                    id="dateFrom"
                    name="dateFrom"
                    defaultValue={searchParams.dateFrom || ""}
                    className="border-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Data Final</Label>
                  <Input
                    type="date"
                    id="dateTo"
                    name="dateTo"
                    defaultValue={searchParams.dateTo || ""}
                    className="border-gold/20"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-gold hover:bg-gold/90 text-black">
                  Aplicar Filtros
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/clientes">Limpar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {clients && clients.length > 0 ? (
            clients.map((client) => (
              <Card key={client.id} className="border-gold/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gold/10 rounded-lg">
                        <Users className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{client.full_name}</h3>
                          {client.is_sporadic && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                              Esporádico
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {client.email !== "N/A" && (
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {client.email}
                            </p>
                          )}
                          {client.phone !== "N/A" && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {client.phone}
                            </p>
                          )}
                          <p className="text-xs">
                            Primeira visita: {new Date(client.first_visit).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-xs">
                            Última visita: {new Date(client.last_visit).toLocaleDateString("pt-BR")}
                          </p>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gold mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
