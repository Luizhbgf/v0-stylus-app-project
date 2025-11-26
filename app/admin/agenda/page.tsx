"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, ChevronLeft, ChevronRight, Plus, CalendarDays, Users } from "lucide-react"
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
import { toast } from "sonner"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 6)

export default function AdminAgendaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("week")

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

  async function deleteAppointment(id: string, event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      toast.error("Erro ao excluir agendamento")
      return
    }

    toast.success("Agendamento excluído")
    loadAppointments()
  }

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

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h1>
            <p className="text-muted-foreground text-sm">Agenda geral de atendimentos</p>
          </div>
          <Button
            onClick={() => router.push("/admin/agenda/adicionar")}
            size="lg"
            className="bg-gold hover:bg-gold/90 text-black font-semibold rounded-full shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo
          </Button>
        </div>

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

          <div className="flex items-center bg-card border border-border rounded-full overflow-hidden">
            <Users className="h-4 w-4 ml-3 text-muted-foreground" />
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="border-0 bg-transparent focus:ring-0 font-medium">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Profissionais</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-border shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className={viewMode === "week" ? "min-w-[900px]" : "min-w-[400px]"}>
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

              <div className="relative">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: viewMode === "week" ? `70px repeat(7, 1fr)` : `70px 1fr`,
                  }}
                >
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
                    const dayAppointments = appointments.filter((apt) => isSameDay(parseISO(apt.appointment_date), day))

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
                              className="group absolute left-1 right-1 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600"
                              style={{
                                top: style.top,
                                height: style.height,
                                zIndex: 10,
                              }}
                            >
                              <div className="p-2 h-full flex flex-col text-white relative">
                                <button
                                  onClick={(e) => deleteAppointment(apt.id, e)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded-full p-1.5 shadow-lg"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                                <div className="font-semibold text-sm leading-tight mb-0.5 line-clamp-1 pr-8">
                                  {apt.service?.name}
                                </div>
                                <div className="text-xs opacity-90 line-clamp-1">{apt.client?.full_name}</div>
                                {apt.staff && (
                                  <div className="text-xs opacity-80 line-clamp-1">{apt.staff.full_name}</div>
                                )}
                                <div className="mt-auto text-xs font-medium opacity-95">
                                  {format(aptDate, "HH:mm")} · {formatDuration(apt)}
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

        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full w-fit">
          <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
          <span className="text-sm font-medium">Agendamento</span>
        </div>
      </div>
    </div>
  )
}
