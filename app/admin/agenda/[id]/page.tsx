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
import { ArrowLeft, Calendar, Clock, User, DollarSign, Edit2, Save } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminGerenciarAgendamento() {
  const [profile, setProfile] = useState<any>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    appointment_date: "",
    appointment_time: "",
    service_id: "",
    staff_id: "",
    client_id: "",
    client_type: "",
    sporadic_client_name: "",
    sporadic_client_phone: "",
    event_title: "",
    custom_price: "",
    payment_status: "",
    notes: "",
  })
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
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

    const { data: servicesData } = await supabase.from("services").select("*").eq("is_active", true).order("name")
    setServices(servicesData || [])

    const { data: clientsData } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("user_level", 10)
      .order("full_name")
    setClients(clientsData || [])

    const { data: staffData } = await supabase
      .from("profiles")
      .select("*")
      .gte("user_level", 20)
      .eq("is_active", true)
      .order("full_name")
    setStaffMembers(staffData || [])

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
        staff_id: appointmentData.staff_id || "",
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
        staff_id: editData.staff_id || null,
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
      console.error("Erro ao atualizar agendamento:", error)
      toast.error("Erro ao atualizar agendamento")
    } finally {
      setIsLoading(false)
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
      router.push("/admin/agenda")
    } catch (error) {
      console.error("Erro ao concluir agendamento:", error)
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
      router.push("/admin/agenda")
    } catch (error) {
      console.error("Erro ao marcar não comparecimento:", error)
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
      router.push("/admin/agenda")
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error)
      toast.error("Erro ao cancelar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevert = async () => {
    if (
      !confirm(
        "Tem certeza que deseja reverter este agendamento para pendente? Ele voltará a aparecer em aberto na agenda.",
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "pending",
          payment_status: "pending",
          pay_later: false,
        })
        .eq("id", appointment.id)

      if (error) throw error

      toast.success("Agendamento revertido para pendente com sucesso!")
      loadData()
    } catch (error) {
      console.error("Erro ao reverter agendamento:", error)
      toast.error("Erro ao reverter agendamento")
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
            href="/admin/agenda"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agenda
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Agendamento</h1>
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
                    <Label htmlFor="edit-staff">Profissional</Label>
                    <Select
                      value={editData.staff_id}
                      onValueChange={(value) => setEditData({ ...editData, staff_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  {appointment.staff && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gold mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Profissional</p>
                        <p className="text-foreground font-medium">{appointment.staff.full_name}</p>
                      </div>
                    </div>
                  )}

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
                  ) : appointment.client_type === "event" ? (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gold mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Evento</p>
                        <p className="text-foreground font-medium">{appointment.event_title}</p>
                      </div>
                    </div>
                  ) : appointment.client ? (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gold mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="text-foreground font-medium">{appointment.client.full_name}</p>
                        {appointment.client.phone && (
                          <p className="text-sm text-muted-foreground">{appointment.client.phone}</p>
                        )}
                      </div>
                    </div>
                  ) : null}

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
                      <p className="text-sm text-muted-foreground mb-2">Observações</p>
                      <p className="text-foreground">{appointment.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {!isEditing && (appointment.status === "completed" || appointment.payment_status === "paid") && (
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle>Ações Administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-blue-500/20 text-blue-500 hover:bg-blue-500/10 bg-transparent"
                  onClick={handleRevert}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Reverter para Pendente
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Reverte o agendamento para status pendente e não pago, permitindo que ele seja reaberto na agenda.
                </p>
              </CardContent>
            </Card>
          )}

          {!isEditing &&
            appointment.status !== "completed" &&
            appointment.status !== "cancelled" &&
            appointment.status !== "no_show" && (
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointment.status !== "completed" && (
                    <Button
                      onClick={handleComplete}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Marcar como Concluído
                    </Button>
                  )}

                  {appointment.status !== "no_show" && appointment.status !== "cancelled" && (
                    <Button
                      onClick={handleNoShow}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      Cliente Não Compareceu
                    </Button>
                  )}

                  {appointment.status !== "cancelled" && (
                    <Button
                      onClick={handleCancel}
                      disabled={isLoading}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Cancelar Agendamento
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
