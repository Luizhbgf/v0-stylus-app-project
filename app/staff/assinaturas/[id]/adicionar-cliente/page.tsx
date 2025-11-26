"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

export default function AdicionarClienteAssinatura({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("pending")
  const [isLoading, setIsLoading] = useState(false)
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
    setProfile(profileData)

    const { data: planData } = await supabase.from("subscription_plans").select("*").eq("id", params.id).single()
    setPlan(planData)

    // Load clients
    const { data: clientsData } = await supabase.from("profiles").select("*").eq("user_level", 1).order("full_name")

    setClients(clientsData || [])
  }

  const filteredClients = clients.filter(
    (client) =>
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!selectedClientId) {
        toast.error("Selecione um cliente")
        setIsLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      // Check if client already has active subscription for this plan
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("plan_id", params.id)
        .eq("client_id", selectedClientId)
        .eq("status", "active")
        .single()

      if (existing) {
        toast.error("Cliente já possui assinatura ativa para este plano")
        setIsLoading(false)
        return
      }

      // Calculate next billing date based on plan frequency
      const start = new Date(startDate)
      const nextBilling = new Date(start)

      if (plan.billing_frequency === "weekly") {
        nextBilling.setDate(nextBilling.getDate() + 7)
      } else if (plan.billing_frequency === "biweekly") {
        nextBilling.setDate(nextBilling.getDate() + 14)
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1)
      }

      // Create subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          plan_id: params.id,
          client_id: selectedClientId,
          staff_id: user.id,
          status: "active",
          start_date: startDate,
          next_billing_date: nextBilling.toISOString(),
          price: plan.price,
          plan_name: plan.name,
          description: plan.description,
          billing_cycle: plan.billing_frequency,
          auto_renew: true,
        })
        .select()
        .single()

      if (subscriptionError) throw subscriptionError

      // Create first payment record
      const { error: paymentError } = await supabase.from("subscription_payments").insert({
        subscription_id: subscription.id,
        amount: plan.price,
        payment_method: "pix",
        payment_status: paymentStatus,
        due_date: startDate,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
      })

      if (paymentError) throw paymentError

      toast.success("Cliente adicionado à assinatura com sucesso!")
      router.push(`/staff/assinaturas/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !plan) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/staff/assinaturas/${params.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Detalhes do Plano
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Adicionar Cliente à Assinatura</h1>
          <p className="text-sm md:text-base text-muted-foreground">Plano: {plan.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Selecionar Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome, email ou telefone..."
                    className="border-primary/20 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Clientes Disponíveis</Label>
                <div className="max-h-64 overflow-y-auto border border-primary/20 rounded-lg">
                  {filteredClients.length > 0 ? (
                    <div className="divide-y divide-primary/10">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => setSelectedClientId(client.id)}
                          className={`w-full p-4 text-left hover:bg-primary/5 transition-colors ${
                            selectedClientId === client.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <p className="font-semibold">{client.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Detalhes da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Status do Primeiro Pagamento</Label>
                  <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Resumo</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Plano:</span>
                    <span className="font-semibold">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Mensal:</span>
                    <span className="font-semibold text-primary">R$ {plan.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Periodicidade:</span>
                    <span className="font-semibold capitalize">{plan.billing_frequency}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-black"
              disabled={isLoading || !selectedClientId}
            >
              {isLoading ? "Adicionando..." : "Adicionar Cliente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
