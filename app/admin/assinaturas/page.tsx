"use client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Users, Search, Filter } from "lucide-react"
import { useClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function AdminAssinaturasPage() {
  const supabase = useClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profileData || profileData.user_level < 30) {
      router.push("/admin")
      return
    }

    setProfile(profileData)

    const [plansRes, subscriptionsRes, staffRes] = await Promise.all([
      supabase
        .from("subscription_plans")
        .select(`
        *,
        staff:staff_id(full_name, avatar_url),
        features:subscription_plan_features(*)
      `)
        .order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").eq("status", "active"),
      supabase.from("profiles").select("*").gte("user_level", 20).lte("user_level", 29).order("full_name"),
    ])

    const plansWithStats = plansRes.data?.map((plan) => {
      const activeSubscriptions = subscriptionsRes.data?.filter((s) => s.plan_id === plan.id).length || 0
      return {
        ...plan,
        active_subscriptions: activeSubscriptions,
      }
    })

    setPlans(plansWithStats || [])
    setSubscriptions(subscriptionsRes.data || [])
    setStaffMembers(staffRes.data || [])
    setLoading(false)
  }

  const filteredPlans = plans.filter((plan) => {
    const matchesStaff = selectedStaff === "all" || plan.staff_id === selectedStaff
    const matchesSearch =
      !searchTerm ||
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && plan.is_active) ||
      (statusFilter === "inactive" && !plan.is_active)
    return matchesStaff && matchesSearch && matchesStatus
  })

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Gerenciar Assinaturas</h1>
            <p className="text-sm md:text-base text-muted-foreground">Todos os planos de assinatura da plataforma</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-black w-full sm:w-auto">
            <Link href="/admin/assinaturas/criar">
              <Plus className="h-4 w-4 mr-2" />
              Criar Plano
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Planos</p>
                  <p className="text-3xl font-bold text-foreground">{plans.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planos Ativos</p>
                  <p className="text-3xl font-bold text-foreground">{plans.filter((p) => p.is_active).length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Badge className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assinantes Ativos</p>
                  <p className="text-3xl font-bold text-foreground">{subscriptions.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Mensal</p>
                  <p className="text-3xl font-bold text-primary">
                    R$ {subscriptions.reduce((sum, s) => sum + Number(s.price || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Profissional</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground invisible">Ações</label>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setSelectedStaff("all")
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredPlans.length} de {plans.length} planos
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => (
              <Card key={plan.id} className="border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-foreground mb-1">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Por: {plan.staff?.full_name}</p>
                    </div>
                    <Badge variant={plan.is_active ? "default" : "secondary"} className="ml-2">
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recursos:</span>
                      <span className="font-medium">{plan.features?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assinantes:</span>
                      <span className="font-medium text-primary">{plan.active_subscriptions}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-primary/20">
                    <div className="text-2xl font-bold text-primary mb-4">R$ {Number(plan.price).toFixed(2)}/mês</div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1 bg-transparent" size="sm">
                        <Link href={`/staff/assinaturas/${plan.id}`}>Ver</Link>
                      </Button>
                      <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-black" size="sm">
                        <Link href={`/staff/assinaturas/${plan.id}/editar`}>Editar</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-primary/20 col-span-full">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {plans.length === 0
                    ? "Nenhum plano de assinatura criado"
                    : "Nenhum plano encontrado com os filtros aplicados"}
                </p>
                {plans.length === 0 && (
                  <Button asChild className="bg-primary hover:bg-primary/90 text-black">
                    <Link href="/admin/assinaturas/criar">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Plano
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
