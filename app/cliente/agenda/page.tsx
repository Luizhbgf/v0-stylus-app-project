import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  differenceInMinutes,
  isToday,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 6)

function AgendaNavigation({ currentWeek }: { currentWeek: string }) {
  return (
    <div className="flex items-center bg-card border border-border rounded-full overflow-hidden w-fit">
      <Link href={`?week=${new Date(new Date(currentWeek).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}`}>
        <Button variant="ghost" size="icon" className="rounded-none hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>
      <Link href={`?week=${new Date().toISOString()}`}>
        <Button variant="ghost" className="px-4 rounded-none hover:bg-accent font-medium border-x border-border">
          <CalendarDays className="h-4 w-4 mr-2" />
          Hoje
        </Button>
      </Link>
      <Link href={`?week=${new Date(new Date(currentWeek).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}`}>
        <Button variant="ghost" size="icon" className="rounded-none hover:bg-accent">
          <ChevronRight className="h-5 w-5" />
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

  const getEventStyle = (appointment: any) => {
    const aptDate = parseISO(appointment.appointment_date)
    const hours = aptDate.getHours()
    const minutes = aptDate.getMinutes()

    const startTime = parseISO(appointment.appointment_date)
    const endTime = parseISO(appointment.end_time || appointment.appointment_date)
    const durationMinutes = differenceInMinutes(endTime, startTime) || appointment.service?.duration || 60

    const topPosition = (hours - 6) * 80 + (minutes / 60) * 80
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "from-green-500 to-green-600"
      case "confirmed":
        return "from-blue-500 to-blue-600"
      default:
        return "from-amber-500 to-amber-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "confirmed":
        return "Confirmado"
      default:
        return "Pendente"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h1>
          <p className="text-muted-foreground text-sm">Seus agendamentos da semana</p>
        </div>

        <div className="mb-6">
          <AgendaNavigation currentWeek={currentDate.toISOString()} />
        </div>

        <Card className="border-border shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div
                className="grid border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20"
                style={{ gridTemplateColumns: `70px repeat(7, 1fr)` }}
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

              <div className="relative">
                <div className="grid" style={{ gridTemplateColumns: `70px repeat(7, 1fr)` }}>
                  <div className="relative">
                    {TIME_SLOTS.map((hour) => (
                      <div key={hour} className="h-20 relative border-t border-border">
                        <span className="absolute -top-3 right-3 text-xs font-medium text-muted-foreground">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {daysToDisplay.map((day) => {
                    const dayAppointments = (appointments || []).filter((apt) =>
                      isSameDay(parseISO(apt.appointment_date), day),
                    )

                    return (
                      <div key={day.toISOString()} className="relative border-l border-border">
                        {TIME_SLOTS.map((hour) => (
                          <div key={`${day.toISOString()}-${hour}`} className="h-20 border-t border-border"></div>
                        ))}

                        {dayAppointments.map((apt) => {
                          const style = getEventStyle(apt)
                          const aptDate = parseISO(apt.appointment_date)

                          return (
                            <div
                              key={apt.id}
                              className={`absolute left-1 right-1 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-gradient-to-br ${getStatusColor(apt.status)}`}
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
                                <div className="text-xs opacity-90 line-clamp-1">{apt.staff?.full_name}</div>
                                <div className="mt-auto flex items-center justify-between">
                                  <div className="text-xs font-medium opacity-95">
                                    {format(aptDate, "HH:mm")} · {formatDuration(apt)}
                                  </div>
                                  <Badge className="text-[10px] px-1.5 py-0 bg-white/20 hover:bg-white/30 border-0">
                                    {getStatusLabel(apt.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
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

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full"></div>
            <span className="text-sm font-medium">Concluído</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
            <span className="text-sm font-medium">Confirmado</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <div className="w-3 h-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full"></div>
            <span className="text-sm font-medium">Pendente</span>
          </div>
        </div>
      </div>
    </div>
  )
}
