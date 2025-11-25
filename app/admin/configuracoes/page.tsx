"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, Home, Star, Briefcase, Save, Eye, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminConfiguracoes() {
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    hero_title: "",
    hero_subtitle: "",
    cta_title: "",
    cta_subtitle: "",
    business_name: "",
    business_phone: "",
    business_email: "",
    business_hours: "",
    show_testimonials: true,
    show_services: true,
    show_courses: false,
    show_plans: false,
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
        cta_title: settingsRes.data.cta_title || "",
        cta_subtitle: settingsRes.data.cta_subtitle || "",
        business_name: settingsRes.data.business_name || "",
        business_phone: settingsRes.data.business_phone || "",
        business_email: settingsRes.data.business_email || "",
        business_hours: settingsRes.data.business_hours || "",
        show_testimonials: settingsRes.data.show_testimonials ?? true,
        show_services: settingsRes.data.show_services ?? true,
        show_courses: settingsRes.data.show_courses ?? false,
        show_plans: settingsRes.data.show_plans ?? false,
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

    const { error } = await supabase
      .from("homepage_settings")
      .update({
        ...settings,
        featured_testimonials: testimonials,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "00000000-0000-0000-0000-000000000001")

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Configurações salvas!",
        description: "As alterações foram aplicadas na homepage.",
      })
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Settings className="h-10 w-10 text-primary" />
            Configurações da Homepage
          </h1>
          <p className="text-muted-foreground">Personalize a página inicial do seu site</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </a>
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Hero Section */}
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

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Informações do Negócio
            </CardTitle>
            <CardDescription>Dados exibidos no rodapé e contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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
            <div className="grid md:grid-cols-2 gap-4">
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

        {/* Featured Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Seções Visíveis</CardTitle>
            <CardDescription>Escolha quais seções exibir na homepage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-services">Mostrar Serviços</Label>
                <p className="text-sm text-muted-foreground">Exibir seção de serviços</p>
              </div>
              <Switch
                id="show-services"
                checked={settings.show_services}
                onCheckedChange={(checked) => setSettings({ ...settings, show_services: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-testimonials">Mostrar Depoimentos</Label>
                <p className="text-sm text-muted-foreground">Exibir depoimentos de clientes</p>
              </div>
              <Switch
                id="show-testimonials"
                checked={settings.show_testimonials}
                onCheckedChange={(checked) => setSettings({ ...settings, show_testimonials: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-courses">Mostrar Cursos</Label>
                <p className="text-sm text-muted-foreground">Exibir cursos disponíveis</p>
              </div>
              <Switch
                id="show-courses"
                checked={settings.show_courses}
                onCheckedChange={(checked) => setSettings({ ...settings, show_courses: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
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

        {/* Featured Services */}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <p className="text-sm text-muted-foreground mt-4">Selecionados: {settings.featured_services.length}/8</p>
            </CardContent>
          </Card>
        )}

        {/* Testimonials */}
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
                    <div className="grid md:grid-cols-2 gap-3">
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

        {/* CTA Section */}
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

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Todas as Alterações
          </Button>
        </div>
      </div>
    </div>
  )
}
