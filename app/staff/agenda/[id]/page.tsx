"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Clock, User, DollarSign, X, UserX, CheckCircle, Edit2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function GerenciarAgendamento() {
  const [profile, setProfile] = useState<any>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const router = useRouter()
  const params = useParams()
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

    // Load appointment
    const { data: appointmentData } = await supabase
      .from("appointments")
      .select(
        `
        *,
        service:services(*),
        client:client_id(full_name, phone, email),
        staff:staff_id(full_name)
      `,
      )
      .eq("id", params.id)
      .single()

    if (appointmentData) {
      setAppointment(appointmentData)
      const currentPrice = appointmentData.custom_price || appointmentData.service?.price || 0
      setNewPrice(currentPrice.toString())
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          payment_status: "paid",
        })
        .eq("id", appointment.id)

      if (error) throw error

      toast.success("Agendamento marcado como concluído!")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao concluir agendamento:", error)
      toast.error("Erro ao concluir agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNoShow = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "no_show",
        })
        .eq("id", appointment.id)

      if (error) throw error

      toast.success("Cliente marcado como não compareceu")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao marcar não comparecimento:", error)
      toast.error("Erro ao marcar não comparecimento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
        })
        .eq("id", appointment.id)

      if (error) throw error

      toast.success("Agendamento cancelado")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao cancelar agendamento:", error)
      toast.error("Erro ao cancelar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePrice = async () => {
    setIsLoading(true)
    try {
      const priceValue = Number.parseFloat(newPrice)
      if (isNaN(priceValue) || priceValue < 0) {
        toast.error("Preço inválido")
        return
      }

      const { error } = await supabase
        .from("appointments")
        .update({ custom_price: priceValue })
        .eq("id", appointment.id)

      if (error) throw error

      toast.success("Preço atualizado com sucesso!")
      setIsEditingPrice(false)
      loadData()
    } catch (error) {
      console.error("[v0] Erro ao atualizar preço:", error)
      toast.error("Erro ao atualizar preço")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !appointment) return null

  const appointmentDate = new Date(appointment.appointment_date)
  const displayPrice = appointment.custom_price || appointment.service?.price || 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/staff/agenda"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agenda
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Agendamento</h1>
          <p className="text-muted-foreground">Visualize e gerencie os detalhes do agendamento</p>
        </div>

        <div className="space-y-6">
          <Card className="border-gold/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes do Agendamento</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    appointment.status === "completed"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : appointment.status === "confirmed"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : appointment.status === "cancelled"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : appointment.status === "no_show"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }
                >
                  {appointment.status === "completed"
                    ? "Concluído"
                    : appointment.status === "confirmed"
                      ? "Confirmado"
                      : appointment.status === "cancelled"
                        ? "Cancelado"
                        : appointment.status === "no_show"
                          ? "Não Compareceu"
                          : "Pendente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gold mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data e Hora</p>
                  <p className="text-foreground font-medium">
                    {appointmentDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-foreground font-medium">
                    {appointmentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {appointment.service && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Serviço</p>
                    <p className="text-foreground font-medium">{appointment.service.name}</p>
                    <p className="text-sm text-muted-foreground">{appointment.service.duration} minutos</p>
                  </div>
                </div>
              )}

              {appointment.client_type === "sporadic" ? (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente Esporádico</p>
                    <p className="text-foreground font-medium">{appointment.sporadic_client_name}</p>
                    <p className="text-sm text-muted-foreground">{appointment.sporadic_client_phone}</p>
                  </div>
                </div>
              ) : appointment.client ? (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="text-foreground font-medium">{appointment.client.full_name}</p>
                    <p className="text-sm text-muted-foreground">{appointment.client.phone}</p>
                    <p className="text-sm text-muted-foreground">{appointment.client.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Evento</p>
                    <p className="text-foreground font-medium">{appointment.event_title || "Sem título"}</p>
                  </div>
                </div>
              )}

              {appointment.service?.price && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gold mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium text-lg">R$ {displayPrice.toFixed(2)}</p>
                        {appointment.custom_price && (
                          <p className="text-xs text-muted-foreground">
                            (Preço original: R$ {appointment.service.price.toFixed(2)})
                          </p>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            appointment.payment_status === "paid"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : appointment.payment_status === "overdue"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          }
                        >
                          {appointment.payment_status === "paid"
                            ? "Pago"
                            : appointment.payment_status === "overdue"
                              ? "Atrasado"
                              : "Pendente"}
                        </Badge>
                      </div>
                      <Dialog open={isEditingPrice} onOpenChange={setIsEditingPrice}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar Valor
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Valor do Agendamento</DialogTitle>
                            <DialogDescription>
                              Altere o valor apenas para este agendamento específico. O preço do serviço permanece
                              inalterado.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="price">Novo Valor (R$)</Label>
                              <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder="0.00"
                              />
                              <p className="text-xs text-muted-foreground">
                                Preço padrão do serviço: R$ {appointment.service.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditingPrice(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleUpdatePrice} disabled={isLoading}>
                              {isLoading ? "Salvando..." : "Salvar"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div className="pt-4 border-t border-gold/20">
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-foreground">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {appointment.status !== "completed" &&
            appointment.status !== "cancelled" &&
            appointment.status !== "no_show" && (
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar como Concluído
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar conclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja marcar este agendamento como concluído? O pagamento será marcado como
                          pago.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleComplete}>Confirmar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-orange-500/20 text-orange-500 hover:bg-orange-500/10 bg-transparent"
                        disabled={isLoading}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Cliente Não Compareceu
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar não comparecimento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que o cliente não compareceu ao agendamento?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleNoShow} className="bg-orange-500 hover:bg-orange-600">
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={isLoading}>
                        <X className="mr-2 h-4 w-4" />
                        Cancelar Agendamento
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                          Cancelar Agendamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
