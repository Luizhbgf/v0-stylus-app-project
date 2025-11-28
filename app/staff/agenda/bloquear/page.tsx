"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Lock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const BLOCK_TYPES = [
  { value: "lunch", label: "Horário de Almoço", color: "#F59E0B" },
  { value: "travel", label: "Viagem", color: "#8B5CF6" },
  { value: "vacation", label: "Férias", color: "#10B981" },
  { value: "personal", label: "Pessoal", color: "#3B82F6" },
  { value: "other", label: "Outro", color: "#EF4444" },
]

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
]

export default function StaffBloquearAgendaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [blockType, setBlockType] = useState("lunch")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [recurrenceType, setRecurrenceType] = useState("none")
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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
    loadBlocks(user.id)
    setLoading(false)
  }

  async function loadBlocks(userId: string) {
    const { data } = await supabase
      .from("agenda_blocks")
      .select("*")
      .eq("staff_id", userId)
      .order("start_time", { ascending: false })
    setBlocks(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title || !startDate || !startTime || !endDate || !endTime) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      toast.error("Data/hora final deve ser posterior à inicial")
      return
    }

    const blockColor = BLOCK_TYPES.find((t) => t.value === blockType)?.color || "#EF4444"

    const blockData = {
      staff_id: profile.id,
      title,
      description,
      block_type: blockType,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceType === "weekly" ? recurrenceDays : null,
      recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
      color: blockColor,
    }

    const { error } = await supabase.from("agenda_blocks").insert(blockData)

    if (error) {
      console.error("Erro ao criar bloqueio:", error)
      toast.error("Erro ao criar bloqueio de agenda")
      return
    }

    toast.success("Bloqueio de agenda criado com sucesso!")
    resetForm()
    loadBlocks(profile.id)
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    setBlockType("lunch")
    setStartDate("")
    setStartTime("")
    setEndDate("")
    setEndTime("")
    setRecurrenceType("none")
    setRecurrenceDays([])
    setRecurrenceEndDate("")
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este bloqueio?")) return

    const { error } = await supabase.from("agenda_blocks").delete().eq("id", id)

    if (error) {
      toast.error("Erro ao excluir bloqueio")
      return
    }

    toast.success("Bloqueio excluído com sucesso")
    loadBlocks(profile.id)
  }

  function toggleWeekday(day: number) {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter((d) => d !== day))
    } else {
      setRecurrenceDays([...recurrenceDays, day])
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bloquear Minha Agenda</h1>
          <p className="text-muted-foreground">Bloqueie períodos da sua agenda para viagens, almoço, férias, etc.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gold" />
                Criar Bloqueio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blockType">Tipo de Bloqueio *</Label>
                  <Select value={blockType} onValueChange={setBlockType}>
                    <SelectTrigger id="blockType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: type.color }} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Almoço, Viagem para SP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora Início *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Fim *</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora Fim *</Label>
                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrence">Recorrência</Label>
                  <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                    <SelectTrigger id="recurrence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não se repete</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceType === "weekly" && (
                  <div className="space-y-2">
                    <Label>Dias da Semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={recurrenceDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleWeekday(day.value)}
                          className={recurrenceDays.includes(day.value) ? "bg-gold hover:bg-gold/90" : ""}
                        >
                          {day.label.substring(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrenceType !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceEndDate">Recorrência termina em</Label>
                    <Input
                      id="recurrenceEndDate"
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90">
                    <Lock className="h-4 w-4 mr-2" />
                    Criar Bloqueio
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" />
                  Meus Bloqueios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {blocks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum bloqueio cadastrado</p>
                  ) : (
                    blocks.map((block) => (
                      <Card key={block.id} className="border" style={{ borderColor: block.color }}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: block.color }} />
                                <h3 className="font-semibold">{block.title}</h3>
                              </div>
                              {block.description && (
                                <p className="text-sm text-muted-foreground mb-2">{block.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(block.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })} até{" "}
                                  {format(new Date(block.end_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              {block.recurrence_type !== "none" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  🔄 Repete {block.recurrence_type === "daily" ? "diariamente" : "semanalmente"}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(block.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
