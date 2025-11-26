import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, differenceInMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, "0")}:00`
})

function AgendaNavigation({ currentWeek }: { currentWeek: string }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Link href={`?week=${new Date(new Date(currentWeek).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}`}>
        <Button variant="outline" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`?week=${new Date().toISOString()}`}>
        <Button variant="outline">Hoje</Button>
      </Link>
      <Link href={`?week=${new Date(new Date(currentWeek).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}`}>
        <Button variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}

export default async function ClienteAgenda({ searchParams }: { searchParams: { week?: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) redirect("/auth/login")

  const currentDate = searchParams.week ? new Date(searchParams.week) : new Date()
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      staff:staff_id(
        id,
        full_name,
        phone
      )
    `,
    )
    .eq("client_id", user.id)
    .gte("appointment_date", weekStart.toISOString())
    .lte("appointment_date", new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString())
    .neq("status", "cancelled")
    .order("appointment_date", { ascending: true })

  const daysToDisplay = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getAppointmentsForSlot = (date: Date, timeSlot: string) => {
    return (appointments || []).filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      const aptTime = format(aptDate, "HH:mm")
      return isSameDay(aptDate, date) && aptTime === timeSlot
    })
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
          <p className="text-muted-foreground">Visualize seus agendamentos da semana</p>
        </div>

        <AgendaNavigation currentWeek={currentDate.toISOString()} />

        {/* Mobile View - Grade responsiva */}
        <Card className="border-gold/20 md:hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header mobile */}
                <div
                  className="grid gap-px bg-border sticky top-0 z-10"
                  style={{ gridTemplateColumns: `70px repeat(${Math.min(daysToDisplay.length, 3)}, 1fr)` }}
                >
                  <div className="bg-card p-3 font-semibold text-sm">Hora</div>
                  {daysToDisplay.slice(0, 3).map((day) => (
                    <div key={day.toISOString()} className="bg-card p-3 text-center">
                      <div className="text-xs font-semibold">{format(day, "EEE", { locale: ptBR })}</div>
                      <div className={`text-xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}>
                        {format(day, "dd")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{format(day, "MMM", { locale: ptBR })}</div>
                    </div>
                  ))}
                </div>

                {/* Time slots mobile */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div
                    key={timeSlot}
                    className="grid gap-px bg-border relative"
                    style={{
                      gridTemplateColumns: `70px repeat(${Math.min(daysToDisplay.length, 3)}, 1fr)`,
                      minHeight: "100px",
                    }}
                  >
                    <div className="bg-card p-3 text-sm font-semibold text-muted-foreground sticky left-0 flex items-start">
                      {timeSlot}
                    </div>
                    {daysToDisplay.slice(0, 3).map((day) => {
                      const slotAppointments = getAppointmentsForSlot(day, timeSlot)

                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot}`}
                          className="bg-card p-2 transition-colors relative"
                        >
                          {slotAppointments.map((apt) => {
                            const height = getAppointmentHeight(apt)
                            const duration = formatDuration(apt)

                            return (
                              <div
                                key={apt.id}
                                className="bg-gold/20 border-2 border-gold/50 rounded-lg p-2 mb-2 text-xs overflow-hidden"
                                style={{ minHeight: `${Math.max(height, 80)}px` }}
                              >
                                <div className="font-bold text-sm mb-1 leading-tight line-clamp-2">
                                  {apt.service?.name}
                                </div>
                                <div className="text-muted-foreground text-xs leading-tight line-clamp-1 mb-2">
                                  {apt.staff?.full_name}
                                </div>
                                <div className="text-muted-foreground/90 text-xs font-semibold mt-auto">
                                  ⏱️ {duration}
                                </div>
                                <div className="text-muted-foreground/80 text-xs font-medium">
                                  🕐 {format(parseISO(apt.appointment_date), "HH:mm")}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] mt-1.5 px-1.5 py-0.5 ${
                                    apt.status === "completed"
                                      ? "bg-green-500/10 text-green-500 border-green-500/50"
                                      : apt.status === "confirmed"
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/50"
                                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
                                  }`}
                                >
                                  {apt.status === "completed"
                                    ? "✓ Concluído"
                                    : apt.status === "confirmed"
                                      ? "✓ Confirmado"
                                      : "⏳ Pendente"}
                                </Badge>
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

        {/* Desktop View - Grade completa */}
        <Card className="border-gold/20 hidden md:block">
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
                      <div className={`text-lg sm:text-2xl font-bold ${isSameDay(day, new Date()) ? "text-gold" : ""}`}>
                        {format(day, "dd")}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(day, "MMM", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>

                {TIME_SLOTS.map((timeSlot) => (
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

                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot}`}
                          className="bg-card p-1 sm:p-2 transition-colors relative"
                        >
                          {slotAppointments.map((apt) => {
                            const height = getAppointmentHeight(apt)
                            const duration = formatDuration(apt)

                            return (
                              <div
                                key={apt.id}
                                className="bg-gold/20 border border-gold/40 rounded p-1.5 sm:p-2 mb-1 text-[10px] sm:text-xs overflow-hidden"
                                style={{ minHeight: `${height}px` }}
                              >
                                <div className="font-semibold truncate text-[10px] sm:text-xs">{apt.service?.name}</div>
                                <div className="text-muted-foreground truncate text-[9px] sm:text-[11px]">
                                  {apt.staff?.full_name}
                                </div>
                                <div className="text-muted-foreground/80 text-[9px] sm:text-[10px] mt-0.5 font-medium">
                                  ⏱ {duration}
                                </div>
                                <div className="text-muted-foreground/70 text-[9px] sm:text-[10px]">
                                  {format(parseISO(apt.appointment_date), "HH:mm")}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] sm:text-[10px] mt-1 px-1 py-0 ${
                                    apt.status === "completed"
                                      ? "bg-green-500/10 text-green-500"
                                      : apt.status === "confirmed"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "bg-yellow-500/10 text-yellow-500"
                                  }`}
                                >
                                  {apt.status === "completed"
                                    ? "Concluído"
                                    : apt.status === "confirmed"
                                      ? "Confirmado"
                                      : "Pendente"}
                                </Badge>
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

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gold/20 border border-gold/40 rounded"></div>
            <span>Seu Agendamento</span>
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
