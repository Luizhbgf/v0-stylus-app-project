"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, ChevronLeft, ChevronRight, Plus, CalendarOff } from "lucide-react"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInMinutes,
} from "date-fns"
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
    const slotHour = Number.parseInt(timeSlot.split(":")[0])

    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      const aptHour = aptDate.getHours()

      // Check if appointment is on the same day and starts in this hour slot
      return isSameDay(aptDate, date) && aptHour === slotHour
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

  const getAppointmentHeight = (appointment: any) => {
    const startTime = parseISO(appointment.appointment_date)
    const endTime = parseISO(appointment.end_time || appointment.appointment_date)
    const durationMinutes = differenceInMinutes(endTime, startTime) || appointment.service?.duration || 60
    return Math.max(48, durationMinutes * 1.2)
  }

  const formatDuration = (appointment: any) => {
    const startTime = parseISO(appointment.appointment_date)
    const endTime = parseISO(appointment.end_time || appointment.appointment_date)
    const durationMinutes = differenceInMinutes(endTime, startTime) || appointment.service?.duration || 60

    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`
    }
    return `${durationMinutes}m`
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

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Agenda Geral</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visualize todos os agendamentos em formato de calendário
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={() => router.push("/admin/agenda/adicionar")}
              className="bg-gold hover:bg-gold/90 text-white h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
              Adicionar Agendamento
            </Button>

            <Button
              onClick={() => router.push("/admin/agenda/bloquear")}
              variant="outline"
              className="border-gold/40 hover:bg-gold/10 h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
            >
              <CalendarOff className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
              Bloquear Agenda
            </Button>
            {/* </CHANGE> */}

            <div className="flex items-center gap-2 sm:gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="h-12 w-12 sm:h-10 sm:w-10 bg-transparent"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={goToToday}
                className="h-12 flex-1 sm:flex-none sm:h-10 text-base sm:text-sm bg-transparent"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="h-12 w-12 sm:h-10 sm:w-10 bg-transparent"
              >
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                onClick={() => setViewMode("day")}
                className={`h-12 sm:h-10 flex-1 text-base sm:text-sm ${viewMode === "day" ? "bg-gold hover:bg-gold/90" : ""}`}
              >
                Dia
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className={`h-12 sm:h-10 flex-1 text-base sm:text-sm ${viewMode === "week" ? "bg-gold hover:bg-gold/90" : ""}`}
              >
                Semana
              </Button>
            </div>

            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full sm:w-[200px] border-gold/20 h-12 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {daysToDisplay.map((day) => {
            const dayAppointments = appointments.filter((apt) => isSameDay(parseISO(apt.appointment_date), day))

            return (
              <Card key={day.toISOString()} className="border-gold/20 shadow-md">
                <CardContent className="p-5">
                  <div className="mb-5 pb-4 border-b-2 border-border">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {format(day, "EEEE", { locale: ptBR })}
                    </div>
                    <div className={`text-3xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}>
                      {format(day, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                  </div>

                  {dayAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground/50 mb-2">📅</div>
                      <p className="text-muted-foreground">Nenhum agendamento</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dayAppointments
                        .sort((a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime())
                        .map((apt) => {
                          const aptDate = parseISO(apt.appointment_date)

                          return (
                            <div
                              key={apt.id}
                              onClick={() => router.push(`/admin/agenda/${apt.id}`)}
                              className="relative p-5 rounded-xl border-2 bg-gold/10 border-gold/40 hover:bg-gold/20 active:bg-gold/30 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="font-bold text-lg sm:text-xl mb-2 text-foreground">
                                    {apt.service?.name}
                                  </div>
                                  <div className="text-base text-muted-foreground mb-1">{apt.client?.full_name}</div>
                                  {apt.staff && (
                                    <div className="text-sm text-muted-foreground/80">
                                      Profissional: {apt.staff.full_name}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteAppointment(apt.id)
                                  }}
                                  className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors shrink-0"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 pt-3 border-t border-border">
                                <div className="flex items-center gap-2 text-base font-semibold text-gold">
                                  🕐 {format(aptDate, "HH:mm")}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Desktop View - Grade de Calendário */}
        <Card className="border-gold/20 hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
              <div className="min-w-[600px] sm:min-w-[800px]">
                <div
                  className="grid gap-px bg-border sticky top-0 z-30 shadow-lg"
                  style={{ gridTemplateColumns: `60px repeat(${daysToDisplay.length}, 1fr)` }}
                >
                  <div className="bg-card p-2 sm:p-4 font-semibold text-xs sm:text-sm border-b-2 border-gold/20">
                    Hora
                  </div>
                  {daysToDisplay.map((day) => (
                    <div key={day.toISOString()} className="bg-card p-2 sm:p-4 text-center border-b-2 border-gold/20">
                      <div className="text-xs sm:text-sm font-semibold">{format(day, "EEE", { locale: ptBR })}</div>
                      <div className={`text-lg sm:text-2xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}>
                        {format(day, "dd")}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(day, "MMM", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div
                    key={timeSlot}
                    className="grid gap-px bg-border relative"
                    style={{
                      gridTemplateColumns: `60px repeat(${daysToDisplay.length}, 1fr)`,
                      minHeight: "80px",
                    }}
                  >
                    <div className="bg-card p-2 text-xs sm:text-sm font-medium text-muted-foreground">{timeSlot}</div>
                    {daysToDisplay.map((day) => {
                      const slotAppointments = getAppointmentsForSlot(day, timeSlot)
                      const isAvailable = slotAppointments.length === 0

                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot}`}
                          className={`bg-card p-1 sm:p-2 transition-colors relative ${
                            isAvailable ? "hover:bg-accent cursor-pointer" : ""
                          }`}
                        >
                          {slotAppointments.map((apt) => {
                            const height = getAppointmentHeight(apt)
                            const aptDate = parseISO(apt.appointment_date)

                            return (
                              <div
                                key={apt.id}
                                onClick={() => router.push(`/admin/agenda/${apt.id}`)}
                                className="group relative bg-gold/20 border border-gold/40 rounded p-1.5 sm:p-2 mb-1 text-[10px] sm:text-xs overflow-hidden cursor-pointer hover:bg-gold/30 transition-all"
                                style={{ minHeight: `${height}px` }}
                              >
                                <div className="font-semibold truncate text-[10px] sm:text-xs">{apt.service?.name}</div>
                                <div className="text-muted-foreground truncate text-[9px] sm:text-[11px]">
                                  {apt.client?.full_name}
                                </div>
                                {apt.staff && (
                                  <div className="text-muted-foreground truncate text-[9px] sm:text-[10px]">
                                    {apt.staff.full_name}
                                  </div>
                                )}
                                <div className="text-muted-foreground/70 text-[9px] sm:text-[10px]">
                                  {format(aptDate, "HH:mm")}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteAppointment(apt.id)
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded p-1 hover:bg-red-600 z-10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 text-sm sm:text-base">
          <div className="flex items-center gap-3 p-3 sm:p-0 bg-card sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-border">
            <div className="w-5 h-5 sm:w-4 sm:h-4 bg-gold/20 border-2 border-gold/40 rounded shrink-0"></div>
            <span>Horário Ocupado</span>
          </div>
          <div className="flex items-center gap-3 p-3 sm:p-0 bg-card sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-border">
            <div className="w-5 h-5 sm:w-4 sm:h-4 bg-card border-2 border-border rounded shrink-0"></div>
            <span>Horário Disponível</span>
          </div>
        </div>
      </div>
    </div>
  )
}
