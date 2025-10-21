import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function SolicitacoesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 10) {
    redirect("/auth/login")
  }

  // Get all appointment requests
  const { data: requests } = await supabase
    .from("appointment_requests")
    .select(
      `
      *,
      service:services(*)
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })

  const pendingRequests = requests?.filter((r) => r.status === "pending") || []
  const approvedRequests = requests?.filter((r) => r.status === "approved") || []
  const rejectedRequests = requests?.filter((r) => r.status === "rejected") || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/cliente" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Acompanhamento de Solicitações</h1>
          <p className="text-muted-foreground">Acompanhe o status das suas solicitações de agendamento</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Aguardando Aprovação</span>
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Aprovadas</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{approvedRequests.length}</div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recusadas</span>
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{rejectedRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        {requests && requests.length > 0 ? (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Aguardando Aprovação</h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="border-yellow-500/20 bg-yellow-500/5">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-3">{request.service?.name}</h3>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2 text-gold" />
                                Data preferida: {new Date(request.preferred_date).toLocaleDateString("pt-BR")}
                                {request.preferred_time && ` às ${request.preferred_time}`}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2 text-gold" />
                                Solicitado em: {new Date(request.created_at).toLocaleDateString("pt-BR")}
                              </div>
                              {request.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  <strong>Observações:</strong> {request.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 mb-3">
                              <AlertCircle className="h-3 w-3" />
                              Aguardando
                            </span>
                            <div className="text-xl font-bold text-gold">R$ {request.service?.price}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {approvedRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Aprovadas</h2>
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <Card key={request.id} className="border-green-500/20 bg-green-500/5">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-3">{request.service?.name}</h3>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2 text-gold" />
                                Data agendada:{" "}
                                {request.approved_date
                                  ? new Date(request.approved_date).toLocaleDateString("pt-BR")
                                  : "A definir"}
                                {request.approved_time && ` às ${request.approved_time}`}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Aprovado em: {new Date(request.updated_at).toLocaleDateString("pt-BR")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 mb-3">
                              <CheckCircle className="h-3 w-3" />
                              Aprovada
                            </span>
                            <div className="text-xl font-bold text-gold">R$ {request.service?.price}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {rejectedRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Recusadas</h2>
                <div className="space-y-4">
                  {rejectedRequests.map((request) => (
                    <Card key={request.id} className="border-red-500/20 bg-red-500/5">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-3">{request.service?.name}</h3>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2 text-gold" />
                                Data solicitada: {new Date(request.preferred_date).toLocaleDateString("pt-BR")}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                Recusado em: {new Date(request.updated_at).toLocaleDateString("pt-BR")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 mb-3">
                              <XCircle className="h-3 w-3" />
                              Recusada
                            </span>
                            <Button size="sm" className="bg-gold hover:bg-gold/90 text-black">
                              Solicitar Novamente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-gold/20">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma solicitação ainda</h3>
              <p className="text-muted-foreground mb-6">Faça sua primeira solicitação de agendamento</p>
              <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                <Link href="/agendar">Nova Solicitação</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
