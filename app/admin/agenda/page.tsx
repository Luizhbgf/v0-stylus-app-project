"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, "0")}:00`
})

export default function AdminAgendaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("week")

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
  }, [profile, selectedStaff, currentDate, viewMode])

  async function loadAppointments() {
    const startDate = viewMode === "week" ? startOfWeek(currentDate, { weekStartsOn: 0 }) : currentDate
    const endDate = viewMode === "week" ? endOfWeek(currentDate, { weekStartsOn: 0 }) : currentDate

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
      .gte("appointment_date", startDate.toISOString())
      .lte("appointment_date", new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .neq("status", "cancelled")
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

  const getAppointmentsForSlot = (date: Date, timeSlot: string) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      const aptTime = format(aptDate, "HH:mm")
      return isSameDay(aptDate, date) && aptTime === timeSlot
    })
  }

  const goToPrevious = () => {
    setCurrentDate(viewMode === "week" ? addDays(currentDate, -7) : addDays(currentDate, -1))
  }

  const goToNext = () => {
    setCurrentDate(viewMode === "week" ? addDays(currentDate, 7) : addDays(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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

  const daysToDisplay =
    viewMode === "week"
      ? eachDayOfInterval({
          start: startOfWeek(currentDate, { weekStartsOn: 0 }),
          end: endOfWeek(currentDate, { weekStartsOn: 0 }),
        })
      : [currentDate]

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Agenda Geral</h1>
          <p className="text-muted-foreground">Visualize todos os agendamentos em formato de calendário</p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={() => router.push("/admin/agenda/adicionar")}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                onClick={() => setViewMode("day")}
                className={viewMode === "day" ? "bg-gold hover:bg-gold/90" : ""}
              >
                Dia
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className={viewMode === "week" ? "bg-gold hover:bg-gold/90" : ""}
              >
                Semana
              </Button>
            </div>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[200px] border-gold/20">
                <SelectValue placeholder="Profissional" />
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
        </div>

        <Card className="border-gold/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header with dates */}
                <div
                  className="grid gap-px bg-border"
                  style={{ gridTemplateColumns: `80px repeat(${daysToDisplay.length}, 1fr)` }}
                >
                  <div className="bg-card p-4 font-semibold text-sm">Horário</div>
                  {daysToDisplay.map((day) => (
                    <div key={day.toISOString()} className="bg-card p-4 text-center">
                      <div className="text-sm font-semibold">{format(day, "EEE", { locale: ptBR })}</div>
                      <div className={`text-2xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}>
                        {format(day, "dd")}
                      </div>
                      <div className="text-xs text-muted-foreground">{format(day, "MMM", { locale: ptBR })}</div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div
                    key={timeSlot}
                    className="grid gap-px bg-border"
                    style={{ gridTemplateColumns: `80px repeat(${daysToDisplay.length}, 1fr)` }}
                  >
                    <div className="bg-card p-4 text-sm font-medium text-muted-foreground">{timeSlot}</div>
                    {daysToDisplay.map((day) => {
                      const slotAppointments = getAppointmentsForSlot(day, timeSlot)
                      const isAvailable = slotAppointments.length === 0

                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot}`}
                          className={`bg-card p-2 min-h-[80px] transition-colors ${
                            isAvailable ? "hover:bg-accent cursor-pointer" : ""
                          }`}
                        >
                          {slotAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="group relative bg-gold/20 border border-gold/40 rounded p-2 mb-2 text-xs"
                            >
                              <div className="font-semibold truncate">{apt.service?.name}</div>
                              <div className="text-muted-foreground truncate">{apt.client?.full_name}</div>
                              {apt.staff && (
                                <div className="text-muted-foreground truncate text-[10px]">{apt.staff.full_name}</div>
                              )}
                              <button
                                onClick={() => deleteAppointment(apt.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gold/20 border border-gold/40 rounded"></div>
            <span>Horário Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-card border border-border rounded"></div>
            <span>Horário Disponível</span>
          </div>
        </div>
      </div>
    </div>
  )
}
