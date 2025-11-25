"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Trash2, Filter } from "lucide-react"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

export default function AdminAgendaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"))

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profileData || profileData.user_level < 30) {
        router.push("/cliente")
        return
      }

      setProfile(profileData)

      const { data: staffData } = await supabase.from("profiles").select("*").gte("user_level", 20).order("full_name")

      setStaff(staffData || [])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    if (profile) {
      loadAppointments()
    }
  }, [profile, selectedStaff, startDate, endDate])

  async function loadAppointments() {
    let query = supabase
      .from("appointments")
      .select(
        `
      *,
      service:services(*),
      staff:staff_id(id, full_name),
      client:client_id(id, full_name)
    `,
      )
      .gte("appointment_date", new Date(startDate).toISOString())
      .lte("appointment_date", new Date(endDate + "T23:59:59").toISOString())
      .order("appointment_date", { ascending: true })

    if (selectedStaff !== "all") {
      query = query.eq("staff_id", selectedStaff)
    }

    const { data } = await query
    setAppointments(data || [])
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      toast.error("Erro ao excluir agendamento")
      return
    }

    toast.success("Agendamento excluído com sucesso")
    loadAppointments()
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Group appointments by date
  const appointmentsByDate: Record<string, any[]> = {}
  appointments.forEach((apt) => {
    const dateKey = format(new Date(apt.appointment_date), "yyyy-MM-dd")
    if (!appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey] = []
    }
    appointmentsByDate[dateKey].push(apt)
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Agenda Geral</h1>
          <p className="text-muted-foreground">Visualize todos os agendamentos de todos os profissionais</p>
        </div>

        <Card className="border-gold/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-gold" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Profissional</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="border-gold/20">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Object.entries(appointmentsByDate).map(([dateKey, dayAppointments]) => {
            const date = new Date(dateKey + "T12:00:00")

            return (
              <Card key={dateKey} className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5 text-gold" />
                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {dayAppointments.length} agendamento(s)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-gold/10"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex flex-col items-center justify-center w-16 h-16 bg-gold/10 rounded-lg">
                            <Clock className="h-5 w-5 text-gold mb-1" />
                            <span className="text-xs font-medium text-foreground">
                              {format(new Date(apt.appointment_date), "HH:mm")}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{apt.service?.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Cliente: {apt.client?.full_name || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Profissional: {apt.staff?.full_name || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                apt.status === "completed"
                                  ? "bg-green-500/10 text-green-500"
                                  : apt.status === "confirmed"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : apt.status === "cancelled"
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-yellow-500/10 text-yellow-500"
                              }`}
                            >
                              {apt.status === "completed"
                                ? "Concluído"
                                : apt.status === "confirmed"
                                  ? "Confirmado"
                                  : apt.status === "cancelled"
                                    ? "Cancelado"
                                    : "Pendente"}
                            </span>
                            <p className="text-lg font-bold text-gold mt-2">R$ {apt.service?.price}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAppointment(apt.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {Object.keys(appointmentsByDate).length === 0 && (
            <Card className="border-gold/20">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhum agendamento encontrado no período selecionado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
