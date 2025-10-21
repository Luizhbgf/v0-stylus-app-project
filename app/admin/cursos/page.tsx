import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminCursosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 30) {
    redirect("/cliente")
  }

  // Get all courses
  const { data: courses } = await supabase.from("courses").select("*").order("created_at", { ascending: false })

  // Get enrollment stats for each course
  const { data: enrollments } = await supabase.from("course_enrollments").select("*")

  const coursesWithStats = courses?.map((course) => {
    const courseEnrollments = enrollments?.filter((e) => e.course_id === course.id) || []
    const completedCount = courseEnrollments.filter((e) => e.completed).length
    return {
      ...course,
      total_enrolled: courseEnrollments.length,
      completed_count: completedCount,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Cursos e Treinamentos</h1>
            <p className="text-muted-foreground">Gerenciar cursos disponíveis para a equipe</p>
          </div>
          <Button asChild className="bg-gold hover:bg-gold/90 text-black">
            <Link href="/admin/cursos/criar">Criar Novo Curso</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {coursesWithStats && coursesWithStats.length > 0 ? (
            coursesWithStats.map((course) => (
              <Card key={course.id} className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BookOpen className="h-5 w-5 text-gold" />
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-card/50 rounded-lg">
                      <Users className="h-5 w-5 text-gold mx-auto mb-1" />
                      <p className="text-sm font-medium text-foreground">{course.total_enrolled}</p>
                      <p className="text-xs text-muted-foreground">Inscritos</p>
                    </div>
                    <div className="text-center p-3 bg-card/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-gold mx-auto mb-1" />
                      <p className="text-sm font-medium text-foreground">{course.completed_count}</p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                    <div className="text-center p-3 bg-card/50 rounded-lg">
                      <Clock className="h-5 w-5 text-gold mx-auto mb-1" />
                      <p className="text-sm font-medium text-foreground">{course.duration_hours}h</p>
                      <p className="text-xs text-muted-foreground">Duração</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href={`/admin/cursos/${course.id}`}>Ver Detalhes</Link>
                    </Button>
                    <Button asChild className="flex-1 bg-gold hover:bg-gold/90 text-black">
                      <Link href={`/admin/cursos/${course.id}/editar`}>Editar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20 col-span-2">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">Nenhum curso cadastrado</p>
                <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                  <Link href="/admin/cursos/criar">Criar Primeiro Curso</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
