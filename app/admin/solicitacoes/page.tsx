"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

type Request = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  user: {
    full_name: string
  }
}

export default function AdminSolicitacoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profileData || profileData.user_level < 30) {
        router.push("/cliente")
        return
      }

      setProfile(profileData)
      setLoading(false)
      loadRequests()
    }

    loadData()
  }, [router, supabase])

  async function loadRequests() {
    let query = supabase
      .from("requests")
      .select(
        `
        *,
        user:user_id(full_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data } = await query
    setRequests((data as any) || [])
  }

  useEffect(() => {
    if (profile) {
      loadRequests()
    }
  }, [filter, profile])

  async function updateRequestStatus(id: string, status: string) {
    const { error } = await supabase.from("requests").update({ status }).eq("id", id)

    if (error) {
      toast.error("Erro ao atualizar status")
      return
    }

    toast.success("Status atualizado")
    loadRequests()
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length
  const completedCount = requests.filter((r) => r.status === "completed").length

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Solicitações</h1>
          <p className="text-muted-foreground">Gerencie todas as solicitações de clientes e staff</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{inProgressCount}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/20 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Filtrar por Status</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px] border-gold/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-gold/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{request.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Por: {request.user?.full_name}</p>
                    <p className="text-sm text-foreground">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(request.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : request.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-500"
                            : request.status === "completed"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {request.status === "pending"
                        ? "Pendente"
                        : request.status === "in_progress"
                          ? "Em Andamento"
                          : request.status === "completed"
                            ? "Concluída"
                            : "Rejeitada"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.priority === "high"
                          ? "bg-red-500/10 text-red-500"
                          : request.priority === "medium"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-green-500/10 text-green-500"
                      }`}
                    >
                      {request.priority === "high" ? "Alta" : request.priority === "medium" ? "Média" : "Baixa"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {request.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, "in_progress")}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Iniciar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, "rejected")}
                        className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {request.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, "completed")}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {requests.length === 0 && (
            <Card className="border-gold/20">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
