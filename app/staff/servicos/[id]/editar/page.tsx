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
import { Switch } from "@/components/ui/switch"

export default function EditarServicoPage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [category, setCategory] = useState("")
  const [isActive, setIsActive] = useState(true)
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

    const { data: serviceData } = await supabase.from("services").select("*").eq("id", params.id).single()

    if (serviceData) {
      setService(serviceData)
      setName(serviceData.name)
      setDescription(serviceData.description || "")
      setPrice(serviceData.price.toString())
      setDuration(serviceData.duration.toString())
      setCategory(serviceData.category || "")
      setIsActive(serviceData.is_active)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("services")
        .update({
          name,
          description,
          price: Number.parseFloat(price),
          duration: Number.parseInt(duration),
          category,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Serviço atualizado com sucesso!")
      router.push(`/staff/servicos/${params.id}`)
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error)
      toast.error("Erro ao atualizar serviço")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !service) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href={`/staff/servicos/${params.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Detalhes
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Editar Serviço</h1>
          <p className="text-muted-foreground">Atualize as informações do serviço</p>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte de Cabelo"
                  className="border-gold/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do serviço..."
                  className="border-gold/20 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Cabelo, Barba, Estética"
                  className="border-gold/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="border-gold/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    className="border-gold/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gold/5 rounded-lg border border-gold/20">
                <div>
                  <Label htmlFor="is-active" className="text-base">
                    Serviço Ativo
                  </Label>
                  <p className="text-sm text-muted-foreground">Disponível para agendamento</p>
                </div>
                <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
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
