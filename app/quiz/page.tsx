"use client"

import { Calendar } from "@/components/ui/calendar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Star, ArrowLeft, ArrowRight, Clock, Award, MessageCircle, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { useState, useEffect } from "react"

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [aiMessage, setAiMessage] = useState<string>("")
  const [loadingAiMessage, setLoadingAiMessage] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [direction, setDirection] = useState(0)

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
      setDirection(1)
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setDirection(-1)
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateResult = async () => {
    setLoading(true)
    try {
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

      const { data: staffMembers } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_level", 20)
        .eq("is_active", true)
        .neq("staff_status", "inactive")

      if (staffMembers && staffMembers.length > 0) {
        const staffScores = staffMembers.map((staff) => {
          let score = 0
          if (staff.specialties) {
            staff.specialties.forEach((specialty: string) => {
              score += specialtyScores[specialty] || 0
            })
          }
          return { ...staff, score }
        })

        staffScores.sort((a, b) => b.score - a.score)
        const bestMatch = staffScores[0]

        const [servicesData, coursesData, subscriptionsData, feedbackData] = await Promise.all([
          supabase.from("staff_services").select("*, services(*)").eq("staff_id", bestMatch.id),
          supabase.from("staff_courses").select("*, courses(*)").eq("staff_id", bestMatch.id).eq("progress", 100),
          supabase.from("subscription_plans").select("*").eq("staff_id", bestMatch.id).eq("is_active", true),
          supabase
            .from("feedback")
            .select("*")
            .eq("staff_id", bestMatch.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ])

        const avgRating =
          feedbackData.data && feedbackData.data.length > 0
            ? feedbackData.data.reduce((sum, f) => sum + f.rating, 0) / feedbackData.data.length
            : 0

        const resultData = {
          ...bestMatch,
          services: servicesData.data || [],
          courses: coursesData.data || [],
          subscriptions: subscriptionsData.data || [],
          feedback: feedbackData.data || [],
          avgRating,
        }

        setResult(resultData)

        setLoadingAiMessage(true)
        try {
          const response = await fetch("/api/quiz/personalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              staffId: bestMatch.id,
              userAnswers: answers,
              quizQuestions: questions,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setAiMessage(data.message)
          }
        } catch (error) {
          console.error("[v0] Error fetching AI message:", error)
        } finally {
          setLoadingAiMessage(false)
        }
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (result) {
    const whatsappMessage = encodeURIComponent(
      `Oi ${result.full_name}, vi seu perfil através do quiz do Styllus e gostaria de agendar um horário!`,
    )
    const whatsappLink = `https://wa.me/55${result.phone?.replace(/\D/g, "")}?text=${whatsappMessage}`

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gold/20 rounded-full mb-4"
              >
                <Sparkles className="h-10 w-10 text-gold" />
              </motion.div>
              <h1 className="text-4xl font-bold text-foreground mb-4">Encontramos seu match perfeito!</h1>
              <p className="text-muted-foreground text-lg">Baseado nas suas preferências, recomendamos:</p>
            </div>

            {aiMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">Por que esta recomendação?</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiMessage}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {loadingAiMessage && !aiMessage && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                <Card className="border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold"></div>
                      <p className="text-sm text-muted-foreground">Gerando recomendação personalizada...</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="border-gold/20 overflow-hidden">
              <div className="bg-gradient-to-br from-gold/10 via-transparent to-transparent p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {result.avatar_url ? (
                      <img
                        src={result.avatar_url || "/placeholder.svg"}
                        alt={result.full_name}
                        className="h-32 w-32 rounded-full object-cover ring-4 ring-gold/20"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gold/10 flex items-center justify-center ring-4 ring-gold/20">
                        <span className="text-4xl font-bold text-gold">{result.full_name?.[0] || "?"}</span>
                      </div>
                    )}
                  </motion.div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-foreground mb-2">{result.full_name}</h2>
                    {result.avgRating > 0 && (
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(result.avgRating) ? "fill-gold text-gold" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {result.avgRating.toFixed(1)} ({result.feedback.length} avaliações)
                        </span>
                      </div>
                    )}
                    {result.bio && <p className="text-muted-foreground">{result.bio}</p>}
                  </div>
                </div>
              </div>

              <CardContent className="space-y-6 p-8">
                {result.specialties && result.specialties.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-gold" />
                      <p className="font-semibold text-foreground">Especialidades</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.specialties.map((specialty: string, index: number) => (
                        <motion.span
                          key={specialty}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="px-4 py-2 bg-gold/10 text-gold rounded-full text-sm font-medium border border-gold/20"
                        >
                          {specialty}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {result.working_hours && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card/50 p-4 rounded-lg border border-gold/10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-gold" />
                      <p className="font-semibold text-foreground">Horário de Atendimento</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {Object.entries(result.working_hours).map(([day, hours]: [string, any]) => {
                        const dayNames: Record<string, string> = {
                          monday: "Segunda",
                          tuesday: "Terça",
                          wednesday: "Quarta",
                          thursday: "Quinta",
                          friday: "Sexta",
                          saturday: "Sábado",
                          sunday: "Domingo",
                        }
                        return (
                          <div
                            key={day}
                            className="flex justify-between items-center px-3 py-2 bg-background/50 rounded"
                          >
                            <span className="text-muted-foreground font-medium">{dayNames[day]}</span>
                            <span className={hours.enabled ? "text-foreground font-medium" : "text-muted-foreground"}>
                              {hours.enabled ? `${hours.start} - ${hours.end}` : "Fechado"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {result.services && result.services.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-gold" />
                      <p className="font-semibold text-foreground">Serviços Oferecidos</p>
                    </div>
                    <div className="grid gap-3">
                      {result.services.map((item: any, index: number) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="p-4 border border-gold/20 rounded-lg hover:border-gold/40 transition-colors bg-card/50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{item.services.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{item.services.description}</p>
                            </div>
                            <p className="text-lg font-bold text-gold ml-4">
                              R$ {Number(item.services.price).toFixed(2)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {result.feedback && result.feedback.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-gold fill-gold" />
                      <p className="font-semibold text-foreground">Avaliações Recentes</p>
                    </div>
                    <div className="space-y-3">
                      {result.feedback.slice(0, 3).map((review: any, index: number) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="p-3 bg-card/50 rounded-lg border border-gold/10"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating ? "fill-gold text-gold" : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="pt-6 space-y-3"
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-gold hover:bg-gold/90 text-black text-lg py-6">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Conversar no WhatsApp
                    </Button>
                  </a>
                  {user && (
                    <Link href="/cliente/agendar">
                      <Button variant="outline" className="w-full border-gold/20 hover:bg-gold/5 py-6 bg-transparent">
                        <Calendar className="mr-2 h-5 w-5" />
                        Agendar Horário Online
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </CardContent>
            </Card>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-center"
            >
              <Button
                onClick={() => {
                  setResult(null)
                  setCurrentQuestion(0)
                  setAnswers({})
                }}
                variant="outline"
                className="mr-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Refazer Quiz
              </Button>
              <Link href="/">
                <Button variant="outline">Voltar ao início</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-gold" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Encontre seu profissional ideal</h1>
            <p className="text-muted-foreground text-lg">
              Responda algumas perguntas e vamos recomendar o melhor profissional para você
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                Pergunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm font-medium text-gold">{Math.round(progress)}% completo</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">{currentQ?.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[currentQ?.id] || ""}
                    onValueChange={(value) => handleAnswer(currentQ.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQ?.options.map((option: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Label
                            htmlFor={`option-${index}`}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              answers[currentQ?.id] === option.text
                                ? "border-gold bg-gold/5"
                                : "border-border hover:border-gold/50 hover:bg-muted/50"
                            }`}
                          >
                            <RadioGroupItem value={option.text} id={`option-${index}`} className="mr-3" />
                            <span className="text-foreground font-medium">{option.text}</span>
                          </Label>
                        </motion.div>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentQuestion === 0}
                      className="border-gold/20 bg-transparent"
                    >
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
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            Calculando...
                          </>
                        ) : (
                          <>
                            Ver Resultado
                            <Sparkles className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
