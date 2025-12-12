"use client"

import { useState, useEffect } from "react"
import { createClient as createClientClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, ChevronLeft, ChevronRight, CalendarOff } from "lucide-react"
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
} from "date-fns"
import { ptBR } from "date-fns/locale"

const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, "0")}:00`
})

export default function StaffAgenda() {
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("week")

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
    console.log("[v0] Loading appointments for staff:", staffId)
    console.log("[v0] Current date:", currentDate)
    console.log("[v0] View mode:", viewMode)

    const startDate = viewMode === "week" ? startOfWeek(currentDate, { weekStartsOn: 0 }) : currentDate
    const endDate = viewMode === "week" ? endOfWeek(currentDate, { weekStartsOn: 0 }) : currentDate

    console.log("[v0] Date range:", { startDate, endDate })

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

    console.log("[v0] Query result:", { data, error, count: data?.length })

    if (error) {
      console.error("[v0] Error loading appointments:", error)
      setIsLoading(false)
      return
    }

    console.log("[v0] Appointments loaded:", data)
    setAppointments(data || [])
    setIsLoading(false)
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

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize seus agendamentos em formato de calendário
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/staff/agenda/adicionar" className="w-full sm:w-auto">
              <Button className="bg-gold hover:bg-gold/90 text-black w-full h-12 sm:h-10 text-base sm:text-sm">
                <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                Adicionar Agendamento
              </Button>
            </Link>
            <Link href="/staff/agenda/bloquear" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="border-gold/40 hover:bg-gold/10 w-full h-12 sm:h-10 text-base sm:text-sm bg-transparent"
              >
                <CalendarOff className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                Bloquear Agenda
              </Button>
            </Link>
          </div>
          {/* </CHANGE> */}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
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
              className={`h-12 sm:h-10 flex-1 text-base sm:text-sm ${viewMode === "day" ? "bg-gold hover:bg-gold/90 text-black" : ""}`}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              className={`h-12 sm:h-10 flex-1 text-base sm:text-sm ${viewMode === "week" ? "bg-gold hover:bg-gold/90 text-black" : ""}`}
            >
              Semana
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
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
                            .sort(
                              (a, b) => parseISO(a.appointment_date).getTime() - parseISO(b.appointment_date).getTime(),
                            )
                            .map((apt) => {
                              const isSubscriber = apt.client?.subscriptions?.[0]?.status === "active"
                              const aptDate = parseISO(apt.appointment_date)

                              return (
                                <Link key={apt.id} href={`/staff/agenda/${apt.id}`}>
                                  <div
                                    className={`p-5 rounded-xl border-2 transition-colors ${
                                      isSubscriber
                                        ? "bg-green-500/10 border-green-500/40 hover:bg-green-500/20 active:bg-green-500/30"
                                        : "bg-gold/10 border-gold/40 hover:bg-gold/20 active:bg-gold/30"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1 min-w-0 pr-3">
                                        <div className="font-bold text-lg sm:text-xl mb-2">{apt.service?.name}</div>
                                        <div className="text-base text-muted-foreground">
                                          {apt.client_type === "sporadic"
                                            ? apt.sporadic_client_name
                                            : apt.client?.full_name}
                                        </div>
                                      </div>
                                      {isSubscriber && (
                                        <div className="px-3 py-1.5 bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold shrink-0">
                                          Assinante
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                                      <div className="flex items-center gap-2 text-base font-semibold text-gold">
                                        🕐 {format(aptDate, "HH:mm")}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
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
                  <div className="min-w-[800px]">
                    <div
                      className="grid gap-px bg-border sticky top-0 z-30 shadow-lg"
                      style={{ gridTemplateColumns: `80px repeat(${daysToDisplay.length}, 1fr)` }}
                    >
                      <div className="bg-card p-4 font-semibold text-sm border-b-2 border-gold/20">Hora</div>
                      {daysToDisplay.map((day) => (
                        <div key={day.toISOString()} className="bg-card p-4 text-center border-b-2 border-gold/20">
                          <div className="text-sm font-semibold">{format(day, "EEE", { locale: ptBR })}</div>
                          <div className={`text-2xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}>
                            {format(day, "dd")}
                          </div>
                          <div className="text-xs text-muted-foreground">{format(day, "MMM", { locale: ptBR })}</div>
                        </div>
                      ))}
                    </div>

                    {/* Time slots */}
                    <div className="relative">
                      {TIME_SLOTS.map((timeSlot, index) => (
                        <div
                          key={timeSlot}
                          className="grid gap-px bg-border relative"
                          style={{
                            gridTemplateColumns: `80px repeat(${daysToDisplay.length}, 1fr)`,
                            minHeight: "80px",
                          }}
                        >
                          <div className="bg-card p-3 text-sm font-medium text-muted-foreground">{timeSlot}</div>
                          {daysToDisplay.map((day) => {
                            const slotAppointments = getAppointmentsForSlot(day, timeSlot)
                            const isAvailable = slotAppointments.length === 0

                            return (
                              <div
                                key={`${day.toISOString()}-${timeSlot}`}
                                className={`bg-card p-2 transition-colors relative ${
                                  isAvailable ? "hover:bg-accent cursor-pointer" : ""
                                }`}
                              >
                                {slotAppointments.map((apt) => {
                                  const isSubscriber = apt.client?.subscriptions?.[0]?.status === "active"
                                  const height = getAppointmentHeight(apt)

                                  return (
                                    <Link key={apt.id} href={`/staff/agenda/${apt.id}`}>
                                      <div
                                        className={`group relative rounded p-2 mb-1 text-xs border overflow-hidden hover:opacity-80 transition-opacity ${
                                          isSubscriber
                                            ? "bg-green-500/20 border-green-500/40"
                                            : "bg-gold/20 border-gold/40"
                                        }`}
                                        style={{ minHeight: `${height}px` }}
                                      >
                                        <div className="font-semibold truncate">{apt.service?.name}</div>
                                        <div className="text-muted-foreground truncate text-[11px]">
                                          {apt.client_type === "sporadic"
                                            ? apt.sporadic_client_name
                                            : apt.client?.full_name}
                                        </div>
                                        <div className="text-muted-foreground/70 text-[9px] sm:text-[10px]">
                                          {format(parseISO(apt.appointment_date), "HH:mm")}
                                        </div>
                                      </div>
                                    </Link>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-3 p-3 sm:p-0 bg-card sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-border">
                <div className="w-5 h-5 sm:w-4 sm:h-4 bg-green-500/20 border-2 border-green-500/40 rounded shrink-0"></div>
                <span>Assinante</span>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-0 bg-card sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-border">
                <div className="w-5 h-5 sm:w-4 sm:h-4 bg-gold/20 border-2 border-gold/40 rounded shrink-0"></div>
                <span>Cliente Regular</span>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-0 bg-card sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-border md:flex">
                <div className="w-5 h-5 sm:w-4 sm:h-4 bg-card border-2 border-border rounded shrink-0"></div>
                <span>Horário Disponível</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
