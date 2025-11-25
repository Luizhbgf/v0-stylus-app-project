"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, DollarSign, Users, TrendingUp, Award, Filter } from "lucide-react"
import { format } from "date-fns"

type Profile = {
  id: string
  full_name: string
  user_level: number
}

type CourseStats = {
  id: string
  title: string
  price: number
  enrollments: number
  completions: number
  revenue: number
  avgProgress: number
  instructor: string
}

export default function DashboardCursosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all")
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [instructors, setInstructors] = useState<string[]>([])

  useEffect(() => {
    async function loadData() {
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
      setLoading(false)
      loadCourses()
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    if (profile) {
      loadCourseStats()
    }
  }, [profile, selectedInstructor, startDate, endDate])

  async function loadCourses() {
    const { data } = await supabase.from("courses").select("*").order("title")

    if (data) {
      setCourses(data)
      const uniqueInstructors = [...new Set(data.map((c) => c.instructor).filter(Boolean))]
      setInstructors(uniqueInstructors as string[])
    }
  }

  async function loadCourseStats() {
    const query = supabase
      .from("staff_courses")
      .select(
        `
        *,
        course:courses(*),
        staff:profiles!staff_id(full_name)
      `,
      )
      .gte("enrolled_at", new Date(startDate).toISOString())
      .lte("enrolled_at", new Date(endDate + "T23:59:59").toISOString())

    const { data: enrollments } = await query

    if (!enrollments) {
      setCourseStats([])
      return
    }

    // Group by course
    const statsMap = new Map<string, CourseStats>()

    enrollments.forEach((enrollment: any) => {
      const course = enrollment.course
      if (!course) return

      // Filter by instructor if selected
      if (selectedInstructor !== "all" && course.instructor !== selectedInstructor) {
        return
      }

      if (!statsMap.has(course.id)) {
        statsMap.set(course.id, {
          id: course.id,
          title: course.title,
          price: Number(course.price) || 0,
          enrollments: 0,
          completions: 0,
          revenue: 0,
          avgProgress: 0,
          instructor: course.instructor || "N/A",
        })
      }

      const stats = statsMap.get(course.id)!
      stats.enrollments++
      stats.revenue += Number(course.price) || 0
      stats.avgProgress += enrollment.progress || 0
      if (enrollment.completed_at) {
        stats.completions++
      }
    })

    // Calculate averages
    statsMap.forEach((stats) => {
      if (stats.enrollments > 0) {
        stats.avgProgress = Math.round(stats.avgProgress / stats.enrollments)
      }
    })

    const statsArray = Array.from(statsMap.values())
    setCourseStats(statsArray)
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const totalRevenue = courseStats.reduce((sum, c) => sum + c.revenue, 0)
  const totalEnrollments = courseStats.reduce((sum, c) => sum + c.enrollments, 0)
  const totalCompletions = courseStats.reduce((sum, c) => sum + c.completions, 0)
  const completionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0

  const topCoursesByRevenue = [...courseStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  const topCoursesByEnrollments = [...courseStats].sort((a, b) => b.enrollments - a.enrollments).slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Financeiro de Cursos</h1>
          <p className="text-muted-foreground">Análise detalhada de lucros e desempenho de cada curso</p>
        </div>

        {/* Filters */}
        <Card className="border-gold/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-gold" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Instrutor</label>
                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                  <SelectTrigger className="border-gold/20">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor} value={instructor}>
                        {instructor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-gold/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Período selecionado</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
              <Users className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">Alunos inscritos</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Concluídos</CardTitle>
              <BookOpen className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalCompletions}</div>
              <p className="text-xs text-muted-foreground mt-1">Certificados emitidos</p>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Média geral</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Courses */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Award className="h-5 w-5 text-gold" />
                Top 5 Cursos por Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCoursesByRevenue.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">Instrutor: {course.instructor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 ml-8">
                        <span>{course.enrollments} matrículas</span>
                        <span>{course.completions} concluídos</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gold">R$ {course.revenue.toFixed(2)}</p>
                  </div>
                ))}
                {topCoursesByRevenue.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-gold" />
                Top 5 Cursos por Matrículas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCoursesByEnrollments.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">Instrutor: {course.instructor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 ml-8">
                        <span>Progresso médio: {course.avgProgress}%</span>
                        <span>{course.completions} concluídos</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{course.enrollments}</p>
                      <p className="text-xs text-muted-foreground">alunos</p>
                    </div>
                  </div>
                ))}
                {topCoursesByEnrollments.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Courses Table */}
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-foreground">Todos os Cursos - Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courseStats.map((course) => {
                const courseCompletionRate =
                  course.enrollments > 0 ? (course.completions / course.enrollments) * 100 : 0

                return (
                  <div key={course.id} className="p-4 bg-card/50 rounded-lg border border-gold/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">Instrutor: {course.instructor}</p>
                        <p className="text-sm text-muted-foreground">Preço: R$ {course.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gold">R$ {course.revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Receita total</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-2 bg-background/50 rounded">
                        <p className="text-xs text-muted-foreground">Matrículas</p>
                        <p className="text-xl font-bold text-foreground">{course.enrollments}</p>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded">
                        <p className="text-xs text-muted-foreground">Concluídos</p>
                        <p className="text-xl font-bold text-foreground">{course.completions}</p>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded">
                        <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                        <p className="text-xl font-bold text-foreground">{courseCompletionRate.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-background/50 rounded">
                        <p className="text-xs text-muted-foreground">Progresso Médio</p>
                        <p className="text-xl font-bold text-foreground">{course.avgProgress}%</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {courseStats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado de curso disponível no período selecionado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
