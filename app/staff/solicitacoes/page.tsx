import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApproveRequestButton } from "@/components/approve-request-button"
import { Clock, User, Calendar } from "lucide-react"

export default async function SolicitacoesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 20) {
    redirect("/cliente")
  }

  // Get pending appointment requests
  const { data: requests } = await supabase
    .from("appointment_requests")
    .select(`
      *,
      service:services(*),
      client:client_id(full_name, email, phone)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Solicitações de Agendamento</h1>
          <p className="text-muted-foreground">Aprove ou rejeite solicitações de clientes</p>
        </div>

        <div className="grid gap-6">
          {requests && requests.length > 0 ? (
            requests.map((request) => (
              <Card key={request.id} className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{request.service?.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Solicitado em {new Date(request.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gold mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">{request.client?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{request.client?.email}</p>
                          {request.client?.phone && (
                            <p className="text-sm text-muted-foreground">{request.client?.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gold mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Data Preferida</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.preferred_date).toLocaleDateString("pt-BR")}
                            {request.preferred_time && ` às ${request.preferred_time}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-gold mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Duração</p>
                          <p className="text-sm text-muted-foreground">{request.service?.duration} minutos</p>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-semibold text-foreground mb-1">Observações:</p>
                          <p className="text-sm text-muted-foreground">{request.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Valor do Serviço</p>
                        <p className="text-2xl font-bold text-primary">R$ {request.service?.price}</p>
                      </div>

                      <ApproveRequestButton
                        requestId={request.id}
                        clientId={request.client_id}
                        serviceId={request.service_id}
                        preferredDate={request.preferred_date}
                        preferredTime={request.preferred_time}
                        staffId={user.id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground text-lg">Nenhuma solicitação pendente no momento</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
