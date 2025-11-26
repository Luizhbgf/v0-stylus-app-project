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
import { ArrowLeft, Plus, X, Video, FileText, Radio, Users } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

interface Module {
  id: string
  title: string
  description: string
  contents: Content[]
}

interface Content {
  id: string
  title: string
  description: string
  contentType: "video" | "pdf" | "live" | "in_person" | "text"
  videoUrl?: string
  videoDuration?: number
  pdfUrl?: string
  textContent?: string
  livePlatform?: "youtube" | "custom"
  liveUrl?: string
  liveDate?: string
  liveDuration?: number
  inPersonLocation?: string
  inPersonDate?: string
  inPersonDuration?: number
  inPersonType?: "online" | "presencial"
  isFree?: boolean
}

export default function CriarCurso() {
  const [profile, setProfile] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [level, setLevel] = useState("iniciante")
  const [price, setPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [modules, setModules] = useState<Module[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
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

  const addModule = () => {
    const newModule: Module = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      contents: [],
    }
    setModules([...modules, newModule])
    setCurrentModuleIndex(modules.length)
  }

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updated = [...modules]
    updated[index] = { ...updated[index], [field]: value }
    setModules(updated)
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
    if (currentModuleIndex === index) setCurrentModuleIndex(null)
  }

  const addContent = (moduleIndex: number, contentType: Content["contentType"]) => {
    const newContent: Content = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      contentType,
      isFree: false,
    }
    const updated = [...modules]
    updated[moduleIndex].contents.push(newContent)
    setModules(updated)
  }

  const updateContent = (moduleIndex: number, contentIndex: number, field: keyof Content, value: any) => {
    const updated = [...modules]
    updated[moduleIndex].contents[contentIndex] = {
      ...updated[moduleIndex].contents[contentIndex],
      [field]: value,
    }
    setModules(updated)
  }

  const removeContent = (moduleIndex: number, contentIndex: number) => {
    const updated = [...modules]
    updated[moduleIndex].contents = updated[moduleIndex].contents.filter((_, i) => i !== contentIndex)
    setModules(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      if (modules.length === 0) {
        toast.error("Adicione pelo menos um módulo ao curso")
        setIsLoading(false)
        return
      }

      // Create course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          category,
          level,
          price: Number.parseFloat(price),
          duration: Number.parseInt(duration),
          thumbnail_url: thumbnailUrl || null,
          instructor: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (courseError) throw courseError

      // Create modules and contents
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const module = modules[moduleIndex]

        const { data: moduleData, error: moduleError } = await supabase
          .from("course_modules")
          .insert({
            course_id: course.id,
            title: module.title,
            description: module.description,
            order_index: moduleIndex,
          })
          .select()
          .single()

        if (moduleError) throw moduleError

        // Create contents
        for (let contentIndex = 0; contentIndex < module.contents.length; contentIndex++) {
          const content = module.contents[contentIndex]

          const contentData: any = {
            module_id: moduleData.id,
            title: content.title,
            description: content.description,
            content_type: content.contentType,
            is_free: content.isFree,
            order_index: contentIndex,
          }

          if (content.contentType === "video") {
            contentData.video_url = content.videoUrl
            contentData.video_duration = content.videoDuration
          } else if (content.contentType === "pdf") {
            contentData.pdf_url = content.pdfUrl
          } else if (content.contentType === "text") {
            contentData.text_content = content.textContent
          } else if (content.contentType === "live") {
            contentData.live_platform = content.livePlatform
            contentData.live_url = content.liveUrl
            contentData.live_date = content.liveDate
            contentData.live_duration = content.liveDuration
          } else if (content.contentType === "in_person") {
            contentData.in_person_location = content.inPersonLocation
            contentData.in_person_date = content.inPersonDate
            contentData.in_person_duration = content.inPersonDuration
            contentData.in_person_type = content.inPersonType
          }

          const { error: contentError } = await supabase.from("course_content").insert(contentData)

          if (contentError) throw contentError
        }
      }

      toast.success("Curso criado com sucesso!")
      router.push("/staff/cursos")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar curso")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="mb-6">
          <Link
            href="/staff/cursos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Cursos
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Criar Novo Curso</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure um curso completo com módulos e múltiplos métodos de ensino
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Título do Curso</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Técnicas Avançadas de Barbear"
                    className="border-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição completa do curso..."
                    className="border-primary/20 min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Barbear, Corte, Coloração"
                    className="border-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Nível</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
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
                  <Label htmlFor="duration">Duração Total (horas)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="10"
                    className="border-primary/20"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="thumbnailUrl">URL da Imagem do Curso</Label>
                  <Input
                    id="thumbnailUrl"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="border-primary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg md:text-xl">Módulos do Curso</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Organize o conteúdo em módulos</p>
                </div>
                <Button type="button" onClick={addModule} className="bg-primary hover:bg-primary/90 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Módulo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum módulo criado. Adicione módulos para organizar o conteúdo do curso.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="border-primary/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <Input
                              value={module.title}
                              onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                              placeholder={`Módulo ${moduleIndex + 1}: Título`}
                              className="border-primary/20 font-semibold"
                              required
                            />
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                              placeholder="Descrição do módulo..."
                              className="border-primary/20 min-h-[60px]"
                              rows={2}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModule(moduleIndex)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addContent(moduleIndex, "video")}
                              className="text-xs"
                            >
                              <Video className="h-3 w-3 mr-1" />
                              Vídeo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addContent(moduleIndex, "pdf")}
                              className="text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addContent(moduleIndex, "text")}
                              className="text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Texto
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addContent(moduleIndex, "live")}
                              className="text-xs"
                            >
                              <Radio className="h-3 w-3 mr-1" />
                              Ao Vivo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addContent(moduleIndex, "in_person")}
                              className="text-xs"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              Presencial
                            </Button>
                          </div>

                          {module.contents.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum conteúdo adicionado. Clique nos botões acima para adicionar.
                            </p>
                          ) : (
                            <div className="space-y-3 mt-4">
                              {module.contents.map((content, contentIndex) => (
                                <Card key={content.id} className="border-primary/5 bg-card/50">
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <Input
                                        value={content.title}
                                        onChange={(e) =>
                                          updateContent(moduleIndex, contentIndex, "title", e.target.value)
                                        }
                                        placeholder="Título do conteúdo"
                                        className="border-primary/20 text-sm"
                                        required
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeContent(moduleIndex, contentIndex)}
                                        className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <Textarea
                                      value={content.description}
                                      onChange={(e) =>
                                        updateContent(moduleIndex, contentIndex, "description", e.target.value)
                                      }
                                      placeholder="Descrição do conteúdo..."
                                      className="border-primary/20 text-sm min-h-[50px]"
                                      rows={2}
                                    />

                                    {content.contentType === "video" && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                          value={content.videoUrl || ""}
                                          onChange={(e) =>
                                            updateContent(moduleIndex, contentIndex, "videoUrl", e.target.value)
                                          }
                                          placeholder="URL do vídeo"
                                          className="border-primary/20 text-sm"
                                        />
                                        <Input
                                          type="number"
                                          value={content.videoDuration || ""}
                                          onChange={(e) =>
                                            updateContent(
                                              moduleIndex,
                                              contentIndex,
                                              "videoDuration",
                                              Number.parseInt(e.target.value),
                                            )
                                          }
                                          placeholder="Duração (minutos)"
                                          className="border-primary/20 text-sm"
                                        />
                                      </div>
                                    )}

                                    {content.contentType === "pdf" && (
                                      <Input
                                        value={content.pdfUrl || ""}
                                        onChange={(e) =>
                                          updateContent(moduleIndex, contentIndex, "pdfUrl", e.target.value)
                                        }
                                        placeholder="URL do PDF"
                                        className="border-primary/20 text-sm"
                                      />
                                    )}

                                    {content.contentType === "text" && (
                                      <Textarea
                                        value={content.textContent || ""}
                                        onChange={(e) =>
                                          updateContent(moduleIndex, contentIndex, "textContent", e.target.value)
                                        }
                                        placeholder="Conteúdo em texto..."
                                        className="border-primary/20 text-sm min-h-[100px]"
                                        rows={4}
                                      />
                                    )}

                                    {content.contentType === "live" && (
                                      <div className="space-y-3">
                                        <Select
                                          value={content.livePlatform || "youtube"}
                                          onValueChange={(value: "youtube" | "custom") =>
                                            updateContent(moduleIndex, contentIndex, "livePlatform", value)
                                          }
                                        >
                                          <SelectTrigger className="border-primary/20 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                            <SelectItem value="custom">Link Customizado</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          value={content.liveUrl || ""}
                                          onChange={(e) =>
                                            updateContent(moduleIndex, contentIndex, "liveUrl", e.target.value)
                                          }
                                          placeholder="URL da live"
                                          className="border-primary/20 text-sm"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <Input
                                            type="datetime-local"
                                            value={content.liveDate || ""}
                                            onChange={(e) =>
                                              updateContent(moduleIndex, contentIndex, "liveDate", e.target.value)
                                            }
                                            className="border-primary/20 text-sm"
                                          />
                                          <Input
                                            type="number"
                                            value={content.liveDuration || ""}
                                            onChange={(e) =>
                                              updateContent(
                                                moduleIndex,
                                                contentIndex,
                                                "liveDuration",
                                                Number.parseInt(e.target.value),
                                              )
                                            }
                                            placeholder="Duração (minutos)"
                                            className="border-primary/20 text-sm"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {content.contentType === "in_person" && (
                                      <div className="space-y-3">
                                        <Select
                                          value={content.inPersonType || "presencial"}
                                          onValueChange={(value: "online" | "presencial") =>
                                            updateContent(moduleIndex, contentIndex, "inPersonType", value)
                                          }
                                        >
                                          <SelectTrigger className="border-primary/20 text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="presencial">Presencial</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          value={content.inPersonLocation || ""}
                                          onChange={(e) =>
                                            updateContent(moduleIndex, contentIndex, "inPersonLocation", e.target.value)
                                          }
                                          placeholder="Local"
                                          className="border-primary/20 text-sm"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <Input
                                            type="datetime-local"
                                            value={content.inPersonDate || ""}
                                            onChange={(e) =>
                                              updateContent(moduleIndex, contentIndex, "inPersonDate", e.target.value)
                                            }
                                            className="border-primary/20 text-sm"
                                          />
                                          <Input
                                            type="number"
                                            value={content.inPersonDuration || ""}
                                            onChange={(e) =>
                                              updateContent(
                                                moduleIndex,
                                                contentIndex,
                                                "inPersonDuration",
                                                Number.parseInt(e.target.value),
                                              )
                                            }
                                            placeholder="Duração (minutos)"
                                            className="border-primary/20 text-sm"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`free-${content.id}`}
                                        checked={content.isFree}
                                        onCheckedChange={(checked) =>
                                          updateContent(moduleIndex, contentIndex, "isFree", checked)
                                        }
                                      />
                                      <label
                                        htmlFor={`free-${content.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        Conteúdo gratuito (preview)
                                      </label>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Curso"}
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
