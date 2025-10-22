"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CriarAssinatura() {
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [price, setPrice] = useState("")
  const [frequencyPerWeek, setFrequencyPerWeek] = useState("")
  const [terms, setTerms] = useState("")
  const [observations, setObservations] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase.from("subscription_plans").insert({
        staff_id: user.id,
        name,
        description,
        service_type: serviceType,
        price: Number.parseFloat(price),
        frequency_per_week: Number.parseInt(frequencyPerWeek),
        terms: terms || null,
        observations: observations || null,
        is_active: true,
        created_by: user.id,
      })

      if (error) throw error

      toast.success("Plano de assinatura criado com sucesso!")
      router.push("/staff/assinaturas")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar plano")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/staff/assinaturas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Assinaturas
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Criar Plano de Assinatura</h1>
          <p className="text-sm md:text-base text-muted-foreground">Configure um novo plano mensal</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Novo Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Plano Mensal Premium"
                  className="border-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que está incluído no plano..."
                  className="border-primary/20 min-h-[100px]"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Serviço *</Label>
                <Input
                  id="serviceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Ex: Corte de Cabelo, Barba, Estética"
                  className="border-primary/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Mensal (R$) *</Label>
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
                  <Label htmlFor="frequency">Frequência/Semana *</Label>
                  <Input
                    id="frequency"
                    type="number"
                    min="1"
                    max="7"
                    value={frequencyPerWeek}
                    onChange={(e) => setFrequencyPerWeek(e.target.value)}
                    placeholder="Ex: 2"
                    className="border-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Termos de Responsabilidade</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Termos e condições do plano..."
                  className="border-primary/20 min-h-[120px]"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Estes termos serão apresentados ao cliente no momento da assinatura
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações adicionais sobre o plano..."
                  className="border-primary/20 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Plano"}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
