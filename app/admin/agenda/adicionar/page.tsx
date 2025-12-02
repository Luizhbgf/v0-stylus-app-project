"use client"

export const dynamic = "force-dynamic"

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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

export default function AdicionarAgendamentoAdmin() {
  const [profile, setProfile] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedStaff, setSelectedStaff] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [notes, setNotes] = useState("")

  const [clientType, setClientType] = useState<"registered" | "sporadic" | "none">("registered")
  const [sporadicName, setSporadicName] = useState("")
  const [sporadicPhone, setSporadicPhone] = useState("")
  const [eventTitle, setEventTitle] = useState("")

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly" | "twice_weekly" | "monthly">("weekly")
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [staffTimeConflict, setStaffTimeConflict] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedStaff) {
      loadStaffServices(selectedStaff)
    }
  }, [selectedStaff])

  useEffect(() => {
    if (selectedStaff && appointmentDate && appointmentTime) {
      checkStaffTimeConflict(selectedStaff, appointmentDate, appointmentTime)
    } else {
      setStaffTimeConflict(null)
    }
  }, [selectedStaff, appointmentDate, appointmentTime])

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

    const { data: clientsData } = await supabase.from("profiles").select("*").eq("user_level", 10).order("full_name")
    setClients(clientsData || [])

    const { data: staffData } = await supabase
      .from("profiles")
      .select("*")
      .gte("user_level", 20)
      .eq("is_active", true)
      .neq("staff_status", "inactive")
      .neq("staff_status", "vacation")
      .order("full_name")

    setStaffMembers(staffData || [])
  }

  const loadStaffServices = async (staffId: string) => {
    const { data: staffServicesData } = await supabase
      .from("staff_services")
      .select("service_id, services(*)")
      .eq("staff_id", staffId)

    const servicesData = staffServicesData?.map((ss) => ss.services).filter(Boolean) || []
    setServices(servicesData)
  }

  const checkStaffTimeConflict = async (staffId: string, date: string, time: string) => {
    if (!staffId || !date || !time) return

    try {
      const appointmentDateTime = new Date(`${date}T${time}`)

      const { data: existingAppointments } = await supabase
        .from("appointments")
        .select("*, profiles!appointments_staff_id_fkey(full_name)")
        .eq("staff_id", staffId)
        .eq("appointment_date", appointmentDateTime.toISOString())
        .neq("status", "cancelled")

      if (existingAppointments && existingAppointments.length > 0) {
        const staffName = existingAppointments[0].profiles?.full_name || "Este funcionário"
        const formattedTime = time.substring(0, 5)
        setStaffTimeConflict(
          `${staffName} já tem um agendamento às ${formattedTime}. Escolha outro horário ou outro profissional.`,
        )
        return true
      } else {
        setStaffTimeConflict(null)
        return false
      }
    } catch (error) {
      console.error("Erro ao verificar conflito do staff:", error)
      return false
    }
  }

  const checkAgendaBlocks = async (staffId: string, date: string, time: string, serviceId: string | null) => {
    if (!staffId || !date || !time) return false

    try {
      const appointmentDateTime = new Date(`${date}T${time}`)

      // Get service duration to calculate end time
      let duration = 60 // default 60 minutes
      if (serviceId) {
        const { data: service } = await supabase.from("services").select("duration").eq("id", serviceId).single()
        if (service) duration = service.duration
      }

      const appointmentEndTime = new Date(appointmentDateTime.getTime() + duration * 60000)

      const { data: blocks } = await supabase
        .from("agenda_blocks")
        .select("*")
        .eq("staff_id", staffId)
        .lte("start_time", appointmentEndTime.toISOString())
        .gte("end_time", appointmentDateTime.toISOString())

      if (blocks && blocks.length > 0) {
        const block = blocks[0]
        toast.error(`Este horário está bloqueado: ${block.title}`)
        return true
      }

      return false
    } catch (error) {
      console.error("Erro ao verificar bloqueios:", error)
      return false
    }
  }

  const generateRecurringAppointments = (
    startDate: Date,
    endDate: Date,
    type: string,
    days: number[],
    baseData: any,
    parentId: string,
  ) => {
    const appointments = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      let nextDate: Date | null = null

      switch (type) {
        case "weekly":
          nextDate = new Date(currentDate)
          nextDate.setDate(currentDate.getDate() + 7)
          break
        case "biweekly":
          nextDate = new Date(currentDate)
          nextDate.setDate(currentDate.getDate() + 14)
          break
        case "twice_weekly":
          const currentDay = currentDate.getDay()
          const sortedDays = [...days].sort((a, b) => a - b)
          let daysToAdd = 0

          for (const day of sortedDays) {
            if (day > currentDay) {
              daysToAdd = day - currentDay
              break
            }
          }

          if (daysToAdd === 0) {
            daysToAdd = 7 - currentDay + sortedDays[0]
          }

          nextDate = new Date(currentDate)
          nextDate.setDate(currentDate.getDate() + daysToAdd)
          break
        case "monthly":
          nextDate = new Date(currentDate)
          nextDate.setMonth(currentDate.getMonth() + 1)
          break
      }

      if (nextDate && nextDate <= endDate) {
        appointments.push({
          ...baseData,
          appointment_date: nextDate.toISOString(),
          parent_appointment_id: parentId,
        })
        currentDate = nextDate
      } else {
        break
      }
    }

    return appointments
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasConflict = await checkStaffTimeConflict(selectedStaff, appointmentDate, appointmentTime)
    if (hasConflict) {
      toast.error("Este funcionário já tem um agendamento neste horário. Escolha outro horário ou funcionário.")
      return
    }

    const hasBlock = await checkAgendaBlocks(selectedStaff, appointmentDate, appointmentTime, selectedService)
    if (hasBlock) {
      return
    }

    setIsLoading(true)

    try {
      if (clientType === "registered" && !selectedClient) {
        toast.error("Selecione um cliente")
        setIsLoading(false)
        return
      }

      if (clientType === "sporadic" && (!sporadicName || !sporadicPhone)) {
        toast.error("Preencha o nome e telefone do cliente esporádico")
        setIsLoading(false)
        return
      }

      if (clientType === "none" && !eventTitle) {
        toast.error("Preencha o título do evento")
        setIsLoading(false)
        return
      }

      if (!selectedStaff) {
        toast.error("Selecione um profissional")
        setIsLoading(false)
        return
      }

      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)

      const appointmentData = {
        client_id: clientType === "registered" ? selectedClient : null,
        staff_id: selectedStaff,
        service_id: selectedService || null,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
        notes,
        client_type: clientType === "none" ? "event" : clientType,
        sporadic_client_name: clientType === "sporadic" ? sporadicName : null,
        sporadic_client_phone: clientType === "sporadic" ? sporadicPhone : null,
        event_title: clientType === "none" ? eventTitle : null,
        payment_status: "pending",
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        recurrence_days: isRecurring && recurrenceType === "twice_weekly" ? recurrenceDays : null,
        recurrence_end_date: isRecurring ? recurrenceEndDate : null,
      }

      const { data: newAppointment, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single()

      if (error) throw error

      if (isRecurring && newAppointment) {
        const futureAppointments = generateRecurringAppointments(
          appointmentDateTime,
          new Date(recurrenceEndDate),
          recurrenceType,
          recurrenceDays,
          appointmentData,
          newAppointment.id,
        )

        if (futureAppointments.length > 0) {
          const { error: recurringError } = await supabase.from("appointments").insert(futureAppointments)
          if (recurringError) console.error("Error creating recurring appointments:", recurringError)
        }
      }

      toast.success("Agendamento criado com sucesso!")
      router.refresh()
      setTimeout(() => {
        router.push("/admin/agenda")
      }, 100)
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
      toast.error("Erro ao criar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/admin/agenda"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agenda
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Adicionar Agendamento</h1>
          <p className="text-muted-foreground">Crie um novo agendamento (Admin)</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label>Tipo de Agendamento *</Label>
                <RadioGroup value={clientType} onValueChange={(value: any) => setClientType(value)}>
                  <div className="flex items-center space-x-2 p-3 border border-gold/20 rounded-lg">
                    <RadioGroupItem value="registered" id="registered" />
                    <Label htmlFor="registered" className="cursor-pointer flex-1">
                      Cliente Cadastrado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-gold/20 rounded-lg">
                    <RadioGroupItem value="sporadic" id="sporadic" />
                    <Label htmlFor="sporadic" className="cursor-pointer flex-1">
                      Cliente Esporádico (sem cadastro)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-gold/20 rounded-lg">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer flex-1">
                      Evento sem Cliente (bloqueio, reunião, etc.)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {clientType === "registered" && (
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient} required>
                    <SelectTrigger className="border-gold/20">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name} - {client.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {clientType === "sporadic" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sporadicName">Nome do Cliente *</Label>
                    <Input
                      id="sporadicName"
                      value={sporadicName}
                      onChange={(e) => setSporadicName(e.target.value)}
                      placeholder="Nome completo"
                      className="border-gold/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sporadicPhone">Telefone *</Label>
                    <Input
                      id="sporadicPhone"
                      value={sporadicPhone}
                      onChange={(e) => setSporadicPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="border-gold/20"
                      required
                    />
                  </div>
                </>
              )}

              {clientType === "none" && (
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Título do Evento *</Label>
                  <Input
                    id="eventTitle"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Ex: Horário bloqueado, Almoço, Reunião..."
                    className="border-gold/20"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="staff">Profissional *</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff} required>
                  <SelectTrigger className="border-gold/20">
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
                <Label htmlFor="service">Serviço {clientType !== "none" && "*"}</Label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  required={clientType !== "none"}
                  disabled={!selectedStaff}
                >
                  <SelectTrigger className="border-gold/20">
                    <SelectValue
                      placeholder={selectedStaff ? "Selecione um serviço" : "Selecione um profissional primeiro"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: any) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="border-gold/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    step="60"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="border-gold/20"
                    required
                  />
                  {staffTimeConflict && (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <span className="font-semibold">⚠️</span> {staffTimeConflict}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Você pode agendar múltiplos funcionários no mesmo horário
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
                  className="border-gold/20"
                  rows={3}
                />
              </div>

              <div className="space-y-4 p-4 border border-gold/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(!!checked)}
                  />
                  <Label htmlFor="recurring" className="cursor-pointer">
                    Agendamento Recorrente (Agenda Fixa)
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-4 pl-6">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select value={recurrenceType} onValueChange={(value: any) => setRecurrenceType(value)}>
                        <SelectTrigger className="border-gold/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal (1x por semana)</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="twice_weekly">2x por semana</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {recurrenceType === "twice_weekly" && (
                      <div className="space-y-2">
                        <Label>Dias da Semana</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { day: 0, label: "Dom" },
                            { day: 1, label: "Seg" },
                            { day: 2, label: "Ter" },
                            { day: 3, label: "Qua" },
                            { day: 4, label: "Qui" },
                            { day: 5, label: "Sex" },
                            { day: 6, label: "Sáb" },
                          ].map(({ day, label }) => (
                            <Button
                              key={day}
                              type="button"
                              variant={recurrenceDays.includes(day) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleRecurrenceDay(day)}
                              className={recurrenceDays.includes(day) ? "bg-gold text-black" : ""}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data Final da Recorrência *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="border-gold/20"
                        required
                        min={appointmentDate}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Agendamento"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
