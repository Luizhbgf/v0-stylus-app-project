"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function CreatePlanForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    serviceType: "haircut",
    frequencyPerWeek: "1",
    price: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Usuário não autenticado")
        return
      }

      const { error } = await supabase.from("subscription_plans").insert({
        staff_id: user.id,
        name: formData.name,
        description: formData.description,
        service_type: formData.serviceType,
        frequency_per_week: Number.parseInt(formData.frequencyPerWeek),
        price: Number.parseFloat(formData.price),
        created_by: user.id,
        is_active: true,
      })

      if (error) throw error

      toast.success("Plano criado com sucesso!")
      router.push("/staff/assinaturas")
      router.refresh()
    } catch (error) {
      console.error("Error creating plan:", error)
      toast.error("Erro ao criar plano")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do Plano</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Plano Premium"
          required
          className="bg-background border-gold/20"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva os benefícios do plano"
          className="bg-background border-gold/20"
        />
      </div>

      <div>
        <Label>Tipo de Serviço</Label>
        <RadioGroup
          value={formData.serviceType}
          onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="haircut" id="haircut" />
            <Label htmlFor="haircut" className="cursor-pointer">
              Corte
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="haircut_beard" id="haircut_beard" />
            <Label htmlFor="haircut_beard" className="cursor-pointer">
              Corte + Barba
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>Frequência por Semana</Label>
        <RadioGroup
          value={formData.frequencyPerWeek}
          onValueChange={(value) => setFormData({ ...formData, frequencyPerWeek: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="freq1" />
            <Label htmlFor="freq1" className="cursor-pointer">
              1x por semana
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="freq2" />
            <Label htmlFor="freq2" className="cursor-pointer">
              2x por semana
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="price">Preço Mensal (R$)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="100.00"
          required
          className="bg-background border-gold/20"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold/90 text-black">
        {loading ? "Criando..." : "Criar Plano"}
      </Button>
    </form>
  )
}
