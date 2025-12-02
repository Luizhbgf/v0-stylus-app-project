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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function CriarServicoAdmin() {
  const [profile, setProfile] = useState<any>(null)
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [category, setCategory] = useState("")
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

    if (!profileData || profileData.user_level < 30) {
      router.push("/cliente")
      return
    }

    setProfile(profileData)

    // Load staff members
    const { data: staffData } = await supabase.from("profiles").select("*").gte("user_level", 20).order("full_name")
    setStaffMembers(staffData || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!selectedStaff) {
        throw new Error("Selecione um profissional")
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
        staff_id: selectedStaff,
        service_id: serviceData.id,
      })

      if (linkError) throw linkError

      toast.success("Serviço criado com sucesso!")
      router.push("/admin/servicos")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error creating service:", error)
      toast.error(error.message || "Erro ao criar serviço")
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
            href="/admin/servicos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Serviços
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Criar Novo Serviço</h1>
          <p className="text-sm md:text-base text-muted-foreground">Adicione um novo serviço ao sistema</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="staff">Profissional Responsável *</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff} required>
                  <SelectTrigger className="border-gold/20">
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  list="services-list"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Masculino, Barba, Tintura"
                  className="border-gold/20"
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
                  placeholder="Descreva o serviço oferecido..."
                  className="border-gold/20 min-h-[100px]"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Cabelo, Barba, Estética, Químicas"
                  className="border-gold/20"
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
                    className="border-gold/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    className="border-gold/20"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Serviço"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="sm:w-auto border-gold/20"
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
