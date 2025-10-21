"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AgendarPage() {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState("")
  const [selectedProfessional, setSelectedProfessional] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleConfirm = () => {
    alert("Agendamento confirmado! Você receberá uma confirmação por email.")
  }

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
              <Link href="/">
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
              {[1, 2, 3, 4].map((s) => (
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
                  {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">Serviço</span>
              <span className="text-xs text-muted-foreground">Profissional</span>
              <span className="text-xs text-muted-foreground">Data</span>
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
                            <p className="text-sm text-muted-foreground">{service.duration}</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-primary">{service.price}</span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">Escolha o Profissional</h2>
                <RadioGroup value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <div className="space-y-4">
                    {professionals.map((professional) => (
                      <Label
                        key={professional.id}
                        htmlFor={professional.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={professional.id} id={professional.id} />
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                          {professional.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{professional.name}</p>
                          <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">Escolha Data e Horário</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4 text-foreground">Selecione a Data</h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
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
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground">Confirmar Agendamento</h2>
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Serviço</p>
                    <p className="font-semibold text-foreground">
                      {services.find((s) => s.id === selectedService)?.name}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Profissional</p>
                    <p className="font-semibold text-foreground">
                      {professionals.find((p) => p.id === selectedProfessional)?.name}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Data e Horário</p>
                    <p className="font-semibold text-foreground">
                      {selectedDate?.toLocaleDateString("pt-BR")} às {selectedTime}
                    </p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {services.find((s) => s.id === selectedService)?.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
              <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedService) ||
                    (step === 2 && !selectedProfessional) ||
                    (step === 3 && (!selectedDate || !selectedTime))
                  }
                  className="bg-primary text-primary-foreground hover:bg-accent"
                >
                  Próximo
                </Button>
              ) : (
                <Button onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-accent">
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar Agendamento
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

const services = [
  { id: "1", name: "Corte e Escova", duration: "1h 30min", price: "R$ 120" },
  { id: "2", name: "Manicure e Pedicure", duration: "1h", price: "R$ 80" },
  { id: "3", name: "Design de Sobrancelhas", duration: "30min", price: "R$ 60" },
  { id: "4", name: "Maquiagem", duration: "1h", price: "R$ 150" },
  { id: "5", name: "Tratamentos Faciais", duration: "1h 30min", price: "R$ 180" },
  { id: "6", name: "Depilação", duration: "45min", price: "R$ 90" },
]

const professionals = [
  { id: "1", name: "Carla Mendes", specialty: "Especialista em Cabelos" },
  { id: "2", name: "Juliana Costa", specialty: "Manicure e Pedicure" },
  { id: "3", name: "Patricia Lima", specialty: "Design de Sobrancelhas" },
  { id: "4", name: "Fernanda Silva", specialty: "Maquiadora Profissional" },
]

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
