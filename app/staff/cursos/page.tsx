import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function StaffCursos() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const { data: enrollments } = await supabase
    .from("staff_courses")
    .select(
      `
      *,
      course:courses(*)
    `,
    )
    .eq("staff_id", user.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Cursos e Treinamentos</h1>
          <p className="text-muted-foreground">Aprimore suas habilidades profissionais</p>
        </div>

        {enrollments && enrollments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Meus Cursos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="border-gold/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{enrollment.course?.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{enrollment.course?.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {enrollment.course?.duration}h
                      </span>
                      <span className="text-sm font-medium text-gold">{enrollment.progress}% concluído</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gold h-2 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Cursos Disponíveis</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {courses && courses.length > 0 ? (
              courses.map((course) => {
                const isEnrolled = enrollments?.some((e) => e.course_id === course.id)
                return (
                  <Card key={course.id} className="border-gold/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {course.duration}h
                            </span>
                            <span className="px-2 py-1 bg-gold/10 text-gold rounded text-xs">{course.level}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gold">R$ {Number(course.price).toFixed(2)}</span>
                        <Button disabled={isEnrolled} className="bg-gold hover:bg-gold/90 text-black">
                          {isEnrolled ? "Inscrito" : "Inscrever-se"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="border-gold/20 md:col-span-2">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gold mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum curso disponível no momento</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
