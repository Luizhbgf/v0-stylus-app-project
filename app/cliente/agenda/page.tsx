import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Minha Agenda</h1>
          <p className="text-muted-foreground">Visualize seus agendamentos da semana</p>
        </div>

        <AgendaNavigation currentWeek={currentDate.toISOString()} />

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
                          className="bg-card p-2 min-h-[80px] transition-colors"
                        >
                          {slotAppointments.map((apt) => (
                            <div key={apt.id} className="bg-gold/20 border border-gold/40 rounded p-2 mb-2 text-xs">
                              <div className="font-semibold truncate">{apt.service?.name}</div>
                              <div className="text-muted-foreground truncate">{apt.staff?.full_name}</div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] mt-1 ${
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
