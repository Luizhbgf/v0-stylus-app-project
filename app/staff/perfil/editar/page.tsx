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
import { ArrowLeft, Upload, Camera, X, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

type WorkingHours = {
  [key: string]: {
    enabled: boolean
    start: string
    end: string
  }
}

export default function EditarPerfilStaff() {
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [workStartTime, setWorkStartTime] = useState("09:00")
  const [workEndTime, setWorkEndTime] = useState("18:00")
  const [staffStatus, setStaffStatus] = useState("active")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { enabled: true, start: "09:00", end: "18:00" },
    tuesday: { enabled: true, start: "09:00", end: "18:00" },
    wednesday: { enabled: true, start: "09:00", end: "18:00" },
    thursday: { enabled: true, start: "09:00", end: "18:00" },
    friday: { enabled: true, start: "09:00", end: "18:00" },
    saturday: { enabled: true, start: "09:00", end: "14:00" },
    sunday: { enabled: false, start: "09:00", end: "18:00" },
  })

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
      setBio(profileData.bio || "")
      setSpecialties(profileData.specialties?.join(", ") || "")
      setPhotoUrl(profileData.avatar_url || "")
      setPortfolioImages(profileData.portfolio_images || [])
      setWorkStartTime(profileData.work_start_time || "09:00")
      setWorkEndTime(profileData.work_end_time || "18:00")
      setStaffStatus(profileData.staff_status || "active")
      if (profileData.working_hours) {
        setWorkingHours(profileData.working_hours)
      }
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

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPortfolio(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setPortfolioImages([...portfolioImages, data.url])
      toast.success("Imagem adicionada ao portfolio!")
    } catch (error) {
      console.error("[v0] Erro ao fazer upload:", error)
      toast.error("Erro ao fazer upload da imagem")
    } finally {
      setIsUploadingPortfolio(false)
    }
  }

  const removePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const specialtiesArray = specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          bio,
          specialties: specialtiesArray,
          avatar_url: photoUrl,
          portfolio_images: portfolioImages,
          work_start_time: workStartTime,
          work_end_time: workEndTime,
          staff_status: staffStatus,
          working_hours: workingHours, // Salvando horários detalhados
        })
        .eq("id", user.id)

      if (error) throw error

      toast.success("Perfil atualizado com sucesso!")
      router.push("/staff/perfil")
    } catch (error) {
      console.error("[v0] Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil")
    } finally {
      setIsLoading(false)
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
        { emailRedirectTo: "https://v0-stylus-app-project.vercel.app/staff/perfil" },
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { error } = await supabase.from("profiles").update({ phone: newPhone }).eq("id", user.id)

      if (error) throw error

      setPhone(newPhone)
      toast.success("Telefone atualizado com sucesso!")
      setShowPhoneVerification(false)
      setNewPhone("")
    } catch (error) {
      console.error("[v0] Erro ao alterar telefone:", error)
      toast.error("Erro ao alterar telefone")
    } finally {
      setIsLoading(false)
    }
  }

  const dayNames: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/staff/perfil"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Perfil
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Editar Perfil</h1>
          <p className="text-muted-foreground">Personalize seu perfil profissional</p>
        </div>

        <Card className="border-gold/20 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
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

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    className="border-gold/20 transition-all focus:border-gold"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties">Especialidades</Label>
                  <Input
                    id="specialties"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="Corte masculino, Barba, Coloração (separado por vírgula)"
                    className="border-gold/20 transition-all focus:border-gold"
                  />
                  <p className="text-xs text-muted-foreground">Separe as especialidades por vírgula</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffStatus">Status *</Label>
                  <Select value={staffStatus} onValueChange={setStaffStatus}>
                    <SelectTrigger className="border-gold/20 transition-all focus:border-gold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="vacation">De Férias</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horários de Trabalho
                  </Label>
                  <div className="space-y-3 p-4 border border-gold/20 rounded-lg">
                    {Object.entries(workingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Checkbox
                            id={`day-${day}`}
                            checked={hours.enabled}
                            onCheckedChange={(checked) => {
                              setWorkingHours({
                                ...workingHours,
                                [day]: { ...hours, enabled: !!checked },
                              })
                            }}
                          />
                          <Label htmlFor={`day-${day}`} className="cursor-pointer text-sm">
                            {dayNames[day]}
                          </Label>
                        </div>
                        {hours.enabled ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={hours.start}
                              onChange={(e) => {
                                setWorkingHours({
                                  ...workingHours,
                                  [day]: { ...hours, start: e.target.value },
                                })
                              }}
                              className="border-gold/20"
                            />
                            <span className="text-muted-foreground">até</span>
                            <Input
                              type="time"
                              value={hours.end}
                              onChange={(e) => {
                                setWorkingHours({
                                  ...workingHours,
                                  [day]: { ...hours, end: e.target.value },
                                })
                              }}
                              className="border-gold/20"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marque os dias em que você trabalha e defina os horários de início e término
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Portfolio</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {portfolioImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`Portfolio ${index + 1}`}
                          width={150}
                          height={150}
                          className="rounded-lg object-cover w-full h-32 transition-transform group-hover:scale-105"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePortfolioImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePortfolioUpload}
                      className="hidden"
                      id="portfolio-upload"
                      disabled={isUploadingPortfolio}
                    />
                    <Label htmlFor="portfolio-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full transition-all hover:border-gold bg-transparent"
                        disabled={isUploadingPortfolio}
                        asChild
                      >
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploadingPortfolio ? "Enviando..." : "Adicionar Imagem ao Portfolio"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
