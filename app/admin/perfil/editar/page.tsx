"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Upload, Camera } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EditarPerfilAdmin() {
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  // </CHANGE>
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
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
    if (profileData) {
      setProfile(profileData)
      setFullName(profileData.full_name || "")
      setPhone(profileData.phone || "")
      setPhotoUrl(profileData.photo_url || "")
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setPhotoUrl(data.url)
      toast.success("Foto carregada com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao fazer upload:", error)
      toast.error("Erro ao fazer upload da foto")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error("Digite um novo email")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: "https://v0-stylus-app-project.vercel.app/admin/perfil" },
      )

      if (error) throw error

      toast.success("Email de verificação enviado! Verifique sua caixa de entrada.")
      setShowEmailVerification(false)
      setNewEmail("")
    } catch (error) {
      console.error("[v0] Erro ao alterar email:", error)
      toast.error("Erro ao alterar email")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = async () => {
    if (!newPhone) {
      toast.error("Digite um novo telefone")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        phone: newPhone,
      })

      if (error) throw error

      toast.success("Código de verificação enviado via SMS!")
      setShowPhoneVerification(false)
      setNewPhone("")
    } catch (error) {
      console.error("[v0] Erro ao alterar telefone:", error)
      toast.error("Erro ao alterar telefone")
    } finally {
      setIsLoading(false)
    }
  }
  // </CHANGE>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          photo_url: photoUrl,
        })
        .eq("id", user.id)

      if (error) throw error

      toast.success("Perfil atualizado com sucesso!")
      router.push("/admin/perfil")
    } catch (error) {
      console.error("[v0] Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil")
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
            href="/admin/perfil"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Perfil
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Editar Perfil</h1>
          <p className="text-muted-foreground">Atualize suas informações administrativas</p>
        </div>

        <Card className="border-gold/20 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle>Informações do Administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
                    {photoUrl ? (
                      <Image
                        src={photoUrl || "/placeholder.svg"}
                        alt="Foto de perfil"
                        width={96}
                        height={96}
                        className="object-cover"
                      />
                    ) : (
                      <Camera className="h-10 w-10 text-gold" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={isUploadingPhoto}
                    />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={isUploadingPhoto} asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploadingPhoto ? "Enviando..." : "Alterar Foto"}
                        </span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">Máximo 5MB</p>
                  </div>
                </div>
              </div>
              {/* </CHANGE> */}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input id="email" value={profile.email} disabled className="border-gold/20 bg-muted flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailVerification(!showEmailVerification)}
                  >
                    Alterar
                  </Button>
                </div>
                {showEmailVerification && (
                  <div className="space-y-2 p-4 border border-gold/20 rounded-lg bg-card/50">
                    <Label htmlFor="newEmail">Novo Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="novo@email.com"
                      className="border-gold/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Um email de verificação será enviado para o novo endereço
                    </p>
                    <Button
                      type="button"
                      onClick={handleEmailChange}
                      className="w-full bg-gold hover:bg-gold/90 text-black"
                      disabled={isLoading}
                    >
                      Enviar Verificação
                    </Button>
                  </div>
                )}
              </div>
              {/* </CHANGE> */}

              <div className="space-y-2">
                <Label htmlFor="userLevel">Nível de Acesso</Label>
                <Input
                  id="userLevel"
                  value={`Nível ${profile.user_level} - ${profile.user_level >= 40 ? "Super Admin" : "Admin"}`}
                  disabled
                  className="border-gold/20 bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="border-gold/20 transition-all focus:border-gold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="border-gold/20 transition-all focus:border-gold flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPhoneVerification(!showPhoneVerification)}
                  >
                    Verificar
                  </Button>
                </div>
                {showPhoneVerification && (
                  <div className="space-y-2 p-4 border border-gold/20 rounded-lg bg-card/50">
                    <Label htmlFor="newPhone">Novo Telefone</Label>
                    <Input
                      id="newPhone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="border-gold/20"
                    />
                    <p className="text-xs text-muted-foreground">Um código de verificação será enviado via SMS</p>
                    <Button
                      type="button"
                      onClick={handlePhoneChange}
                      className="w-full bg-gold hover:bg-gold/90 text-black"
                      disabled={isLoading}
                    >
                      Enviar Código
                    </Button>
                  </div>
                )}
              </div>
              {/* </CHANGE> */}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gold hover:bg-gold/90 text-black transition-all hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="transition-all hover:scale-105"
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
