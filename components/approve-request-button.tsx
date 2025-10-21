"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

interface ApproveRequestButtonProps {
  requestId: string
  clientId: string
  serviceId: string
  preferredDate: string
  preferredTime: string | null
  staffId: string
}

export function ApproveRequestButton({
  requestId,
  clientId,
  serviceId,
  preferredDate,
  preferredTime,
  staffId,
}: ApproveRequestButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(preferredDate))
  const [selectedTime, setSelectedTime] = useState(preferredTime || "09:00")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async () => {
    setLoading(true)
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(":")
      const appointmentDateTime = new Date(selectedDate)
      appointmentDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      // Create appointment
      const { error: appointmentError } = await supabase.from("appointments").insert({
        client_id: clientId,
        staff_id: staffId,
        service_id: serviceId,
        appointment_date: appointmentDateTime.toISOString(),
        status: "confirmed",
      })

      if (appointmentError) throw appointmentError

      // Update request status
      const { error: requestError } = await supabase
        .from("appointment_requests")
        .update({ status: "approved" })
        .eq("id", requestId)

      if (requestError) throw requestError

      toast.success("Agendamento confirmado! O cliente receberá uma notificação.")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error approving request:", error)
      toast.error("Erro ao confirmar agendamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from("appointment_requests").update({ status: "rejected" }).eq("id", requestId)

      if (error) throw error

      toast.success("Solicitação rejeitada.")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error rejecting request:", error)
      toast.error("Erro ao rejeitar solicitação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex-1 bg-gold hover:bg-gold/90 text-black">
            <Check className="mr-2 h-4 w-4" />
            Aprovar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div>
              <Label className="mb-2 block">Selecione a Data</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < new Date()}
                className="rounded-lg border"
              />
            </div>
            <div>
              <Label className="mb-2 block">Selecione o Horário</Label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    size="sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={loading} className="flex-1 bg-gold hover:bg-gold/90 text-black">
              {loading ? "Confirmando..." : "Confirmar Agendamento"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        onClick={handleReject}
        disabled={loading}
        className="border-red-500/20 hover:bg-red-500/10 bg-transparent"
      >
        <X className="mr-2 h-4 w-4" />
        Rejeitar
      </Button>
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
