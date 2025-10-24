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
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Plus, X, Check } from "lucide-react"
import Link from "next/link"

interface Feature {
  id: string
  text: string
  included: boolean
}

interface StaffMember {
  id: string
  full_name: string
  avatar_url: string | null
}

export default function AdminCriarAssinatura() {
  const [profile, setProfile] = useState<any>(null)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [terms, setTerms] = useState("")
  const [observations, setObservations] = useState("")
  const [features, setFeatures] = useState<Feature[]>([])
  const [newFeatureText, setNewFeatureText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
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

    const { data: staff } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .gte("user_level", 20)
      .order("full_name")

    if (staff) setStaffMembers(staff)
    // </CHANGE>
  }

  const addFeature = () => {
    if (!newFeatureText.trim()) return

    const newFeature: Feature = {
      id: crypto.randomUUID(),
      text: newFeatureText.trim(),
      included: true,
    }

    setFeatures([...features, newFeature])
    setNewFeatureText("")
  }

  const removeFeature = (id: string) => {
    setFeatures(features.filter((f) => f.id !== id))
  }

  const toggleFeatureIncluded = (id: string) => {
    setFeatures(features.map((f) => (f.id === id ? { ...f, included: !f.included } : f)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      if (!selectedStaffId) {
        toast.error("Selecione um profissional")
        setIsLoading(false)
        return
      }

      if (features.length === 0) {
        toast.error("Adicione pelo menos um recurso ao plano")
        setIsLoading(false)
        return
      }

      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .insert({
          staff_id: selectedStaffId,
          name,
          description,
          price: Number.parseFloat(price),
          terms: terms || null,
          observations: observations || null,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single()

      if (planError) throw planError

      // Insert features
      const featuresToInsert = features.map((feature, index) => ({
        plan_id: plan.id,
        feature_text: feature.text,
        is_included: feature.included,
        display_order: index,
      }))

      const { error: featuresError } = await supabase.from("subscription_plan_features").insert(featuresToInsert)

      if (featuresError) throw featuresError
      // </CHANGE>

      toast.success("Plano de assinatura criado com sucesso!")
      router.push("/admin/assinaturas")
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

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <div className="mb-6">
          <Link
            href="/admin/assinaturas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Assinaturas
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Criar Plano de Assinatura</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure um novo plano mensal para um profissional
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Selecionar Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="staff">Profissional *</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId} required>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Este plano será associado ao profissional selecionado</p>
              </div>
            </CardContent>
          </Card>
          {/* </CHANGE> */}

          {/* Basic information */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Barba Ilimitada, Cabelo e Barba Ilimitados"
                  className="border-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição Curta *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição do plano..."
                  className="border-primary/20 min-h-[80px]"
                  rows={3}
                  required
                />
              </div>

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
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Recursos do Plano</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione os recursos e marque se estão incluídos (✓) ou não incluídos (❌)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Ex: Corte o cabelo quantas vezes quiser"
                  className="border-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                />
                <Button type="button" onClick={addFeature} className="bg-primary hover:bg-primary/90 text-black">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {features.length > 0 && (
                <div className="space-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-card/50 transition-all hover:border-primary/40"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFeatureIncluded(feature.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          feature.included
                            ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        }`}
                      >
                        {feature.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                      <span className={`flex-1 text-sm ${!feature.included && "line-through opacity-60"}`}>
                        {feature.text}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {features.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum recurso adicionado. Adicione recursos para o plano.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Terms and observations */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Termos e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
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
      </div>
    </div>
  )
}
