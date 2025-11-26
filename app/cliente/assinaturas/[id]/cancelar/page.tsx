"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function CancelarAssinatura({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [reason, setReason] = useState("")
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

    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        plan:subscription_plans(name, description, price),
        staff:staff_id(full_name)
      `,
      )
      .eq("id", params.id)
      .eq("client_id", user.id)
      .single()

    if (!subscriptionData) {
      toast.error("Assinatura não encontrada")
      router.push("/cliente/assinaturas")
      return
    }

    if (subscriptionData.status === "cancelled") {
      toast.error("Esta assinatura já foi cancelada")
      router.push("/cliente/assinaturas")
      return
    }

    setSubscription(subscriptionData)
    setPlan(subscriptionData.plan)
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento")
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      // Update subscription status
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          auto_renew: false,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Assinatura cancelada com sucesso")
      router.push("/cliente/assinaturas")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar assinatura")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !subscription || !plan) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/cliente/assinaturas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Assinaturas
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Cancelar Assinatura</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Você está prestes a cancelar sua assinatura do plano {plan.name}
          </p>
        </div>

        <Card className="border-red-500/20 mb-6">
          <CardHeader className="bg-red-500/10">
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-foreground">
              Ao cancelar sua assinatura, você perderá acesso aos benefícios do plano <strong>{plan.name}</strong>.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>O cancelamento será efetivado imediatamente</li>
              <li>Você não será mais cobrado nas próximas renovações</li>
              <li>Poderá reativar a assinatura a qualquer momento</li>
              <li>Pagamentos já realizados não serão reembolsados</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Detalhes da Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-semibold text-foreground">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Profissional</span>
              <span className="font-semibold text-foreground">{subscription.staff?.full_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Mensal</span>
              <span className="text-xl font-bold text-primary">R$ {Number(plan.price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Data de Início</span>
              <span className="font-medium">{new Date(subscription.start_date).toLocaleDateString("pt-BR")}</span>
            </div>
            {subscription.next_billing_date && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Próxima Cobrança</span>
                <span className="font-medium">
                  {new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Motivo do Cancelamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Por favor, nos conte por que você está cancelando (obrigatório)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Não estou mais precisando do serviço, problemas financeiros, insatisfação com o atendimento, etc."
              className="min-h-[120px]"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Seu feedback é muito importante para melhorarmos nossos serviços
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="sm:w-auto"
          >
            Manter Assinatura
          </Button>
        </div>
      </div>
    </div>
  )
}
