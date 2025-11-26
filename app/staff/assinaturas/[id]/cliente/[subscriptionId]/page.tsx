"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DetalhesClienteAssinatura({
  params,
}: {
  params: { id: string; subscriptionId: string }
}) {
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [newPaymentStatus, setNewPaymentStatus] = useState<"paid" | "failed">("paid")
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
        client:profiles!subscriptions_client_id_fkey(full_name, email, phone),
        plan:subscription_plans(name, price)
      `,
      )
      .eq("id", params.subscriptionId)
      .single()

    setSubscription(subscriptionData)

    const { data: paymentsData } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("subscription_id", params.subscriptionId)
      .order("created_at", { ascending: false })

    setPayments(paymentsData || [])
  }

  const handleUpdatePaymentStatus = async () => {
    if (!selectedPaymentId) return
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("subscription_payments")
        .update({
          payment_status: newPaymentStatus,
          paid_at: newPaymentStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", selectedPaymentId)

      if (error) throw error

      toast.success("Status do pagamento atualizado!")
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Tem certeza que deseja cancelar esta assinatura?")) return

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: profile.id,
        })
        .eq("id", params.subscriptionId)

      if (error) throw error

      toast.success("Assinatura cancelada")
      router.push(`/staff/assinaturas/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar assinatura")
    }
  }

  if (!profile || !subscription) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="mb-6">
          <Link
            href={`/staff/assinaturas/${params.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Plano
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {subscription.client?.full_name || "Cliente sem nome"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">Assinatura: {subscription.plan?.name}</p>
            </div>
            <Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold text-primary">R$ {subscription.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Início</p>
                  <p className="text-lg font-bold">{new Date(subscription.start_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximo Pagamento</p>
                  <p className="text-lg font-bold">
                    {subscription.next_billing_date
                      ? new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{subscription.client?.full_name || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{subscription.client?.email || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{subscription.client?.phone || "Não informado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {payment.payment_status === "paid" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : payment.payment_status === "failed" ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Calendar className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-semibold">R$ {payment.amount}</p>
                            <p className="text-sm text-muted-foreground">
                              Vencimento: {new Date(payment.due_date).toLocaleDateString("pt-BR")}
                            </p>
                            {payment.paid_at && (
                              <p className="text-sm text-green-600">
                                Pago em: {new Date(payment.paid_at).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              payment.payment_status === "paid"
                                ? "default"
                                : payment.payment_status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {payment.payment_status}
                          </Badge>
                          {payment.payment_status === "pending" && (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedPaymentId(payment.id)}>
                                  Atualizar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Atualizar Status do Pagamento</DialogTitle>
                                  <DialogDescription>
                                    Altere o status do pagamento conforme necessário
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Novo Status</Label>
                                    <Select
                                      value={newPaymentStatus}
                                      onValueChange={(value: any) => setNewPaymentStatus(value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="paid">Pago</SelectItem>
                                        <SelectItem value="failed">Falhou</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleUpdatePaymentStatus}
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-black"
                                  >
                                    {isLoading ? "Atualizando..." : "Confirmar"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nenhum pagamento registrado</p>
            )}
          </CardContent>
        </Card>

        {subscription.status === "active" && (
          <div className="flex justify-end">
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Cancelar Assinatura
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
