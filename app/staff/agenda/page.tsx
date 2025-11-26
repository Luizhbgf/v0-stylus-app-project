"use client"

import { useState, useEffect } from "react"
import { createClient as createClientClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInMinutes,
  isToday,
} from "date-fns"
import { ptBR } from "date-fns/locale"

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6
  return hour
})

export default function StaffAgenda() {
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("week")

  const router = useRouter()
  const supabase = createClientClient()

  const getAppointmentColor = (appointment: any) => {
    if (appointment.client?.subscriptions?.[0]?.status === "active") {
      return "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
    }
    if (appointment.payment_status === "overdue") {
      return "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300"
    }
    if (appointment.client_type === "sporadic") {
      return "bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300"
    }
    return "bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300"
  }

  const getClientTypeLabel = (appointment: any) => {
    if (appointment.client?.subscriptions?.[0]?.status === "active") return "Assinante"
    if (appointment.payment_status === "overdue") return "Devedor"
    if (appointment.client_type === "sporadic") return "Esporádico"
    return "Padrão"
  }

  const getAppointmentHeight = (appointment: any) => {
    const startTime = parseISO(appointment.appointment_date)
    const endTime = parseISO(appointment.end_time || appointment.appointment_date)
    const durationMinutes = differenceInMinutes(endTime, startTime) || appointment.service?.duration || 60
    // 1 minuto = ~1.2px, mínimo 48px
    return Math.max(48, durationMinutes * 1.2)
  }

  const getEventStyle = (appointment: any) => {
    const aptDate = parseISO(appointment.appointment_date)
    const hours = aptDate.getHours()
    const minutes = aptDate.getMinutes()

    const startTime = parseISO(appointment.appointment_date)
    const endTime = parseISO(appointment.end_time || appointment.appointment_date)
    const durationMinutes = differenceInMinutes(endTime, startTime) || appointment.service?.duration || 60

    // Posição top baseada na hora e minuto exato (cada hora = 80px)
    const topPosition = (hours - 6) * 80 + (minutes / 60) * 80

    // Altura proporcional à duração (1 minuto = 1.33px)
    const height = Math.max(32, (durationMinutes / 60) * 80)

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
    }
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

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (profile) {
      loadAppointments(profile.id)
    }
  }, [profile, currentDate, viewMode])

  const loadData = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profileData || profileData.user_level < 20) {
      router.push("/cliente")
      return
    }

    setProfile(profileData)
  }

  const loadAppointments = async (staffId: string) => {
    const startDate = viewMode === "week" ? startOfWeek(currentDate, { weekStartsOn: 0 }) : currentDate
    const endDate = viewMode === "week" ? endOfWeek(currentDate, { weekStartsOn: 0 }) : currentDate

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        service:services!service_id(*),
        client:profiles!client_id(
          id,
          full_name,
          phone,
          subscriptions!client_id(status)
        )
      `,
      )
      .eq("staff_id", staffId)
      .neq("status", "cancelled")
      .gte("appointment_date", startDate.toISOString())
      .lte("appointment_date", new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .order("appointment_date", { ascending: true })

    if (error) {
      console.error("Error loading appointments:", error)
      setIsLoading(false)
      return
    }

    setAppointments(data || [])
    setIsLoading(false)
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

  if (!profile) return null

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

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header estilo iPhone */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h1>
            <p className="text-muted-foreground text-sm">Sua agenda de atendimentos</p>
          </div>
          <Link href="/staff/agenda/adicionar">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold rounded-full shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              Novo
            </Button>
          </Link>
        </div>

        {/* Controles de navegação estilo iPhone */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-full overflow-hidden">
            <Button variant="ghost" size="icon" onClick={goToPrevious} className="rounded-none hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="px-4 rounded-none hover:bg-accent font-medium border-x border-border"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNext} className="rounded-none hover:bg-accent">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center bg-card border border-border rounded-full overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => setViewMode("day")}
              className={`px-6 rounded-none ${viewMode === "day" ? "bg-gold text-black font-semibold" : "hover:bg-accent"}`}
            >
              Dia
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewMode("week")}
              className={`px-6 rounded-none border-l border-border ${viewMode === "week" ? "bg-gold text-black font-semibold" : "hover:bg-accent"}`}
            >
              Semana
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando agenda...</p>
          </div>
        ) : (
          <Card className="border-border shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className={viewMode === "week" ? "min-w-[900px]" : "min-w-[400px]"}>
                {/* Header com dias da semana estilo iPhone */}
                <div
                  className="grid border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20"
                  style={{
                    gridTemplateColumns: viewMode === "week" ? `70px repeat(7, 1fr)` : `70px 1fr`,
                  }}
                >
                  <div className="p-4"></div>
                  {daysToDisplay.map((day) => {
                    const today = isToday(day)
                    return (
                      <div key={day.toISOString()} className="p-4 text-center border-l border-border">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {format(day, "EEE", { locale: ptBR })}
                        </div>
                        <div
                          className={`mt-1 inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                            today ? "bg-gold text-black" : "text-foreground"
                          }`}
                        >
                          {format(day, "dd")}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Grid de horários com eventos estilo iPhone Calendar */}
                <div className="relative">
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: viewMode === "week" ? `70px repeat(7, 1fr)` : `70px 1fr`,
                    }}
                  >
                    {/* Coluna de horários */}
                    <div className="relative">
                      {TIME_SLOTS.map((hour) => (
                        <div key={hour} className="h-20 relative border-t border-border">
                          <span className="absolute -top-3 right-3 text-xs font-medium text-muted-foreground">
                            {hour.toString().padStart(2, "0")}:00
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Colunas de dias com eventos */}
                    {daysToDisplay.map((day, dayIndex) => {
                      const dayAppointments = appointments.filter((apt) =>
                        isSameDay(parseISO(apt.appointment_date), day),
                      )

                      return (
                        <div key={day.toISOString()} className="relative border-l border-border">
                          {/* Linhas de hora */}
                          {TIME_SLOTS.map((hour) => (
                            <div key={`${day.toISOString()}-${hour}`} className="h-20 border-t border-border"></div>
                          ))}

                          {/* Eventos sobrepostos estilo iPhone */}
                          {dayAppointments.map((apt, index) => {
                            const isSubscriber = apt.client?.subscriptions?.[0]?.status === "active"
                            const style = getEventStyle(apt)
                            const aptDate = parseISO(apt.appointment_date)

                            return (
                              <Link key={apt.id} href={`/staff/agenda/${apt.id}`}>
                                <div
                                  className={`absolute left-1 right-1 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
                                    isSubscriber
                                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                      : "bg-gradient-to-br from-amber-500 to-amber-600"
                                  }`}
                                  style={{
                                    top: style.top,
                                    height: style.height,
                                    zIndex: 10,
                                  }}
                                >
                                  <div className="p-2 h-full flex flex-col text-white">
                                    <div className="font-semibold text-sm leading-tight mb-0.5 line-clamp-1">
                                      {apt.service?.name}
                                    </div>
                                    <div className="text-xs opacity-90 line-clamp-1">
                                      {apt.client_type === "sporadic"
                                        ? apt.sporadic_client_name
                                        : apt.client?.full_name}
                                    </div>
                                    <div className="mt-auto text-xs font-medium opacity-95">
                                      {format(aptDate, "HH:mm")} · {formatDuration(apt)}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Legenda estilo iPhone */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full"></div>
            <span className="text-sm font-medium">Assinante</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <div className="w-3 h-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full"></div>
            <span className="text-sm font-medium">Cliente Regular</span>
          </div>
        </div>
      </div>
    </div>
  )
}
