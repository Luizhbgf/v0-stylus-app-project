"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PREDEFINED_SERVICES } from "@/lib/constants/services"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"

interface ServiceExtra {
  name: string
  description: string
  price: string
}

export default function AdicionarServico() {
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [category, setCategory] = useState("")
  const [extras, setExtras] = useState<ServiceExtra[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [selectedExistingService, setSelectedExistingService] = useState("")
  const [addMode, setAddMode] = useState<"existing" | "custom">("custom")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    loadAllServices()
  }, [])

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)
  }

  const loadAllServices = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: allServices } = await supabase.from("services").select("*").eq("is_active", true).order("name")

    const { data: staffServices } = await supabase.from("staff_services").select("service_id").eq("staff_id", user.id)

    const linkedServiceIds = new Set(staffServices?.map((ss) => ss.service_id) || [])
    const availableServices = allServices?.filter((s) => !linkedServiceIds.has(s.id)) || []

    setServices(availableServices)
  }

  const handleSelectExistingService = async (serviceId: string) => {
    const selectedService = services.find((s) => s.id === serviceId)
    if (selectedService) {
      setName(selectedService.name)
      setDescription(selectedService.description || "")
      setPrice(selectedService.price.toString())
      setDuration(selectedService.duration.toString())
      setCategory(selectedService.category || "")
      setSelectedExistingService(serviceId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      if (addMode === "existing" && selectedExistingService) {
        const { error: linkError } = await supabase.from("staff_services").insert({
          staff_id: user.id,
          service_id: selectedExistingService,
        })

        if (linkError) throw linkError

        toast.success("Serviço adicionado com sucesso!")
        router.push("/staff/servicos")
        return
      }

      const { data: existingService } = await supabase.from("services").select("*").ilike("name", name.trim()).single()

      if (existingService) {
        toast.error("Já existe um serviço com este nome. Escolha outro nome ou adicione o serviço existente.")
        setIsLoading(false)
        return
      }

      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .insert({
          name,
          description: description || null,
          price: Number.parseFloat(price),
          duration: Number.parseInt(duration),
          category: category || null,
          is_active: true,
        })
        .select()
        .single()

      if (serviceError) throw serviceError

      const { error: linkError } = await supabase.from("staff_services").insert({
        staff_id: user.id,
        service_id: serviceData.id,
      })

      if (linkError) throw linkError

      if (extras.length > 0) {
        const extrasToInsert = extras
          .filter((extra) => extra.name && extra.price)
          .map((extra) => ({
            service_id: serviceData.id,
            name: extra.name,
            description: extra.description || null,
            price: Number.parseFloat(extra.price),
            is_active: true,
          }))

        if (extrasToInsert.length > 0) {
          const { error: extrasError } = await supabase.from("service_extras").insert(extrasToInsert)
          if (extrasError) throw extrasError
        }
      }

      toast.success("Serviço criado com sucesso!")
      router.push("/staff/servicos")
    } catch (error: any) {
      console.error("Erro ao criar serviço:", error)
      toast.error(error.message || "Erro ao criar serviço")
    } finally {
      setIsLoading(false)
    }
  }

  const addExtra = () => {
    setExtras([...extras, { name: "", description: "", price: "" }])
  }

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index))
  }

  const updateExtra = (index: number, field: keyof ServiceExtra, value: string) => {
    const newExtras = [...extras]
    newExtras[index][field] = value
    setExtras(newExtras)
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/staff/servicos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Serviços
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Adicionar Serviço</h1>
          <p className="text-sm md:text-base text-muted-foreground">Crie um novo serviço</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Novo Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-gold/20">
              <Label className="text-base mb-3 block">Como deseja adicionar o serviço?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={addMode === "existing" ? "default" : "outline"}
                  onClick={() => setAddMode("existing")}
                  className={addMode === "existing" ? "bg-gold text-black" : ""}
                >
                  Adicionar Serviço Existente
                </Button>
                <Button
                  type="button"
                  variant={addMode === "custom" ? "default" : "outline"}
                  onClick={() => setAddMode("custom")}
                  className={addMode === "custom" ? "bg-gold text-black" : ""}
                >
                  Criar Serviço Personalizado
                </Button>
              </div>
            </div>

            {addMode === "existing" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="existing-service">Selecione um Serviço *</Label>
                  <Select value={selectedExistingService} onValueChange={handleSelectExistingService} required>
                    <SelectTrigger className="border-gold/20">
                      <SelectValue placeholder="Escolha um serviço para adicionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {services.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Todos os serviços disponíveis já foram adicionados à sua lista.
                    </p>
                  )}
                </div>

                {selectedExistingService && (
                  <div className="p-4 bg-muted/20 rounded-lg border border-gold/10">
                    <h3 className="font-semibold mb-2">Detalhes do Serviço</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Nome:</span> {name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Preço:</span> R$ {price}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Duração:</span> {duration} minutos
                      </p>
                      {category && (
                        <p>
                          <span className="text-muted-foreground">Categoria:</span> {category}
                        </p>
                      )}
                      {description && (
                        <p>
                          <span className="text-muted-foreground">Descrição:</span> {description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-gold hover:bg-gold/90 text-black"
                  disabled={isLoading || !selectedExistingService}
                >
                  {isLoading ? "Adicionando..." : "Adicionar Serviço"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    list="services-list"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Selecione ou digite um serviço customizado"
                    className="border-primary/20"
                    required
                  />
                  <datalist id="services-list">
                    {PREDEFINED_SERVICES.map((service) => (
                      <option key={service} value={service} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">Selecione da lista ou digite um serviço personalizado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do serviço..."
                    className="border-primary/20 min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Cabelo, Barba, Estética"
                    className="border-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="border-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (min) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="30"
                      className="border-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Adicionais (Opcionais)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addExtra}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Extra
                    </Button>
                  </div>

                  {extras.map((extra, index) => (
                    <Card key={index} className="border-primary/10">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Adicional {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExtra(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`extra-name-${index}`}>Nome do Adicional *</Label>
                          <Input
                            id={`extra-name-${index}`}
                            value={extra.name}
                            onChange={(e) => updateExtra(index, "name", e.target.value)}
                            placeholder="Ex: Desenho, Barba, Sobrancelha"
                            className="border-primary/20"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`extra-description-${index}`}>Descrição</Label>
                          <Input
                            id={`extra-description-${index}`}
                            value={extra.description}
                            onChange={(e) => updateExtra(index, "description", e.target.value)}
                            placeholder="Descrição do adicional"
                            className="border-primary/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`extra-price-${index}`}>Preço (R$) *</Label>
                          <Input
                            id={`extra-price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={extra.price}
                            onChange={(e) => updateExtra(index, "price", e.target.value)}
                            placeholder="0.00"
                            className="border-primary/20"
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-black"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando..." : "Criar Serviço"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
