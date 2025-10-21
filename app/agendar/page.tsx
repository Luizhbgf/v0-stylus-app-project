"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect } from "react"

export default function AgendarPage() {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Check if user is logged in
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      // Load services
      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })

      if (servicesData) {
        setServices(servicesData)
      }
    }
    loadData()
  }, [])

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para solicitar um agendamento")
      router.push("/auth/login")
      return
    }

    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error("Por favor, preencha todos os campos")
      return
    }

    setLoading(true)

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(":")
      const appointmentDateTime = new Date(selectedDate)
      appointmentDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      // Create appointment request
      const { error } = await supabase.from("appointment_requests").insert({
        client_id: user.id,
        service_id: selectedService,
        preferred_date: selectedDate.toISOString().split("T")[0],
        preferred_time: selectedTime,
        notes: notes || null,
        status: "pending",
      })

      if (error) throw error

      toast.success("Solicitação enviada com sucesso! Aguarde a confirmação do profissional.")
      router.push("/cliente")
    } catch (error: any) {
      console.error("[v0] Error creating appointment request:", error)
      toast.error("Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const selectedServiceData = services.find((s) => s.id === selectedService)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Styllus Logo" width={180} height={60} className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href={user ? "/cliente" : "/"}>
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step >= s
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {step > s ? <Check className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">Serviço</span>
              <span className="text-xs text-muted-foreground">Data e Hora</span>
              <span className="text-xs text-muted-foreground">Confirmar</span>
            </div>
          </div>

          {/* Step Content */}
          <Card className="p-8">
            {step === 1 && (
              <div>
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">Escolha o Serviço</h2>
                <RadioGroup value={selectedService} onValueChange={setSelectedService}>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <Label
                        key={service.id}
                        htmlFor={service.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <RadioGroupItem value={service.id} id={service.id} />
                          <div>
                            <p className="font-semibold text-foreground">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.duration} min • {service.category}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-primary">R$ {service.price}</span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">Escolha Data e Horário</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4 text-foreground">Selecione a Data</h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-lg border border-border"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4 text-foreground">Horários Disponíveis</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className={selectedTime === time ? "bg-primary text-primary-foreground" : ""}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Label htmlFor="notes" className="text-foreground">
                        Observações (opcional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Alguma preferência ou observação especial?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">Confirmar Solicitação</h2>
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Serviço</p>
                    <p className="font-semibold text-foreground">{selectedServiceData?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedServiceData?.duration} minutos</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Data e Horário Preferido</p>
                    <p className="font-semibold text-foreground">
                      {selectedDate?.toLocaleDateString("pt-BR")} às {selectedTime}
                    </p>
                  </div>
                  {notes && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Observações</p>
                      <p className="text-foreground">{notes}</p>
                    </div>
                  )}
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Valor</span>
                      <span className="text-2xl font-bold text-primary">R$ {selectedServiceData?.price}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      ⚠️ Esta é uma solicitação de agendamento. Um profissional irá confirmar seu horário em breve e você
                      receberá uma notificação.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
              <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={(step === 1 && !selectedService) || (step === 2 && (!selectedDate || !selectedTime))}
                  className="bg-primary text-primary-foreground hover:bg-accent"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-accent"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]
