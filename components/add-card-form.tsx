"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function AddCardForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardHolderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    isDefault: false,
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

      // Extract card brand from number (simplified)
      const cardBrand = formData.cardNumber.startsWith("4")
        ? "visa"
        : formData.cardNumber.startsWith("5")
          ? "mastercard"
          : "other"

      // Get last 4 digits
      const cardLastFour = formData.cardNumber.slice(-4)

      const { error } = await supabase.from("payment_methods").insert({
        client_id: user.id,
        card_holder_name: formData.cardHolderName,
        card_last_four: cardLastFour,
        card_brand: cardBrand,
        expiry_month: Number.parseInt(formData.expiryMonth),
        expiry_year: Number.parseInt(formData.expiryYear),
        is_default: formData.isDefault,
      })

      if (error) throw error

      toast.success("Cartão adicionado com sucesso!")
      router.push("/cliente/assinaturas")
      router.refresh()
    } catch (error) {
      console.error("Error adding card:", error)
      toast.error("Erro ao adicionar cartão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cardHolderName">Nome no Cartão</Label>
        <Input
          id="cardHolderName"
          value={formData.cardHolderName}
          onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
          placeholder="NOME COMPLETO"
          required
          className="bg-background border-gold/20"
        />
      </div>

      <div>
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <Input
          id="cardNumber"
          value={formData.cardNumber}
          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\s/g, "") })}
          placeholder="0000 0000 0000 0000"
          maxLength={16}
          required
          className="bg-background border-gold/20"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expiryMonth">Mês</Label>
          <Input
            id="expiryMonth"
            value={formData.expiryMonth}
            onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
            placeholder="MM"
            maxLength={2}
            required
            className="bg-background border-gold/20"
          />
        </div>
        <div>
          <Label htmlFor="expiryYear">Ano</Label>
          <Input
            id="expiryYear"
            value={formData.expiryYear}
            onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
            placeholder="AAAA"
            maxLength={4}
            required
            className="bg-background border-gold/20"
          />
        </div>
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            value={formData.cvv}
            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
            placeholder="123"
            maxLength={4}
            required
            className="bg-background border-gold/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="rounded border-gold/20"
        />
        <Label htmlFor="isDefault" className="cursor-pointer">
          Definir como cartão padrão
        </Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold/90 text-black">
        {loading ? "Adicionando..." : "Adicionar Cartão"}
      </Button>
    </form>
  )
}
