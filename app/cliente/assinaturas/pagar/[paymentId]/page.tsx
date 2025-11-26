"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Copy, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function PagarAssinatura({ params }: { params: { paymentId: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [pixCode, setPixCode] = useState("")
  const [isCopied, setIsCopied] = useState(false)
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

    const { data: paymentData } = await supabase
      .from("subscription_payments")
      .select(
        `
        *,
        subscription:subscriptions(
          *,
          plan:subscription_plans(name, description)
        )
      `,
      )
      .eq("id", params.paymentId)
      .single()

    if (!paymentData) {
      toast.error("Pagamento não encontrado")
      router.push("/cliente/assinaturas")
      return
    }

    setPayment(paymentData)
    setSubscription(paymentData.subscription)

    // Generate PIX code if not exists
    if (!paymentData.pix_copy_paste) {
      await generatePixCode(paymentData)
    } else {
      setPixCode(paymentData.pix_copy_paste)
    }
  }

  const generatePixCode = async (paymentData: any) => {
    // Generate a simple PIX code (in production, integrate with payment gateway)
    const pixKey = "pix@styllus.com.br" // Replace with actual PIX key from env
    const amount = Number(paymentData.amount).toFixed(2)
    const txid = `SUB${paymentData.subscription_id.slice(0, 8).toUpperCase()}${Date.now()}`

    // Simplified PIX format (in production, use proper PIX payload format)
    const pixCopyPaste = `${pixKey}|${amount}|${txid}|Assinatura Styllus`

    setPixCode(pixCopyPaste)

    // Update database with PIX info
    await supabase
      .from("subscription_payments")
      .update({
        pix_copy_paste: pixCopyPaste,
        pix_txid: txid,
        pix_key: pixKey,
      })
      .eq("id", params.paymentId)
  }

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    setIsCopied(true)
    toast.success("Código PIX copiado!")
    setTimeout(() => setIsCopied(false), 3000)
  }

  const handleConfirmPayment = async () => {
    setIsLoading(true)
    try {
      // In production, this would verify payment with payment gateway
      // For now, we'll just mark as pending for staff verification
      const { error } = await supabase
        .from("subscription_payments")
        .update({
          payment_status: "pending",
        })
        .eq("id", params.paymentId)

      if (error) throw error

      toast.success("Pagamento registrado! Aguarde confirmação do profissional.")
      router.push("/cliente/assinaturas")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar pagamento")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !payment || !subscription) return null

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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pagar Assinatura</h1>
          <p className="text-sm md:text-base text-muted-foreground">Plano: {subscription.plan?.name}</p>
        </div>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detalhes do Pagamento</span>
              <Badge variant={payment.payment_status === "paid" ? "default" : "secondary"}>
                {payment.payment_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor</span>
              <span className="text-2xl font-bold text-primary">R$ {Number(payment.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vencimento</span>
              <span className="font-medium">{new Date(payment.due_date).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Método</span>
              <span className="font-medium">PIX</span>
            </div>
          </CardContent>
        </Card>

        {payment.payment_status === "pending" || payment.payment_status === "paid" ? (
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              {payment.payment_status === "paid" ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Pagamento Confirmado!</h3>
                  <p className="text-muted-foreground">Seu pagamento foi processado com sucesso.</p>
                </>
              ) : (
                <>
                  <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Aguardando Confirmação</h3>
                  <p className="text-muted-foreground">
                    Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Pagar com PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Instruções:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Copie o código PIX abaixo</li>
                  <li>Abra o aplicativo do seu banco</li>
                  <li>Escolha a opção PIX Copia e Cola</li>
                  <li>Cole o código e confirme o pagamento</li>
                  <li>Após pagar, clique em "Confirmei o Pagamento"</li>
                </ol>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Código PIX:</label>
                <div className="relative">
                  <div className="p-4 bg-muted rounded-lg border border-primary/20 break-all text-sm font-mono">
                    {pixCode || "Gerando código..."}
                  </div>
                  {pixCode && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyPixCode}
                      className="absolute top-2 right-2 bg-primary hover:bg-primary/90 text-black"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  <strong>Importante:</strong> Após realizar o pagamento via PIX, clique no botão abaixo para que
                  possamos confirmar sua transação.
                </p>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={isLoading || !pixCode}
                className="w-full bg-primary hover:bg-primary/90 text-black"
              >
                {isLoading ? "Processando..." : "Confirmei o Pagamento"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20 mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Precisa de ajuda?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Entre em contato conosco pelo WhatsApp ou email se tiver alguma dúvida sobre o pagamento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
