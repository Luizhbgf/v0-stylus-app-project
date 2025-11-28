"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle, XCircle, Clock, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function GerenciarAssinantes() {
  const [profile, setProfile] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

    const { data: subscriptionsData } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        client:profiles!client_id(full_name, email, phone),
        staff:profiles!staff_id(full_name),
        plan:subscription_plans(name)
      `,
      )
      .order("created_at", { ascending: false })

    setSubscriptions(subscriptionsData || [])
  }

  const handleValidatePayment = async (subscriptionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "pending" : "active"
      const nextBilling = new Date()
      nextBilling.setMonth(nextBilling.getMonth() + 1)

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: newStatus,
          next_billing_date: newStatus === "active" ? nextBilling.toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId)

      if (error) throw error

      toast.success(
        newStatus === "active" ? "Pagamento validado! Assinatura ativada." : "Assinatura marcada como pendente.",
      )
      loadData()
    } catch (error) {
      console.error("Erro ao validar pagamento:", error)
      toast.error("Erro ao atualizar assinatura")
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta assinatura?")) return

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId)

      if (error) throw error

      toast.success("Assinatura cancelada com sucesso")
      loadData()
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error)
      toast.error("Erro ao cancelar assinatura")
    }
  }

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.staff?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeCount = subscriptions.filter((s) => s.status === "active").length
  const pendingCount = subscriptions.filter((s) => s.status === "pending").length

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Gerenciar Assinantes</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Valide pagamentos mensais e gerencie o status das assinaturas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assinantes</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{subscriptions.length}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{activeCount}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/20 mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Assinante</Label>
              <Input
                id="search"
                placeholder="Nome do cliente, plano ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredSubscriptions.length > 0 ? (
            filteredSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="border-gold/20">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-foreground">{subscription.client?.full_name}</h3>
                        <Badge
                          variant={
                            subscription.status === "active"
                              ? "default"
                              : subscription.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {subscription.status === "active"
                            ? "Ativo"
                            : subscription.status === "pending"
                              ? "Pendente"
                              : "Cancelado"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium">Plano:</span> {subscription.plan?.name}
                        </p>
                        <p>
                          <span className="font-medium">Valor:</span> R$ {Number(subscription.price).toFixed(2)}
                        </p>
                        <p>
                          <span className="font-medium">Profissional:</span> {subscription.staff?.full_name}
                        </p>
                        <p>
                          <span className="font-medium">Início:</span>{" "}
                          {new Date(subscription.start_date).toLocaleDateString("pt-BR")}
                        </p>
                        {subscription.next_billing_date && (
                          <p>
                            <span className="font-medium">Próx. Cobrança:</span>{" "}
                            {new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {subscription.status !== "cancelled" && (
                        <>
                          <Button
                            onClick={() => handleValidatePayment(subscription.id, subscription.status)}
                            className={`w-full ${
                              subscription.status === "active"
                                ? "bg-yellow-600 hover:bg-yellow-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {subscription.status === "active" ? (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                Marcar Pendente
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Validar Pagamento
                              </>
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => handleCancelSubscription(subscription.id)}
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar Assinatura
                          </Button>
                        </>
                      )}
                      {subscription.status === "cancelled" && (
                        <p className="text-sm text-muted-foreground">
                          Cancelada em {new Date(subscription.cancelled_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gold mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum assinante encontrado com este termo" : "Nenhum assinante cadastrado"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
