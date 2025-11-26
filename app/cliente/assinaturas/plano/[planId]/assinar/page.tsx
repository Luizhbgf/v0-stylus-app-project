"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Check, X } from "lucide-react"
import Link from "next/link"

export default function AssinarPlano({ params }: { params: { planId: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [features, setFeatures] = useState<any[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)
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

    const { data: planData } = await supabase
      .from("subscription_plans")
      .select(
        `
        *,
        staff:staff_id(full_name, avatar_url)
      `,
      )
      .eq("id", params.planId)
      .single()

    setPlan(planData)

    const { data: featuresData } = await supabase
      .from("subscription_plan_features")
      .select("*")
      .eq("plan_id", params.planId)
      .order("display_order")

    setFeatures(featuresData || [])
  }

  const handleSubscribe = async () => {
    if (!agreedToTerms) {
      toast.error("Você deve concordar com os termos para continuar")
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      // Check if already has active subscription
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("plan_id", params.planId)
        .eq("client_id", user.id)
        .in("status", ["active", "pending"])
        .single()

      if (existing) {
        toast.error("Você já possui uma assinatura ativa ou pendente para este plano")
        router.push("/cliente/assinaturas")
        return
      }

      // Calculate next billing date
      const startDate = new Date()
      const nextBilling = new Date(startDate)

      if (plan.billing_frequency === "weekly") {
        nextBilling.setDate(nextBilling.getDate() + 7)
      } else if (plan.billing_frequency === "biweekly") {
        nextBilling.setDate(nextBilling.getDate() + 14)
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1)
      }

      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          plan_id: params.planId,
          client_id: user.id,
          staff_id: plan.staff_id,
          status: "pending", // Changed from "active" to "pending"
          start_date: startDate.toISOString(),
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

      // Create first payment
      const { data: payment, error: paymentError } = await supabase
        .from("subscription_payments")
        .insert({
          subscription_id: subscription.id,
          amount: plan.price,
          payment_method: "pix",
          payment_status: "pending",
          due_date: startDate.toISOString(),
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      toast.success("Assinatura criada! Complete o pagamento para ativar.")
      router.push(`/cliente/assinaturas/pagar/${payment.id}`)
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar assinatura")
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
            href="/cliente/assinaturas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Planos
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Assinar Plano</h1>
          <p className="text-sm md:text-base text-muted-foreground">{plan.name}</p>
        </div>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Resumo do Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-semibold text-foreground">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Profissional</span>
              <span className="font-semibold text-foreground">{plan.staff?.full_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Mensal</span>
              <span className="text-2xl font-bold text-primary">R$ {Number(plan.price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Periodicidade</span>
              <span className="font-semibold text-foreground capitalize">{plan.billing_frequency}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Recursos Inclusos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature.id} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      feature.is_included ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {feature.is_included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                  <p
                    className={`text-sm flex-1 ${
                      feature.is_included ? "text-foreground" : "text-muted-foreground line-through"
                    }`}
                  >
                    {feature.feature_text}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {plan.terms && (
          <Card className="border-primary/20 mb-6">
            <CardHeader>
              <CardTitle>Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.terms}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(!!checked)} />
              <div className="flex-1">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Concordo com os termos e condições da assinatura
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Ao assinar, você concorda com a cobrança mensal automática e está ciente das condições do plano.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || !agreedToTerms}
            className="flex-1 bg-primary hover:bg-primary/90 text-black"
          >
            {isLoading ? "Processando..." : "Assinar e Pagar"}
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
      </div>
    </div>
  )
}
