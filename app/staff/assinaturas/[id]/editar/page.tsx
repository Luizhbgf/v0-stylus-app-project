"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { useRouter, useParams } from 'next/navigation'
import { toast } from "sonner"
import { ArrowLeft, X, Check } from 'lucide-react'
import Link from "next/link"

export default function EditSubscriptionPlanPage() {
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [billingFrequency, setBillingFrequency] = useState("monthly")
  const [serviceFrequency, setServiceFrequency] = useState("monthly")
  const [servicesPerPeriod, setServicesPerPeriod] = useState("1")
  const [serviceType, setServiceType] = useState("")
  const [includedServices, setIncludedServices] = useState<string[]>([])
  const [currentService, setCurrentService] = useState("")
  const [terms, setTerms] = useState("")
  const [notes, setNotes] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", params.id)
      .eq("staff_id", user.id)
      .single()

    if (plan) {
      setName(plan.name)
      setDescription(plan.description || "")
      setPrice(plan.price.toString())
      setBillingFrequency(plan.billing_frequency || "monthly")
      setServiceFrequency(plan.service_frequency || "monthly")
      setServicesPerPeriod(plan.services_per_period?.toString() || "1")
      setServiceType(plan.service_type || "")
      setIncludedServices(plan.included_services || [])
      setTerms(plan.terms || "")
      setNotes(plan.notes || "")
      setIsActive(plan.is_active)
    }
  }

  const addService = () => {
    if (currentService.trim() && !includedServices.includes(currentService.trim())) {
      setIncludedServices([...includedServices, currentService.trim()])
      setCurrentService("")
    }
  }

  const removeService = (service: string) => {
    setIncludedServices(includedServices.filter((s) => s !== service))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name,
          description,
          price: parseFloat(price),
          billing_frequency: billingFrequency,
          service_frequency: serviceFrequency,
          services_per_period: parseInt(servicesPerPeriod),
          service_type: serviceType || null,
          included_services: includedServices,
          terms,
          notes,
          is_active: isActive,
        })
        .eq("id", params.id)
        .eq("staff_id", user.id)

      if (error) throw error

      toast.success("Plano atualizado com sucesso!")
      router.push(`/staff/assinaturas/${params.id}`)
    } catch (error) {
      console.error("[v0] Erro ao atualizar plano:", error)
      toast.error("Erro ao atualizar plano de assinatura")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href={`/staff/assinaturas/${params.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Visualização
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Editar Plano de Assinatura</h1>
          <p className="text-muted-foreground">Atualize as informações do seu plano</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Informações do Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte o cabelo quantas vezes quiser"
                  className="border-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que está incluído no plano..."
                  className="border-primary/20"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Mensal *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="border-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingFrequency">Periodicidade da Cobrança *</Label>
                  <Select value={billingFrequency} onValueChange={setBillingFrequency}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceFrequency">Frequência dos Cortes *</Label>
                  <Select value={serviceFrequency} onValueChange={setServiceFrequency}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servicesPerPeriod">Quantidade de Cortes *</Label>
                  <Input
                    id="servicesPerPeriod"
                    type="number"
                    min="1"
                    value={servicesPerPeriod}
                    onChange={(e) => setServicesPerPeriod(e.target.value)}
                    placeholder="1"
                    className="border-primary/20"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Cortes permitidos por período</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Serviço (opcional)</Label>
                <Input
                  id="serviceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Ex: Corte masculino, Barba, etc."
                  className="border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label>Serviços Incluídos (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentService}
                    onChange={(e) => setCurrentService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addService()
                      }
                    }}
                    placeholder="Digite um serviço e pressione Enter"
                    className="border-primary/20 flex-1"
                  />
                  <Button type="button" onClick={addService} variant="outline">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
                {includedServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {includedServices.map((service, index) => (
                      <div key={index} className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                        <Check className="h-3 w-3 text-primary" />
                        <span className="text-sm">{service}</span>
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Termos de Responsabilidade</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Termos e condições do plano..."
                  className="border-primary/20"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Estes termos serão apresentados ao cliente no momento da assinatura
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionais sobre o plano..."
                  className="border-primary/20"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Status do Plano</Label>
                <Select value={isActive.toString()} onValueChange={(value) => setIsActive(value === "true")}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo (Aceita novos assinantes)</SelectItem>
                    <SelectItem value="false">Inativo (Não aceita novos assinantes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-black"
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
