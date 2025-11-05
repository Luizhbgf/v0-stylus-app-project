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
import { ArrowLeft, Check, X, Edit, Calendar, Clock, User, DollarSign, UserX } from "lucide-react"
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

export default function GerenciarSolicitacao() {
  const [profile, setProfile] = useState<any>(null)
  const [request, setRequest] = useState<any>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [staffNotes, setStaffNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showModifyForm, setShowModifyForm] = useState(false)
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
      setRequest(requestData)
      setNewDate(requestData.preferred_date || "")
      setNewTime(requestData.preferred_time || "")
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

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Usuário não autenticado")
        setIsLoading(false)
        return
      }

      const timeFormatted = newTime.length > 5 ? newTime.substring(0, 5) : newTime
      const appointmentDateTime = new Date(`${newDate}T${timeFormatted}:00`)

      if (isNaN(appointmentDateTime.getTime())) {
        toast.error("Data ou horário inválido")
        setIsLoading(false)
        return
      }

      if (!request.client_id) {
        toast.error("Cliente não encontrado na solicitação")
        setIsLoading(false)
        return
      }

      const appointmentData = {
        client_id: request.client_id,
        staff_id: user.id,
        service_id: request.service_id,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
        notes: request.notes || null,
        payment_status: "pending",
        client_type: null,
        is_recurring: false,
        recurrence_type: null,
        recurrence_days: null,
        recurrence_end_date: null,
      }

      const { data: newAppointment, error: aptError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single()

      if (aptError) throw aptError

      const { error: reqError } = await supabase
        .from("appointment_requests")
        .update({
          status: "approved",
        })
        .eq("id", request.id)

      if (reqError) throw reqError

      toast.success("Solicitação aprovada!")
      router.push("/staff/agenda")
      router.refresh()
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error)
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

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Usuário não autenticado")
        setIsLoading(false)
        return
      }

      const timeFormatted = newTime.length > 5 ? newTime.substring(0, 5) : newTime
      const appointmentDateTime = new Date(`${newDate}T${timeFormatted}:00`)

      if (isNaN(appointmentDateTime.getTime())) {
        toast.error("Data ou horário inválido")
        setIsLoading(false)
        return
      }

      if (!request.client_id) {
        toast.error("Cliente não encontrado na solicitação")
        setIsLoading(false)
        return
      }

      const appointmentData = {
        client_id: request.client_id,
        staff_id: user.id,
        service_id: request.service_id,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
        notes: staffNotes
          ? `${request.notes || ""}\n\nModificado pelo profissional: ${staffNotes}`
          : request.notes || null,
        payment_status: "pending",
        client_type: null,
        is_recurring: false,
        recurrence_type: null,
        recurrence_days: null,
        recurrence_end_date: null,
      }

      const { data: newAppointment, error: aptError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single()

      if (aptError) throw aptError

      const { error: reqError } = await supabase
        .from("appointment_requests")
        .update({
          status: "modified",
        })
        .eq("id", request.id)

      if (reqError) throw reqError

      toast.success("Solicitação modificada e aprovada!")
      router.push("/staff/agenda")
      router.refresh()
    } catch (error) {
      console.error("Erro ao modificar solicitação:", error)
      toast.error("Erro ao modificar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNoShow = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("appointment_requests")
        .update({
          status: "no_show",
        })
        .eq("id", request.id)

      if (error) throw error

      toast.success("Cliente marcado como não compareceu")
      router.push("/staff/agenda")
      router.refresh()
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
        .from("appointment_requests")
        .update({
          status: "cancelled",
        })
        .eq("id", request.id)

      if (error) throw error

      toast.success("Solicitação cancelada")
      router.push("/staff/agenda")
      router.refresh()
    } catch (error) {
      console.error("Erro ao cancelar solicitação:", error)
      toast.error("Erro ao cancelar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("appointment_requests")
        .update({
          status: "rejected",
        })
        .eq("id", request.id)

      if (error) throw error

      toast.success("Solicitação rejeitada")
      router.push("/staff/agenda")
      router.refresh()
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error)
      toast.error("Erro ao rejeitar solicitação")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !request) return null

  const formatRequestedDateTime = () => {
    if (!request.preferred_date) return "Data não especificada"

    try {
      const date = new Date(request.preferred_date + "T00:00:00")
      const dateStr = date.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const timeStr = request.preferred_time ? request.preferred_time.substring(0, 5) : "Horário não especificado"
      return { dateStr, timeStr }
    } catch (error) {
      return { dateStr: "Data inválida", timeStr: "" }
    }
  }

  const { dateStr, timeStr } = formatRequestedDateTime()

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
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Solicitação</h1>
          <p className="text-muted-foreground">Visualize e gerencie a solicitação do cliente</p>
        </div>

        <div className="space-y-6">
          <Card className="border-gold/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes da Solicitação</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    request.status === "approved"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : request.status === "rejected"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : request.status === "modified"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : request.status === "no_show"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : request.status === "cancelled"
                              ? "bg-gray-500/10 text-gray-500 border-gray-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }
                >
                  {request.status === "approved"
                    ? "Aprovada"
                    : request.status === "rejected"
                      ? "Rejeitada"
                      : request.status === "modified"
                        ? "Modificada"
                        : request.status === "no_show"
                          ? "Não Compareceu"
                          : request.status === "cancelled"
                            ? "Cancelada"
                            : "Pendente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gold mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data e Hora Solicitada</p>
                  <p className="text-foreground font-medium">{dateStr}</p>
                  {timeStr && <p className="text-foreground font-medium">{timeStr}</p>}
                </div>
              </div>

              {request.service && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Serviço</p>
                    <p className="text-foreground font-medium">{request.service.name}</p>
                    <p className="text-sm text-muted-foreground">{request.service.duration} minutos</p>
                  </div>
                </div>
              )}

              {request.client && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="text-foreground font-medium">{request.client.full_name}</p>
                    {request.client.phone && <p className="text-sm text-muted-foreground">{request.client.phone}</p>}
                    {request.client.email && <p className="text-sm text-muted-foreground">{request.client.email}</p>}
                  </div>
                </div>
              )}

              {request.service?.price && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-foreground font-medium text-lg">R$ {request.service.price}</p>
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="pt-4 border-t border-gold/20">
                  <p className="text-sm text-muted-foreground mb-1">Observações do Cliente</p>
                  <p className="text-foreground">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {request.status === "pending" && (
            <>
              {!showModifyForm && (
                <Card className="border-gold/20">
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                          <Check className="mr-2 h-4 w-4" />
                          Aprovar Solicitação
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar aprovação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja aprovar esta solicitação com a data e horário solicitados?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                            Aprovar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      onClick={() => setShowModifyForm(true)}
                      className="w-full bg-gold hover:bg-gold/90 text-black"
                      disabled={isLoading}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modificar Data/Hora
                    </Button>

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
                            Tem certeza que o cliente não compareceu à solicitação?
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
                          Cancelar Solicitação
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                            Cancelar Solicitação
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-red-500/20 bg-transparent"
                          disabled={isLoading}
                        >
                          Rejeitar Solicitação
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar rejeição</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja rejeitar esta solicitação? O cliente será notificado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                            Rejeitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )}

              {showModifyForm && (
                <Card className="border-gold/20">
                  <CardHeader>
                    <CardTitle>Modificar Data e Horário</CardTitle>
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
                        placeholder="Adicione observações sobre a modificação..."
                        className="border-gold/20"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                            <Check className="mr-2 h-4 w-4" />
                            Confirmar Modificação
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar modificação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja aprovar esta solicitação com a nova data e horário?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleModify} className="bg-gold hover:bg-gold/90 text-black">
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="outline"
                        onClick={() => setShowModifyForm(false)}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
