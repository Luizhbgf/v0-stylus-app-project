"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  DollarSign,
  X,
  UserX,
  CheckCircle,
  Edit2,
  Save,
  Loader2,
  CreditCard,
} from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

export default function StaffAppointmentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [appointment, setAppointment] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentChoice, setPaymentChoice] = useState<"paid" | "later" | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  const [showNoShowDialog, setShowNoShowDialog] = useState(false)
  const [noShowReason, setNoShowReason] = useState("")
  const supabase = createClient()

  const [allServices, setAllServices] = useState<any[]>([])
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
    // Multi-service fields
    selected_services: [] as string[],
    service_prices: {} as Record<string, number>,
  })

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
    setAllServices(servicesData || [])

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
        client:client_id(full_name, phone, email),
        staff:staff_id(full_name)
      `,
      )
      .eq("id", params.id)
      .single()

    if (appointmentData) {
      const serviceIds = appointmentData.service_ids || (appointmentData.service_id ? [appointmentData.service_id] : [])

      // Fetch full service details for display in the view
      if (serviceIds.length > 0) {
        const { data: servicesForAppointment } = await supabase.from("services").select("*").in("id", serviceIds)

        setAppointment({ ...appointmentData, services: servicesForAppointment || [] })
      } else {
        setAppointment(appointmentData)
      }

      const currentServiceIds =
        appointmentData.service_ids || (appointmentData.service_id ? [appointmentData.service_id] : [])
      const currentPrices = appointmentData.service_prices || {}

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
        custom_price: (appointmentData.custom_price || 0).toString(),
        payment_status: appointmentData.payment_status || "pending",
        notes: appointmentData.notes || "",
        selected_services: currentServiceIds,
        service_prices: currentPrices,
      })
    }

    setLoading(false)
  }

  const toggleServiceSelection = (serviceId: string, servicePrice: number) => {
    const isSelected = editData.selected_services.includes(serviceId)

    if (isSelected) {
      // Remove service
      const newSelectedServices = editData.selected_services.filter((id) => id !== serviceId)
      const newServicePrices = { ...editData.service_prices }
      delete newServicePrices[serviceId]

      setEditData({
        ...editData,
        selected_services: newSelectedServices,
        service_prices: newServicePrices,
      })
    } else {
      // Add service
      setEditData({
        ...editData,
        selected_services: [...editData.selected_services, serviceId],
        service_prices: {
          ...editData.service_prices,
          [serviceId]: servicePrice,
        },
      })
    }
  }

  const updateServicePrice = (serviceId: string, newPrice: number) => {
    setEditData({
      ...editData,
      service_prices: {
        ...editData.service_prices,
        [serviceId]: newPrice,
      },
    })
  }

  const calculateTotals = () => {
    let totalPrice = 0
    let totalDuration = 0

    editData.selected_services.forEach((serviceId) => {
      const service = allServices.find((s) => s.id === serviceId)
      if (service) {
        totalPrice += editData.service_prices[serviceId] || service.price
        totalDuration += service.duration || 0
      }
    })

    return { totalPrice, totalDuration }
  }

  const handleSaveEdit = async () => {
    if (editData.selected_services.length === 0) {
      toast.error("Selecione pelo menos um serviço")
      return
    }

    setIsLoading(true)
    try {
      const appointmentDateTime = new Date(`${editData.appointment_date}T${editData.appointment_time}`)
      const { totalPrice, totalDuration } = calculateTotals()

      const updateData: any = {
        appointment_date: appointmentDateTime.toISOString(),
        service_ids: editData.selected_services,
        service_prices: editData.service_prices,
        custom_price: totalPrice, // Use the calculated total price
        duration: totalDuration,
        // Legacy support (if needed, though ideally the DB schema should be updated to prefer service_ids)
        service_id: editData.selected_services[0] || null,
        client_type: editData.client_type,
        payment_status: editData.payment_status,
        notes: editData.notes || null,
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

    if (paymentChoice === "paid") {
      setShowPaymentDialog(false)
      setShowPaymentMethodDialog(true)
      return
    }

    await completeAppointment("pending", null)
  }

  const completeAppointment = async (paymentStatus: string, method: string | null) => {
    setIsLoading(true)
    try {
      const updates: any = {
        status: "completed",
        payment_status: paymentStatus,
        pay_later: paymentStatus === "pending",
      }

      const { error: appointmentError } = await supabase.from("appointments").update(updates).eq("id", appointment.id)

      if (appointmentError) throw appointmentError

      const displayPrice =
        appointment.custom_price ||
        Object.values(appointment.service_prices || {}).reduce((sum: number, price: any) => sum + Number(price), 0) ||
        0

      // Create payment record if paid
      if (paymentStatus === "paid" && method) {
        const { error: paymentError } = await supabase.from("payments").insert({
          appointment_id: appointment.id,
          client_id: appointment.client_id,
          amount: displayPrice,
          payment_method: method,
          status: "completed",
          paid_at: new Date().toISOString(),
        })

        if (paymentError) {
          console.error("[v0] Error creating payment record:", paymentError)
          toast.error("Agendamento concluído, mas erro ao registrar pagamento")
          return
        }
      }

      toast.success(
        paymentStatus === "paid"
          ? "Agendamento concluído e marcado como pago!"
          : "Agendamento concluído. Pagamento pendente.",
      )
      setShowPaymentMethodDialog(false)
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao concluir agendamento:", error)
      toast.error("Erro ao concluir agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmPaymentMethod = async () => {
    if (!paymentMethod) {
      toast.error("Selecione uma forma de pagamento")
      return
    }
    await completeAppointment("paid", paymentMethod)
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

  if (loading || !profile || !appointment) return null

  const appointmentDate = new Date(appointment.appointment_date)
  const displayPrice =
    appointment.custom_price ||
    Object.values(appointment.service_prices || {}).reduce((sum: number, price: any) => sum + Number(price), 0) ||
    0

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
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                    <Label>Serviços</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Selecione um ou mais serviços para este agendamento
                    </p>
                    <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
                      {allServices.map((service) => {
                        const isSelected = editData.selected_services.includes(service.id)
                        // Use the price from editData if available, otherwise use the default service price
                        const currentPrice =
                          editData.service_prices[service.id] !== undefined
                            ? editData.service_prices[service.id]
                            : service.price

                        return (
                          <div key={service.id} className="space-y-2">
                            <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                              <Checkbox
                                id={`service-${service.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleServiceSelection(service.id, service.price)}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`service-${service.id}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {service.name}
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  R$ {service.price.toFixed(2)} • {service.duration} min • {service.category}
                                </p>
                              </div>
                            </div>

                            {/* Show price input only for selected services */}
                            {isSelected && (
                              <div className="ml-8 space-y-1">
                                <Label htmlFor={`price-${service.id}`} className="text-xs">
                                  Preço personalizado (R$)
                                </Label>
                                <Input
                                  id={`price-${service.id}`}
                                  type="number"
                                  step="0.01"
                                  value={currentPrice}
                                  onChange={(e) =>
                                    updateServicePrice(service.id, Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="h-8"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Show totals */}
                    {editData.selected_services.length > 0 && (
                      <div className="mt-3 p-3 bg-gold/5 rounded-lg border border-gold/20">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {editData.selected_services.length} serviço(s) selecionado(s)
                          </span>
                          <span className="text-muted-foreground">Duração: {calculateTotals().totalDuration} min</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-gold">R$ {calculateTotals().totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
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
                        <SelectItem value="cancelled">Cancelado</SelectItem>
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
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <p className="text-sm">Data e Hora</p>
                      <p className="text-foreground font-medium">
                        {appointmentDate.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-foreground font-medium">
                        {appointmentDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-muted-foreground">
                    <User className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="text-sm">Profissional</p>
                      <p className="text-foreground font-medium">{appointment.staff?.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm mb-2">Serviços</p>
                      <div className="space-y-2">
                        {appointment.services?.map((service: any) => {
                          // Use the price stored in the appointment's service_prices if available, otherwise use the default service price
                          const servicePrice = appointment.service_prices?.[service.id] ?? service.price
                          return (
                            <div key={service.id} className="flex justify-between items-start p-2 bg-muted/30 rounded">
                              <div>
                                <p className="text-foreground font-medium">{service.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {service.duration} minutos • {service.category}
                                </p>
                              </div>
                              <p className="text-foreground font-semibold">R$ {Number(servicePrice).toFixed(2)}</p>
                            </div>
                          )
                        })}

                        {/* Total */}
                        {appointment.services?.length > 1 && (
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <p className="font-semibold">Total</p>
                            <div className="text-right">
                              <p className="text-gold font-bold text-lg">R$ {displayPrice.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {appointment.services.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)}{" "}
                                minutos
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-muted-foreground">
                    <User className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="text-sm">
                        {appointment.client_type === "registered"
                          ? "Cliente"
                          : appointment.client_type === "sporadic"
                            ? "Cliente Esporádico (sem cadastro)"
                            : "Evento sem Cliente (bloqueio, reunião, etc.)"}
                      </p>
                      {appointment.client_type === "registered" && appointment.client && (
                        <>
                          <p className="text-foreground font-medium">{appointment.client.full_name}</p>
                          {appointment.client.phone && (
                            <p className="text-sm text-muted-foreground">{appointment.client.phone}</p>
                          )}
                        </>
                      )}
                      {appointment.client_type === "sporadic" && (
                        <>
                          <p className="text-foreground font-medium">{appointment.sporadic_client_name}</p>
                          {appointment.sporadic_client_phone && (
                            <p className="text-sm text-muted-foreground">{appointment.sporadic_client_phone}</p>
                          )}
                        </>
                      )}
                      {appointment.client_type === "event" && (
                        <p className="text-foreground font-medium">{appointment.event_title}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <DollarSign className="h-5 w-5" />
                    <div>
                      <p className="text-sm">Valor</p>
                      <p className="text-foreground font-bold text-xl text-gold">R$ {displayPrice.toFixed(2)}</p>
                      <Badge
                        variant="outline"
                        className={
                          appointment.payment_status === "paid"
                            ? "bg-green-500/10 text-green-500 border-green-500/20 mt-1"
                            : appointment.payment_status === "cancelled"
                              ? "bg-red-500/10 text-red-500 border-red-500/20 mt-1"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 mt-1"
                        }
                      >
                        {appointment.payment_status === "paid"
                          ? "Pago"
                          : appointment.payment_status === "cancelled"
                            ? "Cancelado"
                            : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p className="text-foreground">{appointment.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {(appointment.status === "pending" || appointment.status === "confirmed") && !isEditing && (
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleComplete}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Marcar como Concluído
                </Button>

                <Button
                  onClick={() => setShowNoShowDialog(true)}
                  variant="outline"
                  className="w-full border-orange-500/20 text-orange-500 hover:bg-orange-500/10"
                  disabled={isLoading}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Cliente Não Compareceu
                </Button>

                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 bg-transparent"
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar Agendamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Choice Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Conclusão</DialogTitle>
            <DialogDescription>O cliente realizou o pagamento?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => setPaymentChoice("paid")}
              className={`w-full justify-start ${paymentChoice === "paid" ? "bg-green-600" : ""}`}
              variant={paymentChoice === "paid" ? "default" : "outline"}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Sim, o cliente pagou
            </Button>
            <Button
              onClick={() => setPaymentChoice("later")}
              className={`w-full justify-start ${paymentChoice === "later" ? "bg-yellow-600" : ""}`}
              variant={paymentChoice === "later" ? "default" : "outline"}
            >
              <Clock className="mr-2 h-4 w-4" />
              Não, vai pagar depois
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} disabled={!paymentChoice}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forma de Pagamento</DialogTitle>
            <DialogDescription>Selecione como o cliente pagou</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => setPaymentMethod("pix")}
              className={`w-full justify-start ${paymentMethod === "pix" ? "bg-primary" : ""}`}
              variant={paymentMethod === "pix" ? "default" : "outline"}
            >
              PIX
            </Button>
            <Button
              onClick={() => setPaymentMethod("dinheiro")}
              className={`w-full justify-start ${paymentMethod === "dinheiro" ? "bg-primary" : ""}`}
              variant={paymentMethod === "dinheiro" ? "default" : "outline"}
            >
              Dinheiro
            </Button>
            <Button
              onClick={() => setPaymentMethod("cartao_debito")}
              className={`w-full justify-start ${paymentMethod === "cartao_debito" ? "bg-primary" : ""}`}
              variant={paymentMethod === "cartao_debito" ? "default" : "outline"}
            >
              Cartão de Débito
            </Button>
            <Button
              onClick={() => setPaymentMethod("cartao_credito")}
              className={`w-full justify-start ${paymentMethod === "cartao_credito" ? "bg-primary" : ""}`}
              variant={paymentMethod === "cartao_credito" ? "default" : "outline"}
            >
              Cartão de Crédito
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentMethodDialog(false)}>
              Voltar
            </Button>
            <Button onClick={handleConfirmPaymentMethod} disabled={!paymentMethod}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Show Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cliente Não Compareceu</DialogTitle>
            <DialogDescription>Adicione uma observação sobre o não comparecimento (opcional)</DialogDescription>
          </DialogHeader>
          <Textarea
            value={noShowReason}
            onChange={(e) => setNoShowReason(e.target.value)}
            placeholder="Ex: Cliente não respondeu ligação, não avisou..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleNoShow} className="bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Não Comparecimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
