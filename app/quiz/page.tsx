"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadQuiz() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select("*")
        .order("order_index", { ascending: true })

      if (questionsData) {
        setQuestions(questionsData)
      }
      setLoading(false)
    }
    loadQuiz()
  }, [])

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateResult = async () => {
    setLoading(true)
    try {
      // Calculate specialty scores based on answers
      const specialtyScores: Record<string, number> = {}

      questions.forEach((question) => {
        const selectedAnswer = answers[question.id]
        if (selectedAnswer) {
          const option = question.options.find((opt: any) => opt.text === selectedAnswer)
          if (option) {
            specialtyScores[option.specialty] = (specialtyScores[option.specialty] || 0) + option.weight
          }
        }
      })

      // Find staff members with matching specialties
      const { data: staffMembers } = await supabase.from("profiles").select("*").eq("user_level", 20)

      if (staffMembers && staffMembers.length > 0) {
        // Score each staff member based on specialty match
        const staffScores = staffMembers.map((staff) => {
          let score = 0
          if (staff.specialties) {
            staff.specialties.forEach((specialty: string) => {
              score += specialtyScores[specialty] || 0
            })
          }
          return { ...staff, score }
        })

        // Sort by score and get the best match
        staffScores.sort((a, b) => b.score - a.score)
        const bestMatch = staffScores[0]

        // Save result if user is logged in
        if (user) {
          await supabase.from("quiz_results").insert({
            client_id: user.id,
            recommended_staff_id: bestMatch.id,
            answers: answers,
            score: bestMatch.score,
          })
        }

        setResult(bestMatch)
      }
    } catch (error) {
      console.error("[v0] Error calculating quiz result:", error)
      toast.error("Erro ao calcular resultado")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.png" alt="Styllus Logo" width={180} height={60} className="h-12 w-auto" />
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Sparkles className="h-16 w-16 text-gold mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-foreground mb-4">Encontramos seu profissional ideal!</h1>
              <p className="text-muted-foreground">Baseado nas suas preferências, recomendamos:</p>
            </div>

            <Card className="border-gold/20">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  {result.avatar_url ? (
                    <img
                      src={result.avatar_url || "/placeholder.svg"}
                      alt={result.full_name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gold/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gold">{result.full_name?.[0] || "?"}</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl">{result.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.bio && <p className="text-muted-foreground">{result.bio}</p>}
                {result.specialties && result.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Especialidades:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {result.specialties.map((specialty: string) => (
                        <span key={specialty} className="px-3 py-1 bg-gold/10 text-gold rounded-full text-sm">
                          {specialty.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <Link href={`/agendar?staff=${result.id}`}>
                    <Button className="w-full bg-gold hover:bg-gold/90 text-black">
                      Agendar com {result.full_name}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao início
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Styllus Logo" width={180} height={60} className="h-12 w-auto" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Encontre seu profissional ideal</h1>
            <p className="text-muted-foreground">
              Responda algumas perguntas e vamos recomendar o melhor profissional para você
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Pergunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{currentQ?.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQ?.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                <div className="space-y-3">
                  {currentQ?.options.map((option: any, index: number) => (
                    <Label
                      key={index}
                      htmlFor={`option-${index}`}
                      className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={option.text} id={`option-${index}`} className="mr-3" />
                      <span className="text-foreground">{option.text}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={handleBack} disabled={currentQuestion === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                {currentQuestion < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!answers[currentQ?.id]}
                    className="bg-gold hover:bg-gold/90 text-black"
                  >
                    Próxima
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={calculateResult}
                    disabled={!answers[currentQ?.id] || loading}
                    className="bg-gold hover:bg-gold/90 text-black"
                  >
                    {loading ? "Calculando..." : "Ver Resultado"}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
