"use client"

import { useState, useEffect } from "react"
import { createClient as createClientClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
            <p className="text-muted-foreground">Visualize seus agendamentos em formato de calendário</p>
          </div>
          <Link href="/staff/agenda/adicionar">
            <Button className="bg-gold hover:bg-gold/90 text-black w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
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
              className={viewMode === "day" ? "bg-gold hover:bg-gold/90 text-black" : ""}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              className={viewMode === "week" ? "bg-gold hover:bg-gold/90 text-black" : ""}
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
            <Card className="border-gold/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] sm:min-w-[800px]">
                    {/* Header with dates */}
                    <div
                      className="grid gap-px bg-border sticky top-0 z-10"
                      style={{ gridTemplateColumns: `60px repeat(${daysToDisplay.length}, 1fr)` }}
                    >
                      <div className="bg-card p-2 sm:p-4 font-semibold text-xs sm:text-sm">Hora</div>
                      {daysToDisplay.map((day) => (
                        <div key={day.toISOString()} className="bg-card p-2 sm:p-4 text-center">
                          <div className="text-xs sm:text-sm font-semibold">{format(day, "EEE", { locale: ptBR })}</div>
                          <div
                            className={`text-lg sm:text-2xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}
                          >
                            {format(day, "dd")}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(day, "MMM", { locale: ptBR })}
                          </div>
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
                            gridTemplateColumns: `60px repeat(${daysToDisplay.length}, 1fr)`,
                            minHeight: "80px",
                          }}
                        >
                          <div className="bg-card p-2 text-xs sm:text-sm font-medium text-muted-foreground sticky left-0">
                            {timeSlot}
                          </div>
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
                                  const isSubscriber = apt.client?.subscriptions?.[0]?.status === "active"
                                  const height = getAppointmentHeight(apt)
                                  const duration = formatDuration(apt)

                                  return (
                                    <Link key={apt.id} href={`/staff/agenda/${apt.id}`}>
                                      <div
                                        className={`group relative rounded p-1.5 sm:p-2 mb-1 text-[10px] sm:text-xs border overflow-hidden ${
                                          isSubscriber
                                            ? "bg-green-500/20 border-green-500/40"
                                            : "bg-gold/20 border-gold/40"
                                        }`}
                                        style={{ minHeight: `${height}px` }}
                                      >
                                        <div className="font-semibold truncate text-[10px] sm:text-xs">
                                          {apt.service?.name}
                                        </div>
                                        <div className="text-muted-foreground truncate text-[9px] sm:text-[11px]">
                                          {apt.client_type === "sporadic"
                                            ? apt.sporadic_client_name
                                            : apt.client?.full_name}
                                        </div>
                                        <div className="text-muted-foreground/80 text-[9px] sm:text-[10px] mt-0.5 font-medium">
                                          ⏱ {duration}
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

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500/40 rounded"></div>
                <span>Assinante</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gold/20 border border-gold/40 rounded"></div>
                <span>Cliente Regular</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-card border border-border rounded"></div>
                <span>Horário Disponível</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
