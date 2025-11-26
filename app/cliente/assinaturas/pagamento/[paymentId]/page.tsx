"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Copy, CheckCircle, Clock, QrCode } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

function generatePixPayload(
  pixKey: string,
  amount: number,
  merchantName: string,
  merchantCity: string,
  txid: string,
): string {
  const pixKeyEncoded = pixKey.trim()
  const amountStr = amount.toFixed(2)
  const txidStr = txid.substring(0, 25)

  // Format EMV QR Code (simplified version for Brazilian PIX)
  const payload = [
    "000201", // Payload Format Indicator
    "010212", // Point of Initiation Method (12 = static)
    `26${(pixKeyEncoded.length + 14).toString().padStart(2, "0")}0014br.gov.bcb.pix01${pixKeyEncoded.length
      .toString()
      .padStart(2, "0")}${pixKeyEncoded}`,
    "52040000", // Merchant Category Code
    "5303986", // Transaction Currency (986 = BRL)
    `54${amountStr.length.toString().padStart(2, "0")}${amountStr}`,
    "5802BR", // Country Code
    `59${merchantName.length.toString().padStart(2, "0")}${merchantName}`,
    `60${merchantCity.length.toString().padStart(2, "0")}${merchantCity}`,
    `62${(txidStr.length + 8).toString().padStart(2, "0")}05${txidStr.length.toString().padStart(2, "0")}${txidStr}`,
  ].join("")

  // Calculate CRC16 checksum
  const crc = calculateCRC16(payload + "6304")
  return payload + "6304" + crc
}

function calculateCRC16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0")
}

export default function PagarAssinatura({ params }: { params: { paymentId: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [pixCode, setPixCode] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
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

    const { data: settingsData } = await supabase
      .from("homepage_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()
    setBusinessSettings(settingsData)

    const { data: paymentData } = await supabase
      .from("subscription_payments")
      .select(
        `
        *,
        subscription:subscriptions(
          *,
          plan:subscription_plans(name, description),
          staff:staff_id(full_name, pix_key, phone)
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

    if (!paymentData.pix_copy_paste) {
      await generatePixCode(paymentData, settingsData)
    } else {
      setPixCode(paymentData.pix_copy_paste)
    }
  }

  const generatePixCode = async (paymentData: any, settings: any) => {
    const staffPixKey = paymentData.subscription?.staff?.pix_key || settings?.business_pix_key || ""

    if (!staffPixKey) {
      toast.error("Chave PIX não configurada. Entre em contato com o estabelecimento.")
      return
    }

    const amount = Number(paymentData.amount)
    const merchantName = paymentData.subscription?.staff?.full_name || settings?.business_name || "Styllus"
    const merchantCity = "Sao Paulo" // You can make this configurable
    const txid = `SUB${paymentData.subscription_id.slice(0, 8).toUpperCase()}`

    // Generate EMV-compliant PIX payload
    const pixCopyPaste = generatePixPayload(staffPixKey, amount, merchantName, merchantCity, txid)

    setPixCode(pixCopyPaste)

    // Update database with PIX info
    await supabase
      .from("subscription_payments")
      .update({
        pix_copy_paste: pixCopyPaste,
        pix_txid: txid,
        pix_key: staffPixKey,
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
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Pagar com PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {pixCode && (
                <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white rounded-lg border-2 border-primary/20">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG value={pixCode} size={256} level="M" includeMargin />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Escaneie o QR Code com o aplicativo do seu banco
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Instruções:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Escaneie o QR Code acima com seu app bancário, OU</li>
                  <li>Copie o código PIX abaixo</li>
                  <li>Abra o aplicativo do seu banco</li>
                  <li>Escolha a opção PIX Copia e Cola</li>
                  <li>Cole o código e confirme o pagamento</li>
                  <li>Após pagar, clique em "Confirmei o Pagamento"</li>
                </ol>
                {subscription?.staff && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-1">Pagamento para:</p>
                    <p className="text-sm text-foreground">{subscription.staff.full_name}</p>
                    {subscription.staff.pix_key && (
                      <p className="text-xs text-muted-foreground mt-1">Chave PIX: {subscription.staff.pix_key}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Código PIX Copia e Cola:</label>
                <div className="relative">
                  <div className="p-4 bg-muted rounded-lg border border-primary/20 break-all text-xs font-mono max-h-32 overflow-y-auto">
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
