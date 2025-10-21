"use client"

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

export default function AdicionarAgendamentoStaff() {
  const [profile, setProfile] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [notes, setNotes] = useState("")
  const [isEventWithoutClient, setIsEventWithoutClient] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
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

    // Load clients
    const { data: clientsData } = await supabase.from("profiles").select("*").eq("user_level", 10).order("full_name")
    setClients(clientsData || [])

    // Load staff services
    const { data: servicesData } = await supabase
      .from("services")
      .select("*")
      .eq("staff_id", user.id)
      .eq("active", true)
    setServices(servicesData || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)

      const { error } = await supabase.from("appointments").insert({
        client_id: isEventWithoutClient ? null : selectedClient,
        staff_id: user.id,
        service_id: selectedService,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
        notes,
        event_title: isEventWithoutClient ? eventTitle : null,
      })

      if (error) throw error

      toast.success(isEventWithoutClient ? "Evento criado com sucesso!" : "Agendamento criado com sucesso!")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
      toast.error("Erro ao criar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/staff/agenda"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agenda
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Adicionar Agendamento</h1>
          <p className="text-muted-foreground">Crie um novo agendamento para seus clientes</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border border-gold/20">
                <Checkbox
                  id="eventWithoutClient"
                  checked={isEventWithoutClient}
                  onCheckedChange={(checked) => {
                    setIsEventWithoutClient(checked as boolean)
                    if (checked) {
                      setSelectedClient("")
                    } else {
                      setEventTitle("")
                    }
                  }}
                />
                <Label htmlFor="eventWithoutClient" className="cursor-pointer">
                  Evento sem cliente (bloqueio de horário, evento pessoal, etc.)
                </Label>
              </div>

              {isEventWithoutClient ? (
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
              ) : (
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

              <div className="space-y-2">
                <Label htmlFor="service">Serviço *</Label>
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className="border-gold/20">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="border-gold/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
                  className="border-gold/20"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                  {isLoading ? "Criando..." : isEventWithoutClient ? "Criar Evento" : "Criar Agendamento"}
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
