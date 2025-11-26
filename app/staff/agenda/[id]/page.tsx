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
import { ArrowLeft, Calendar, Clock, User, DollarSign, X, UserX, CheckCircle, Edit2, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentChoice, setPaymentChoice] = useState<"paid" | "later" | null>(null)
  const [showNoShowDialog, setShowNoShowDialog] = useState(false)
  const [noShowReason, setNoShowReason] = useState("")
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

    const { data: servicesData } = await supabase.from("services").select("*").eq("is_active", true).order("name")
    setServices(servicesData || [])

    const { data: clientsData } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("user_level", 10)
      .order("full_name")
    setClients(clientsData || [])

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

      const appointmentDate = new Date(appointmentData.appointment_date)
      setEditData({
        appointment_date: appointmentDate.toISOString().split("T")[0],
        appointment_time: appointmentDate.toTimeString().slice(0, 5),
        service_id: appointmentData.service_id || "",
        client_id: appointmentData.client_id || "",
        client_type: appointmentData.client_type || "registered",
        sporadic_client_name: appointmentData.sporadic_client_name || "",
        sporadic_client_phone: appointmentData.sporadic_client_phone || "",
        event_title: appointmentData.event_title || "",
        custom_price: currentPrice.toString(),
        payment_status: appointmentData.payment_status || "pending",
        notes: appointmentData.notes || "",
      })
    }
  }

  const handleSaveEdit = async () => {
    setIsLoading(true)
    try {
      const appointmentDateTime = new Date(`${editData.appointment_date}T${editData.appointment_time}`)

      const updateData: any = {
        appointment_date: appointmentDateTime.toISOString(),
        service_id: editData.service_id || null,
        client_type: editData.client_type,
        payment_status: editData.payment_status,
        notes: editData.notes || null,
        custom_price: editData.custom_price ? Number.parseFloat(editData.custom_price) : null,
      }

      if (editData.client_type === "registered") {
        updateData.client_id = editData.client_id || null
        updateData.sporadic_client_name = null
        updateData.sporadic_client_phone = null
        updateData.event_title = null
      } else if (editData.client_type === "sporadic") {
        updateData.client_id = null
        updateData.sporadic_client_name = editData.sporadic_client_name
        updateData.sporadic_client_phone = editData.sporadic_client_phone
        updateData.event_title = null
      } else if (editData.client_type === "event") {
        updateData.client_id = null
        updateData.sporadic_client_name = null
        updateData.sporadic_client_phone = null
        updateData.event_title = editData.event_title
      }

      const { error } = await supabase.from("appointments").update(updateData).eq("id", appointment.id)

      if (error) throw error

      toast.success("Agendamento atualizado com sucesso!")
      setIsEditing(false)
      loadData()
    } catch (error) {
      console.error("[v0] Erro ao atualizar agendamento:", error)
      toast.error("Erro ao atualizar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setShowPaymentDialog(true)
  }

  const handleConfirmPayment = async () => {
    if (!paymentChoice) {
      toast.error("Selecione uma opção de pagamento")
      return
    }

    setIsLoading(true)
    try {
      const updates: any = {
        status: "completed",
      }

      if (paymentChoice === "paid") {
        updates.payment_status = "paid"
        updates.pay_later = false
      } else {
        updates.payment_status = "pending"
        updates.pay_later = true
      }

      const { error } = await supabase.from("appointments").update(updates).eq("id", appointment.id)

      if (error) throw error

      toast.success(
        paymentChoice === "paid"
          ? "Agendamento concluído e marcado como pago!"
          : "Agendamento concluído. Pagamento pendente.",
      )
      setShowPaymentDialog(false)
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
          notes: noShowReason,
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

  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    appointment_date: "",
    appointment_time: "",
    service_id: "",
    client_id: "",
    client_type: "",
    sporadic_client_name: "",
    sporadic_client_phone: "",
    event_title: "",
    custom_price: "",
    payment_status: "",
    notes: "",
  })

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detalhes do Agendamento</h1>
              <p className="text-muted-foreground">Visualize e gerencie os detalhes do agendamento</p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </div>
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
              {isEditing ? (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-gold/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">Data</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editData.appointment_date}
                        onChange={(e) => setEditData({ ...editData, appointment_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-time">Horário</Label>
                      <Input
                        id="edit-time"
                        type="time"
                        value={editData.appointment_time}
                        onChange={(e) => setEditData({ ...editData, appointment_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-service">Serviço</Label>
                    <Select
                      value={editData.service_id}
                      onValueChange={(value) => setEditData({ ...editData, service_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-client-type">Tipo de Cliente</Label>
                    <Select
                      value={editData.client_type}
                      onValueChange={(value) => setEditData({ ...editData, client_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">Cliente Registrado</SelectItem>
                        <SelectItem value="sporadic">Cliente Esporádico</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editData.client_type === "registered" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-client">Cliente</Label>
                      <Select
                        value={editData.client_id}
                        onValueChange={(value) => setEditData({ ...editData, client_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {editData.client_type === "sporadic" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit-sporadic-name">Nome do Cliente</Label>
                        <Input
                          id="edit-sporadic-name"
                          value={editData.sporadic_client_name}
                          onChange={(e) => setEditData({ ...editData, sporadic_client_name: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-sporadic-phone">Telefone do Cliente</Label>
                        <Input
                          id="edit-sporadic-phone"
                          value={editData.sporadic_client_phone}
                          onChange={(e) => setEditData({ ...editData, sporadic_client_phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </>
                  )}

                  {editData.client_type === "event" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-title">Título do Evento</Label>
                      <Input
                        id="edit-event-title"
                        value={editData.event_title}
                        onChange={(e) => setEditData({ ...editData, event_title: e.target.value })}
                        placeholder="Ex: Reunião, Almoço, etc."
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Valor Personalizado (R$)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={editData.custom_price}
                      onChange={(e) => setEditData({ ...editData, custom_price: e.target.value })}
                      placeholder="Deixe vazio para usar preço padrão"
                    />
                    {appointment.custom_price && appointment.original_price && (
                      <div className="text-sm space-y-1 mt-2 p-2 bg-muted/50 rounded">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Original:</span>
                          <span className="font-medium">R$ {Number(appointment.original_price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Alterado:</span>
                          <span className="font-medium text-primary">
                            R$ {Number(appointment.custom_price).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 mt-1">
                          <span className="text-muted-foreground">Diferença:</span>
                          <span
                            className={`font-semibold ${Number(appointment.custom_price) > Number(appointment.original_price) ? "text-green-500" : "text-red-500"}`}
                          >
                            {Number(appointment.custom_price) > Number(appointment.original_price) ? "+" : ""}
                            R$ {(Number(appointment.custom_price) - Number(appointment.original_price)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-payment-status">Status de Pagamento</Label>
                    <Select
                      value={editData.payment_status}
                      onValueChange={(value) => setEditData({ ...editData, payment_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Observações</Label>
                    <Textarea
                      id="edit-notes"
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      placeholder="Adicione observações sobre o agendamento..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <>
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

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-gold mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-foreground font-medium text-2xl">R$ {displayPrice.toFixed(2)}</p>
                      {appointment.custom_price && appointment.original_price && (
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Original:</span>
                            <span className="line-through">R$ {Number(appointment.original_price).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Alterado:</span>
                            <span className="font-semibold text-primary">
                              R$ {Number(appointment.custom_price).toFixed(2)}
                            </span>
                          </div>
                        </div>
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
                  </div>

                  {appointment.notes && (
                    <div className="pt-4 border-t border-gold/20">
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p className="text-foreground">{appointment.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {!isEditing &&
            appointment.status !== "completed" &&
            appointment.status !== "cancelled" &&
            appointment.status !== "no_show" && (
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleComplete}
                    disabled={isLoading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Concluído
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-orange-500/20 text-orange-500 hover:bg-orange-500/10 bg-transparent"
                    onClick={() => setShowNoShowDialog(true)}
                    disabled={isLoading}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Cliente Não Compareceu
                  </Button>

                  <Button variant="destructive" className="w-full" onClick={handleCancel} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar Agendamento
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Agendamento</DialogTitle>
            <DialogDescription>Como foi realizado o pagamento deste serviço?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant={paymentChoice === "paid" ? "default" : "outline"}
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setPaymentChoice("paid")}
            >
              <CheckCircle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Já foi pago</div>
                <div className="text-xs text-muted-foreground">Cliente pagou no momento do atendimento</div>
              </div>
            </Button>
            <Button
              variant={paymentChoice === "later" ? "default" : "outline"}
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setPaymentChoice("later")}
            >
              <Clock className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Pagar depois</div>
                <div className="text-xs text-muted-foreground">
                  Aparecerá no financeiro como pendente até marcar como pago
                </div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} disabled={!paymentChoice || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* </CHANGE> */}

      {/* Added no show dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Não Compareceu</DialogTitle>
            <DialogDescription>Por favor, informe o motivo:</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={noShowReason}
              onChange={(e) => setNoShowReason(e.target.value)}
              placeholder="Motivo do não comparecimento..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoShowDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleNoShow} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* </CHANGE> */}
    </div>
  )
}
