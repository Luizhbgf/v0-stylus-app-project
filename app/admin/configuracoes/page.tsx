"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Home, Star, Briefcase, Save, Eye, Loader2, Palette, ImageIcon, Globe, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminConfiguracoes() {
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_image_url: "",
    logo_url: "",
    favicon_url: "",
    cta_title: "",
    cta_subtitle: "",
    business_name: "",
    business_phone: "",
    business_email: "",
    business_hours: "",
    primary_color_light: "oklch(0.55 0.15 75)",
    primary_color_dark: "oklch(0.55 0.15 75)",
    background_color_light: "oklch(0.97 0.01 85)",
    background_color_dark: "oklch(0.24 0.04 175)",
    card_color_light: "oklch(0.98 0.01 85)",
    card_color_dark: "oklch(0.26 0.04 175)",
    text_color_light: "oklch(0.2 0 0)",
    text_color_dark: "oklch(0.95 0 0)",
    accent_color_light: "oklch(0.55 0.15 75)",
    accent_color_dark: "oklch(0.55 0.15 75)",
    border_radius: "0.625rem",
    font_heading: "Playfair Display",
    font_body: "Inter",
    custom_css: "",
    meta_title: "Styllus Estética e Beleza",
    meta_description: "Agende seus serviços de estética e beleza online",
    meta_keywords: [] as string[],
    social_facebook: "",
    social_instagram: "",
    social_whatsapp: "",
    show_testimonials: true,
    show_services: true,
    show_courses: false,
    show_plans: false,
    show_employees: true,
    featured_services: [] as string[],
    featured_testimonials: [] as any[],
    featured_courses: [] as string[],
    featured_plans: [] as string[],
  })

  const [services, setServices] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const [settingsRes, servicesRes, coursesRes, plansRes] = await Promise.all([
      supabase.from("homepage_settings").select("*").single(),
      supabase.from("services").select("*").order("name"),
      supabase.from("courses").select("*").order("name"),
      supabase.from("subscription_plans").select("*").order("name"),
    ])

    if (settingsRes.data) {
      setSettings({
        hero_title: settingsRes.data.hero_title || "",
        hero_subtitle: settingsRes.data.hero_subtitle || "",
        hero_image_url: settingsRes.data.hero_image_url || "",
        logo_url: settingsRes.data.logo_url || "",
        favicon_url: settingsRes.data.favicon_url || "",
        cta_title: settingsRes.data.cta_title || "",
        cta_subtitle: settingsRes.data.cta_subtitle || "",
        business_name: settingsRes.data.business_name || "",
        business_phone: settingsRes.data.business_phone || "",
        business_email: settingsRes.data.business_email || "",
        business_hours: settingsRes.data.business_hours || "",
        primary_color_light: settingsRes.data.primary_color_light || "oklch(0.55 0.15 75)",
        primary_color_dark: settingsRes.data.primary_color_dark || "oklch(0.55 0.15 75)",
        background_color_light: settingsRes.data.background_color_light || "oklch(0.97 0.01 85)",
        background_color_dark: settingsRes.data.background_color_dark || "oklch(0.24 0.04 175)",
        card_color_light: settingsRes.data.card_color_light || "oklch(0.98 0.01 85)",
        card_color_dark: settingsRes.data.card_color_dark || "oklch(0.26 0.04 175)",
        text_color_light: settingsRes.data.text_color_light || "oklch(0.2 0 0)",
        text_color_dark: settingsRes.data.text_color_dark || "oklch(0.95 0 0)",
        accent_color_light: settingsRes.data.accent_color_light || "oklch(0.55 0.15 75)",
        accent_color_dark: settingsRes.data.accent_color_dark || "oklch(0.55 0.15 75)",
        border_radius: settingsRes.data.border_radius || "0.625rem",
        font_heading: settingsRes.data.font_heading || "Playfair Display",
        font_body: settingsRes.data.font_body || "Inter",
        custom_css: settingsRes.data.custom_css || "",
        meta_title: settingsRes.data.meta_title || "Styllus Estética e Beleza",
        meta_description: settingsRes.data.meta_description || "Agende seus serviços de estética e beleza online",
        meta_keywords: settingsRes.data.meta_keywords || [],
        social_facebook: settingsRes.data.social_facebook || "",
        social_instagram: settingsRes.data.social_instagram || "",
        social_whatsapp: settingsRes.data.social_whatsapp || "",
        show_testimonials: settingsRes.data.show_testimonials ?? true,
        show_services: settingsRes.data.show_services ?? true,
        show_courses: settingsRes.data.show_courses ?? false,
        show_plans: settingsRes.data.show_plans ?? false,
        show_employees: settingsRes.data.show_employees ?? true,
        featured_services: settingsRes.data.featured_services || [],
        featured_testimonials: settingsRes.data.featured_testimonials || [],
        featured_courses: settingsRes.data.featured_courses || [],
        featured_plans: settingsRes.data.featured_plans || [],
      })
      setTestimonials(settingsRes.data.featured_testimonials || [])
    }

    setServices(servicesRes.data || [])
    setCourses(coursesRes.data || [])
    setPlans(plansRes.data || [])

    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)

    console.log("[v0] Salvando configurações...")
    console.log("[v0] Settings to save:", {
      show_services: settings.show_services,
      show_employees: settings.show_employees,
      show_testimonials: settings.show_testimonials,
      show_courses: settings.show_courses,
      show_plans: settings.show_plans,
    })

    const settingsToSave = {
      id: "00000000-0000-0000-0000-000000000001",
      ...settings,
      featured_testimonials: testimonials,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("homepage_settings").upsert(settingsToSave, {
      onConflict: "id",
    })

    if (error) {
      console.error("[v0] Erro ao salvar:", error)
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      })
    } else {
      console.log("[v0] Salvo com sucesso!")
      toast({
        title: "Configurações salvas!",
        description: "As alterações foram aplicadas na homepage.",
      })
      await loadData()
      // Force refresh the homepage cache
      try {
        await fetch("/api/revalidate?path=/", { method: "POST" })
      } catch (e) {
        console.log("[v0] Cache revalidation not available")
      }
    }

    setSaving(false)
  }

  const toggleService = (serviceId: string) => {
    setSettings((prev) => ({
      ...prev,
      featured_services: prev.featured_services.includes(serviceId)
        ? prev.featured_services.filter((id) => id !== serviceId)
        : [...prev.featured_services, serviceId],
    }))
  }

  const toggleCourse = (courseId: string) => {
    setSettings((prev) => ({
      ...prev,
      featured_courses: prev.featured_courses.includes(courseId)
        ? prev.featured_courses.filter((id) => id !== courseId)
        : [...prev.featured_courses, courseId],
    }))
  }

  const togglePlan = (planId: string) => {
    setSettings((prev) => ({
      ...prev,
      featured_plans: prev.featured_plans.includes(planId)
        ? prev.featured_plans.filter((id) => id !== planId)
        : [...prev.featured_plans, planId],
    }))
  }

  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: "", service: "", text: "" }])
  }

  const updateTestimonial = (index: number, field: string, value: string) => {
    const updated = [...testimonials]
    updated[index] = { ...updated[index], [field]: value }
    setTestimonials(updated)
  }

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 flex items-center gap-2">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Configurações da Homepage
            </h1>
            <p className="text-sm text-muted-foreground">Configure todos os aspectos da página inicial</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto bg-transparent">
              <a href="/" target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </a>
            </Button>
            <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="sections">Seções</TabsTrigger>
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Seção Hero (Topo)
              </CardTitle>
              <CardDescription>Configure o banner principal da homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="hero-title">Título Principal</Label>
                <Input
                  id="hero-title"
                  value={settings.hero_title}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  placeholder="Sua Beleza, Nossa Paixão"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hero-subtitle">Subtítulo</Label>
                <Textarea
                  id="hero-subtitle"
                  value={settings.hero_subtitle}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  placeholder="Agende seus serviços..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Informações do Negócio
              </CardTitle>
              <CardDescription>Dados exibidos no rodapé e contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="business-name">Nome do Estabelecimento</Label>
                  <Input
                    id="business-name"
                    value={settings.business_name}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="business-phone">Telefone</Label>
                  <Input
                    id="business-phone"
                    value={settings.business_phone}
                    onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={settings.business_email}
                    onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="business-hours">Horário de Funcionamento</Label>
                  <Input
                    id="business-hours"
                    value={settings.business_hours}
                    onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call-to-Action Final</CardTitle>
              <CardDescription>Configure a seção de chamada para ação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cta-title">Título da CTA</Label>
                <Input
                  id="cta-title"
                  value={settings.cta_title}
                  onChange={(e) => setSettings({ ...settings, cta_title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cta-subtitle">Subtítulo da CTA</Label>
                <Textarea
                  id="cta-subtitle"
                  value={settings.cta_subtitle}
                  onChange={(e) => setSettings({ ...settings, cta_subtitle: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seções Visíveis</CardTitle>
              <CardDescription>Escolha quais seções exibir na homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="show-services">Mostrar Serviços</Label>
                  <p className="text-sm text-muted-foreground">Exibir seção de serviços</p>
                </div>
                <Switch
                  id="show-services"
                  checked={settings.show_services}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_services: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="show-employees">Mostrar Funcionários</Label>
                  <p className="text-sm text-muted-foreground">Exibir equipe de profissionais</p>
                </div>
                <Switch
                  id="show-employees"
                  checked={settings.show_employees}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_employees: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="show-testimonials">Mostrar Depoimentos</Label>
                  <p className="text-sm text-muted-foreground">Exibir depoimentos de clientes</p>
                </div>
                <Switch
                  id="show-testimonials"
                  checked={settings.show_testimonials}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_testimonials: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="show-courses">Mostrar Cursos</Label>
                  <p className="text-sm text-muted-foreground">Exibir cursos disponíveis</p>
                </div>
                <Switch
                  id="show-courses"
                  checked={settings.show_courses}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_courses: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="show-plans">Mostrar Planos</Label>
                  <p className="text-sm text-muted-foreground">Exibir planos de assinatura</p>
                </div>
                <Switch
                  id="show-plans"
                  checked={settings.show_plans}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_plans: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {settings.show_services && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Serviços em Destaque
                </CardTitle>
                <CardDescription>Selecione os serviços para exibir na homepage (máximo 8)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {services.map((service) => (
                    <Button
                      key={service.id}
                      variant={settings.featured_services.includes(service.id) ? "default" : "outline"}
                      className="h-auto py-4 flex-col items-start justify-start text-left"
                      onClick={() => toggleService(service.id)}
                      disabled={
                        !settings.featured_services.includes(service.id) && settings.featured_services.length >= 8
                      }
                    >
                      <span className="font-semibold">{service.name}</span>
                      <span className="text-xs opacity-80">R$ {service.price}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Selecionados: {settings.featured_services.length}/8
                </p>
              </CardContent>
            </Card>
          )}

          {settings.show_testimonials && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Depoimentos
                </CardTitle>
                <CardDescription>Gerencie os depoimentos exibidos na homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Nome do cliente"
                          value={testimonial.name}
                          onChange={(e) => updateTestimonial(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Serviço realizado"
                          value={testimonial.service}
                          onChange={(e) => updateTestimonial(index, "service", e.target.value)}
                        />
                      </div>
                      <Textarea
                        placeholder="Depoimento..."
                        value={testimonial.text}
                        onChange={(e) => updateTestimonial(index, "text", e.target.value)}
                        rows={3}
                      />
                      <Button variant="destructive" size="sm" onClick={() => removeTestimonial(index)}>
                        Remover
                      </Button>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" onClick={addTestimonial} className="w-full bg-transparent">
                  + Adicionar Depoimento
                </Button>
              </CardContent>
            </Card>
          )}

          {settings.show_courses && (
            <Card>
              <CardHeader>
                <CardTitle>Cursos em Destaque</CardTitle>
                <CardDescription>Selecione os cursos para exibir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {courses.map((course) => (
                    <Button
                      key={course.id}
                      variant={settings.featured_courses.includes(course.id) ? "default" : "outline"}
                      className="h-auto py-4 flex-col items-start justify-start text-left"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <span className="font-semibold">{course.title}</span>
                      <span className="text-xs opacity-80">R$ {course.price}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {settings.show_plans && (
            <Card>
              <CardHeader>
                <CardTitle>Planos em Destaque</CardTitle>
                <CardDescription>Selecione os planos para exibir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {plans.map((plan) => (
                    <Button
                      key={plan.id}
                      variant={settings.featured_plans.includes(plan.id) ? "default" : "outline"}
                      className="h-auto py-4 flex-col items-start justify-start text-left"
                      onClick={() => togglePlan(plan.id)}
                    >
                      <span className="font-semibold">{plan.name}</span>
                      <span className="text-xs opacity-80">R$ {plan.price}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Cores do Modo Claro
              </CardTitle>
              <CardDescription>Personalize as cores para o tema claro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primary-light">Cor Primária</Label>
                  <Input
                    id="primary-light"
                    value={settings.primary_color_light}
                    onChange={(e) => setSettings({ ...settings, primary_color_light: e.target.value })}
                    placeholder="oklch(0.55 0.15 75)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="background-light">Cor de Fundo</Label>
                  <Input
                    id="background-light"
                    value={settings.background_color_light}
                    onChange={(e) => setSettings({ ...settings, background_color_light: e.target.value })}
                    placeholder="oklch(0.97 0.01 85)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-light">Cor dos Cards</Label>
                  <Input
                    id="card-light"
                    value={settings.card_color_light}
                    onChange={(e) => setSettings({ ...settings, card_color_light: e.target.value })}
                    placeholder="oklch(0.98 0.01 85)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="text-light">Cor do Texto</Label>
                  <Input
                    id="text-light"
                    value={settings.text_color_light}
                    onChange={(e) => setSettings({ ...settings, text_color_light: e.target.value })}
                    placeholder="oklch(0.2 0 0)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accent-light">Cor de Destaque</Label>
                  <Input
                    id="accent-light"
                    value={settings.accent_color_light}
                    onChange={(e) => setSettings({ ...settings, accent_color_light: e.target.value })}
                    placeholder="oklch(0.55 0.15 75)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Cores do Modo Escuro
              </CardTitle>
              <CardDescription>Personalize as cores para o tema escuro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primary-dark">Cor Primária</Label>
                  <Input
                    id="primary-dark"
                    value={settings.primary_color_dark}
                    onChange={(e) => setSettings({ ...settings, primary_color_dark: e.target.value })}
                    placeholder="oklch(0.55 0.15 75)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="background-dark">Cor de Fundo</Label>
                  <Input
                    id="background-dark"
                    value={settings.background_color_dark}
                    onChange={(e) => setSettings({ ...settings, background_color_dark: e.target.value })}
                    placeholder="oklch(0.24 0.04 175)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-dark">Cor dos Cards</Label>
                  <Input
                    id="card-dark"
                    value={settings.card_color_dark}
                    onChange={(e) => setSettings({ ...settings, card_color_dark: e.target.value })}
                    placeholder="oklch(0.26 0.04 175)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="text-dark">Cor do Texto</Label>
                  <Input
                    id="text-dark"
                    value={settings.text_color_dark}
                    onChange={(e) => setSettings({ ...settings, text_color_dark: e.target.value })}
                    placeholder="oklch(0.95 0 0)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accent-dark">Cor de Destaque</Label>
                  <Input
                    id="accent-dark"
                    value={settings.accent_color_dark}
                    onChange={(e) => setSettings({ ...settings, accent_color_dark: e.target.value })}
                    placeholder="oklch(0.55 0.15 75)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipografia e Estilos</CardTitle>
              <CardDescription>Personalize fontes e estilos gerais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="font-heading">Fonte dos Títulos</Label>
                  <Input
                    id="font-heading"
                    value={settings.font_heading}
                    onChange={(e) => setSettings({ ...settings, font_heading: e.target.value })}
                    placeholder="Playfair Display"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="font-body">Fonte do Corpo</Label>
                  <Input
                    id="font-body"
                    value={settings.font_body}
                    onChange={(e) => setSettings({ ...settings, font_body: e.target.value })}
                    placeholder="Inter"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Input
                    id="border-radius"
                    value={settings.border_radius}
                    onChange={(e) => setSettings({ ...settings, border_radius: e.target.value })}
                    placeholder="0.625rem"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="custom-css">CSS Customizado</Label>
                <Textarea
                  id="custom-css"
                  value={settings.custom_css}
                  onChange={(e) => setSettings({ ...settings, custom_css: e.target.value })}
                  placeholder="/* Adicione CSS personalizado aqui */"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use este campo para adicionar CSS personalizado que será aplicado globalmente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Imagens e Logos
              </CardTitle>
              <CardDescription>Configure as imagens da sua homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="logo-url">Logo (URL)</Label>
                <Input
                  id="logo-url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">URL da imagem do logo do seu estabelecimento</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="favicon-url">Favicon (URL)</Label>
                <Input
                  id="favicon-url"
                  value={settings.favicon_url}
                  onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">URL do ícone que aparece na aba do navegador</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hero-image-url">Imagem Hero (URL)</Label>
                <Input
                  id="hero-image-url"
                  value={settings.hero_image_url}
                  onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Imagem de fundo para a seção hero (opcional, deixe vazio para usar gradiente)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                SEO e Meta Tags
              </CardTitle>
              <CardDescription>Otimize sua homepage para motores de busca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="meta-title">Título da Página (Meta Title)</Label>
                <Input
                  id="meta-title"
                  value={settings.meta_title}
                  onChange={(e) => setSettings({ ...settings, meta_title: e.target.value })}
                  placeholder="Styllus Estética e Beleza"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">Máximo 60 caracteres - {settings.meta_title.length}/60</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meta-description">Descrição (Meta Description)</Label>
                <Textarea
                  id="meta-description"
                  value={settings.meta_description}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                  placeholder="Agende seus serviços de estética e beleza online"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo 160 caracteres - {settings.meta_description.length}/160
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meta-keywords">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  id="meta-keywords"
                  value={settings.meta_keywords.join(", ")}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meta_keywords: e.target.value.split(",").map((k) => k.trim()),
                    })
                  }
                  placeholder="estética, beleza, salão, manicure, pedicure"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Redes Sociais
              </CardTitle>
              <CardDescription>Configure links para suas redes sociais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="social-facebook">Facebook</Label>
                <Input
                  id="social-facebook"
                  value={settings.social_facebook}
                  onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/seu-perfil"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="social-instagram">Instagram</Label>
                <Input
                  id="social-instagram"
                  value={settings.social_instagram}
                  onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/seu-perfil"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="social-whatsapp">WhatsApp</Label>
                <Input
                  id="social-whatsapp"
                  value={settings.social_whatsapp}
                  onChange={(e) => setSettings({ ...settings, social_whatsapp: e.target.value })}
                  placeholder="5511999999999"
                />
                <p className="text-xs text-muted-foreground">Digite apenas números com DDI e DDD (ex: 5511999999999)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={saveSettings} disabled={saving} size="lg" className="shadow-2xl">
          {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  )
}
