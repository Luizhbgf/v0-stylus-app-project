"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "@/components/navbar"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Check, X, Edit } from "lucide-react"
import Link from "next/link"

export default function GerenciarSolicitacao() {
  const [profile, setProfile] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [staffNotes, setStaffNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

    // Load request
    const { data: requestData } = await supabase
      .from("appointment_requests")
      .select(
        `
        *,
        client:client_id(full_name, phone, email),
        service:services(*)
      `,
      )
      .eq("id", params.id)
      .single()

    if (requestData) {
      console.log("[v0] Request data loaded:", requestData)
      setRequest(requestData)
      // Ensure date and time are in correct format
      if (requestData.preferred_date) {
        setNewDate(requestData.preferred_date)
      }
      if (requestData.preferred_time) {
        // Time comes as HH:MM:SS, we need HH:MM for input
        setNewTime(requestData.preferred_time.substring(0, 5))
      }
    }
  }

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      if (!newDate || !newTime) {
        toast.error("Data e horário são obrigatórios")
        setIsLoading(false)
        return
      }

      const appointmentDateTime = new Date(`${newDate}T${newTime}`)

      console.log("[v0] Criando appointment com dados:", {
        client_id: request.client_id,
        staff_id: request.staff_id,
        service_id: request.service_id,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
        notes: request.notes,
        payment_status: "pending",
      })

      const { data: aptData, error: aptError } = await supabase
        .from("appointments")
        .insert({
          client_id: request.client_id,
          staff_id: request.staff_id,
          service_id: request.service_id,
          appointment_date: appointmentDateTime.toISOString(),
          status: "confirmed",
          notes: request.notes,
          payment_status: "pending",
        })
        .select()

      if (aptError) {
        console.error("[v0] Erro ao criar appointment:", aptError)
        throw aptError
      }

      console.log("[v0] Appointment criado com sucesso:", aptData)

      // Update request status
      const { error: reqError } = await supabase
        .from("appointment_requests")
        .update({
          status: "approved",
          staff_notes: staffNotes,
        })
        .eq("id", request.id)

      if (reqError) {
        console.error("[v0] Erro ao atualizar request:", reqError)
        throw reqError
      }

      toast.success("Solicitação aprovada!")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao aprovar solicitação:", error)
      toast.error("Erro ao aprovar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  const handleModify = async () => {
    setIsLoading(true)
    try {
      if (!newDate || !newTime) {
        toast.error("Data e horário são obrigatórios")
        setIsLoading(false)
        return
      }

      const appointmentDateTime = new Date(`${newDate}T${newTime}`)

      console.log("[v0] Modificando appointment com dados:", {
        client_id: request.client_id,
        staff_id: request.staff_id,
        service_id: request.service_id,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
        notes: `${request.notes}\n\nModificado pelo profissional: ${staffNotes}`,
        payment_status: "pending",
      })

      const { data: aptData, error: aptError } = await supabase
        .from("appointments")
        .insert({
          client_id: request.client_id,
          staff_id: request.staff_id,
          service_id: request.service_id,
          appointment_date: appointmentDateTime.toISOString(),
          status: "confirmed",
          notes: `${request.notes}\n\nModificado pelo profissional: ${staffNotes}`,
          payment_status: "pending",
        })
        .select()

      if (aptError) {
        console.error("[v0] Erro ao criar appointment modificado:", aptError)
        throw aptError
      }

      console.log("[v0] Appointment modificado criado com sucesso:", aptData)

      // Update request status
      const { error: reqError } = await supabase
        .from("appointment_requests")
        .update({
          status: "modified",
          staff_notes: staffNotes,
        })
        .eq("id", request.id)

      if (reqError) {
        console.error("[v0] Erro ao atualizar request:", reqError)
        throw reqError
      }

      toast.success("Solicitação modificada e aprovada!")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao modificar solicitação:", error)
      toast.error("Erro ao modificar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Rejeitando solicitação:", request.id)

      const { error } = await supabase
        .from("appointment_requests")
        .update({
          status: "rejected",
          staff_notes: staffNotes,
        })
        .eq("id", request.id)

      if (error) {
        console.error("[v0] Erro ao rejeitar:", error)
        throw error
      }

      console.log("[v0] Solicitação rejeitada com sucesso")
      toast.success("Solicitação rejeitada")
      router.push("/staff/agenda")
    } catch (error) {
      console.error("[v0] Erro ao rejeitar solicitação:", error)
      toast.error("Erro ao rejeitar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !request) return null

  let requestedDateTime = null
  let formattedDate = "Data não disponível"

  if (request.preferred_date && request.preferred_time) {
    try {
      requestedDateTime = new Date(`${request.preferred_date}T${request.preferred_time}`)
      if (!isNaN(requestedDateTime.getTime())) {
        formattedDate = `${requestedDateTime.toLocaleDateString("pt-BR")} às ${requestedDateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      }
    } catch (error) {
      console.error("[v0] Erro ao formatar data:", error)
    }
  }

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
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Solicitação</h1>
          <p className="text-muted-foreground">Aprove, modifique ou rejeite a solicitação do cliente</p>
        </div>

        <div className="space-y-6">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle>Detalhes da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="text-foreground font-medium">{request.client?.full_name}</p>
                <p className="text-sm text-muted-foreground">{request.client?.email}</p>
                <p className="text-sm text-muted-foreground">{request.client?.phone}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Serviço</Label>
                <p className="text-foreground font-medium">{request.service?.name}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {request.service?.price} - {request.service?.duration} minutos
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Data/Hora Solicitada</Label>
                <p className="text-foreground font-medium">{formattedDate}</p>
              </div>

              {request.notes && (
                <div>
                  <Label className="text-muted-foreground">Observações do Cliente</Label>
                  <p className="text-foreground">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle>Modificar Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Nova Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="border-gold/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Novo Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="border-gold/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffNotes">Observações (opcional)</Label>
                <Textarea
                  id="staffNotes"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Adicione observações sobre a modificação ou rejeição..."
                  className="border-gold/20"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              <Check className="mr-2 h-4 w-4" />
              Aprovar
            </Button>
            <Button onClick={handleModify} className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
              <Edit className="mr-2 h-4 w-4" />
              Modificar e Aprovar
            </Button>
            <Button onClick={handleReject} variant="destructive" className="flex-1" disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
