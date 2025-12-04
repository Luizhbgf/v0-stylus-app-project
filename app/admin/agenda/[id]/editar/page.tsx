"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, DollarSign, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

export const dynamic = "force-dynamic"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
  category: string
}

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointment, setAppointment] = useState<any>(null)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [clientId, setClientId] = useState("")
  const [staffId, setStaffId] = useState("")
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({})
  const [clients, setClients] = useState<Profile[]>([])
  const [staff, setStaff] = useState<Profile[]>([])
  const [services, setServices] = useState<Service[]>([])

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

      // Load appointment
      const { data: aptData } = await supabase.from("appointments").select("*").eq("id", params.id).single()

      if (aptData) {
        setAppointment(aptData)
        setDate(aptData.appointment_date.split("T")[0])
        setTime(aptData.appointment_date.split("T")[1].substring(0, 5))
        setClientId(aptData.client_id || "")
        setStaffId(aptData.staff_id)

        // Handle multi-service
        if (aptData.service_ids && Array.isArray(aptData.service_ids)) {
          setSelectedServiceIds(aptData.service_ids)
          setServicePrices(aptData.service_prices || {})
        } else if (aptData.service_id) {
          // Legacy single service
          setSelectedServiceIds([aptData.service_id])
        }
      }

      // Load clients
      const { data: clientsData } = await supabase.from("profiles").select("*").eq("user_level", 10).order("full_name")

      setClients(clientsData || [])

      // Load staff
      const { data: staffData } = await supabase.from("profiles").select("*").gte("user_level", 20).order("full_name")

      setStaff(staffData || [])

      // Load services
      const { data: servicesData } = await supabase.from("services").select("*").order("name")

      setServices(servicesData || [])
      setLoading(false)
    }

    loadData()
  }, [params.id, router, supabase])

  function toggleService(serviceId: string, price: number) {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId))
      const newPrices = { ...servicePrices }
      delete newPrices[serviceId]
      setServicePrices(newPrices)
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId])
      setServicePrices({ ...servicePrices, [serviceId]: price })
    }
  }

  function updateServicePrice(serviceId: string, newPrice: number) {
    setServicePrices({ ...servicePrices, [serviceId]: newPrice })
  }

  async function handleSave() {
    if (!date || !time || !staffId || selectedServiceIds.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const totalDuration = selectedServiceIds.reduce((sum, id) => {
      const service = services.find((s) => s.id === id)
      return sum + (service?.duration_minutes || 0)
    }, 0)

    const totalPrice = Object.values(servicePrices).reduce((sum, price) => sum + price, 0)

    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: `${date}T${time}:00`,
        client_id: clientId || null,
        staff_id: staffId,
        service_ids: selectedServiceIds,
        service_prices: servicePrices,
        duration_minutes: totalDuration,
        custom_price: totalPrice,
      })
      .eq("id", params.id)

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Sucesso",
      description: "Agendamento atualizado com sucesso",
    })

    router.push(`/admin/agenda/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={profile} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const totalDuration = selectedServiceIds.reduce((sum, id) => {
    const service = services.find((s) => s.id === id)
    return sum + (service?.duration_minutes || 0)
  }, 0)

  const totalPrice = Object.values(servicePrices).reduce((sum, price) => sum + price, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Editar Agendamento</h1>
          <p className="text-muted-foreground">Modifique os dados do agendamento</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-foreground">Informações do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Data <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 border-gold/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Horário <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10 border-gold/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Cliente</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="border-gold/20">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Profissional <span className="text-red-500">*</span>
              </label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="border-gold/20">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Serviços <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-muted-foreground mb-3">Selecione um ou mais serviços para este agendamento</p>

              <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-card/50 rounded-lg border border-gold/20">
                {services.map((service) => (
                  <div key={service.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={service.id}
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id, service.price)}
                        className="mt-1"
                      />
                      <label htmlFor={service.id} className="flex-1 cursor-pointer">
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {service.price.toFixed(2)} • {service.duration_minutes} min • {service.category}
                        </p>
                      </label>
                    </div>

                    {selectedServiceIds.includes(service.id) && (
                      <div className="ml-8 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gold" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={servicePrices[service.id] || service.price}
                          onChange={(e) => updateServicePrice(service.id, Number.parseFloat(e.target.value) || 0)}
                          className="w-32 border-gold/20"
                          placeholder="Preço"
                        />
                        <span className="text-sm text-muted-foreground">Ajustar preço</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedServiceIds.length > 0 && (
                <div className="mt-4 p-4 bg-gold/10 rounded-lg border border-gold/20">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedServiceIds.length} serviço(s) selecionado(s)
                  </p>
                  <p className="text-2xl font-bold text-gold">Total: R$ {totalPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Duração: {totalDuration} min</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-gold hover:bg-gold/90">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="border-gold/20">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
