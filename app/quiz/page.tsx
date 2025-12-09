"use client"

import type React from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Star,
  ArrowLeft,
  ArrowRight,
  Clock,
  Award,
  MessageCircle,
  CheckCircle,
  Calendar,
  Search,
  Upload,
  X,
  ImageIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { put } from "@vercel/blob"

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
  const [allServices, setAllServices] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [additionalNotes, setAdditionalNotes] = useState("")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadQuiz() {
      console.log("[v0] Loading quiz data...")
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      const [questionsData, servicesData] = await Promise.all([
        supabase.from("quiz_questions").select("*").order("order_index", { ascending: true }),
        supabase.from("services").select("*").eq("is_active", true).order("category, name"),
      ])

      console.log("[v0] Questions loaded:", questionsData.data?.length || 0)
      console.log("[v0] Services loaded:", servicesData.data?.length || 0)

      // If no questions in database, use fallback questions
      if (!questionsData.data || questionsData.data.length === 0) {
        console.log("[v0] Using fallback questions")
        setQuestions([
          {
            id: 1,
            question: "Quais categorias de serviços você tem interesse?",
            options: [
              { value: "cabelo", label: "Cabelo (Corte, Coloração, Tratamentos)", specialty: "hair", weight: 5 },
              { value: "barba", label: "Barba e Bigode", specialty: "beard", weight: 4 },
              { value: "unhas", label: "Unhas (Manicure, Pedicure, Alongamento)", specialty: "nails", weight: 3 },
              { value: "estetica", label: "Estética Facial e Corporal", specialty: "aesthetics", weight: 4 },
              { value: "massagem", label: "Massagens e Relaxamento", specialty: "massage", weight: 5 },
              { value: "sobrancelha", label: "Sobrancelhas e Cílios", specialty: "eyebrows", weight: 3 },
              { value: "maquiagem", label: "Maquiagem", specialty: "makeup", weight: 4 },
              { value: "depilacao", label: "Depilação", specialty: "hair_removal", weight: 2 },
            ],
            order_index: 1,
            category: "interest",
          },
          {
            id: 2,
            question: "Com que frequência você busca esses serviços?",
            options: [
              { value: "semanal", label: "Semanalmente", specialty: "frequency_weekly", weight: 5 },
              { value: "quinzenal", label: "A cada 15 dias", specialty: "frequency_biweekly", weight: 4 },
              { value: "mensal", label: "Mensalmente", specialty: "frequency_monthly", weight: 3 },
              { value: "trimestral", label: "A cada 2-3 meses", specialty: "frequency_quarterly", weight: 2 },
              { value: "eventual", label: "Ocasionalmente", specialty: "frequency_occasional", weight: 1 },
            ],
            order_index: 2,
            category: "frequency",
          },
          {
            id: 3,
            question: "O que é mais importante para você?",
            options: [
              {
                value: "qualidade",
                label: "Qualidade e experiência do profissional",
                specialty: "priority_quality",
                weight: 5,
              },
              { value: "preco", label: "Preço acessível", specialty: "priority_price", weight: 3 },
              { value: "rapidez", label: "Atendimento rápido", specialty: "priority_speed", weight: 4 },
              { value: "localizacao", label: "Localização conveniente", specialty: "priority_location", weight: 3 },
              { value: "ambiente", label: "Ambiente agradável e acolhedor", specialty: "priority_ambiance", weight: 4 },
            ],
            order_index: 3,
            category: "priority",
          },
          {
            id: 4,
            question: "Que tipo de profissional você prefere?",
            options: [
              { value: "moderno", label: "Moderno e antenado nas tendências", specialty: "style_modern", weight: 4 },
              { value: "classico", label: "Clássico e tradicional", specialty: "style_classic", weight: 3 },
              {
                value: "versatil",
                label: "Versátil (faz vários tipos de trabalho)",
                specialty: "style_versatile",
                weight: 5,
              },
              {
                value: "especialista",
                label: "Especialista em técnicas específicas",
                specialty: "style_specialist",
                weight: 4,
              },
            ],
            order_index: 4,
            category: "style",
          },
        ])
      } else {
        setQuestions(questionsData.data)
      }

      if (servicesData.data) {
        setAllServices(servicesData.data)
      }
      setLoading(false)
    }
    loadQuiz()
  }, [])

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const blob = await put(`quiz-references/${Date.now()}-${file.name}`, file, {
          access: "public",
        })
        return blob.url
      })

      const urls = await Promise.all(uploadPromises)
      setReferenceImages((prev) => [...prev, ...urls])
      toast.success(`${files.length} imagem(ns) enviada(s) com sucesso!`)
    } catch (error) {
      console.error("[v0] Error uploading images:", error)
      toast.error("Erro ao enviar imagens")
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const filteredServices = allServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const servicesByCategory = filteredServices.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const handleNext = () => {
    const currentQ = questions[currentQuestion]
    if (!answers[currentQ.category]) {
      toast.error("Por favor, selecione uma resposta antes de continuar")
      return
    }

    if (currentQuestion < questions.length - 1) {
      setDirection(1)
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection(-1)
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  // calculateResult is no longer used, its logic is merged into handleSubmit
  // const calculateResult = async () => {
  //   setLoading(true)
  //   try {
  //     const specialtyScores: Record<string, number> = {}

  //     questions.forEach((question) => {
  //       const selectedAnswer = answers[question.category] // Changed from question.id to question.category
  //       if (selectedAnswer) {
  //         const option = question.options.find((opt: any) => opt.value === selectedAnswer) // Changed from text to value
  //         if (option) {
  //           specialtyScores[option.specialty] = (specialtyScores[option.specialty] || 0) + option.weight
  //         }
  //       }
  //     })

  //     const { data: staffMembers } = await supabase
  //       .from("profiles")
  //       .select("*")
  //       .eq("user_level", 20)
  //       .eq("is_active", true)
  //       .neq("staff_status", "inactive")

  //     if (staffMembers && staffMembers.length > 0) {
  //       const staffScores = staffMembers.map((staff) => {
  //         let score = 0
  //         if (staff.specialties) {
  //           staff.specialties.forEach((specialty: string) => {
  //             score += specialtyScores[specialty] || 0
  //           })
  //         }
  //         return { ...staff, score }
  //       })

  //       staffScores.sort((a, b) => b.score - a.score)
  //       const bestMatch = staffScores[0]

  //       const [servicesData, coursesData, subscriptionsData, feedbackData] = await Promise.all([
  //         supabase.from("staff_services").select("*, services(*)").eq("staff_id", bestMatch.id),
  //         supabase.from("staff_courses").select("*, courses(*)").eq("staff_id", bestMatch.id).eq("progress", 100),
  //         supabase.from("subscription_plans").select("*").eq("staff_id", bestMatch.id).eq("is_active", true),
  //         supabase
  //           .from("feedback")
  //           .select("*")
  //           .eq("staff_id", bestMatch.id)
  //           .order("created_at", { ascending: false })
  //           .limit(5),
  //       ])

  //       const avgRating =
  //         feedbackData.data && feedbackData.data.length > 0
  //           ? feedbackData.data.reduce((sum, f) => sum + f.rating, 0) / feedbackData.data.length
  //           : 0

  //       const resultData = {
  //         ...bestMatch,
  //         services: servicesData.data || [],
  //         courses: coursesData.data || [],
  //         subscriptions: subscriptionsData.data || [],
  //         feedback: feedbackData.data || [],
  //         avgRating,
  //       }

  //       setResult(resultData)

  //       setLoadingAiMessage(true)
  //       try {
  //         const selectedServicesDetails = allServices
  //           .filter((s) => selectedServices.includes(s.id))
  //           .map((s) => `${s.name} (${s.category})`)
  //           .join(", ")

  //         const response = await fetch("/api/quiz/personalize", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({
  //             staffId: bestMatch.id,
  //             userAnswers: answers,
  //             quizQuestions: questions,
  //             selectedServices: selectedServicesDetails,
  //             referenceImagesCount: referenceImages.length,
  //             additionalNotes,
  //           }),
  //         })

  //         if (response.ok) {
  //           const data = await response.json()
  //           setAiMessage(data.message)
  //         }
  //       } catch (error) {
  //         console.error("[v0] Error fetching AI message:", error)
  //       } finally {
  //         setLoadingAiMessage(false)
  //       }
  //     }
  //   } catch (error) {
  //     console.error("[v0] Error calculating quiz result:", error)
  //     toast.error("Erro ao calcular resultado")
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleSubmit = async () => {
    setLoadingAiMessage(true)
    try {
      console.log("[v0] Submitting quiz with answers:", answers)
      console.log("[v0] Selected services:", selectedServices)
      console.log("[v0] Reference images:", referenceImages.length)
      console.log("[v0] Additional notes:", additionalNotes)

      const requiredQuestions = questions.filter((q) => !q.question.includes("Opcional"))
      const answeredCount = Object.keys(answers).length

      // Note: The current flow has 4 questions + 1 service selection + 1 image/notes section, so total 6 steps.
      // We need to ensure answers are captured for all relevant questions.
      // The 'answers' state maps category to value. Let's check if all required categories have answers.
      const requiredCategories = questions.map((q) => q.category)
      const allRequiredAnswered = requiredCategories.every(
        (category) => answers[category] !== undefined && answers[category] !== "",
      )

      if (!allRequiredAnswered) {
        toast.error("Por favor, responda todas as perguntas obrigatórias")
        setLoadingAiMessage(false)
        return
      }

      setLoading(true)

      const supabase = await createClient()

      const specialtyScores: Record<string, number> = {}
      questions.forEach((question) => {
        const answer = answers[question.category] // Use category as key
        if (answer && question.options) {
          const option = question.options.find((opt: any) => opt.value === answer)
          if (option) {
            // Ensure specialty and weight exist
            if (option.specialty && typeof option.weight === "number") {
              specialtyScores[option.specialty] = (specialtyScores[option.specialty] || 0) + option.weight
            }
          }
        }
      })

      console.log("[v0] Specialty scores calculated:", specialtyScores)

      const { data: staffMembers, error: staffError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_level", 20)
        .eq("is_active", true)
        .neq("staff_status", "inactive")

      console.log("[v0] Found staff members:", staffMembers?.length || 0)

      if (staffError) {
        console.error("[v0] Error fetching staff:", staffError)
        toast.error("Erro ao buscar profissionais")
        setLoading(false)
        setLoadingAiMessage(false)
        return
      }

      if (!staffMembers || staffMembers.length === 0) {
        console.error("[v0] No active staff members found")
        toast.error("Nenhum profissional disponível no momento")
        setLoading(false)
        setLoadingAiMessage(false)
        return
      }

      const staffScores = staffMembers.map((staff) => {
        let score = 0
        // Ensure staff.specialties is an array before iterating
        if (Array.isArray(staff.specialties)) {
          staff.specialties.forEach((specialty: string) => {
            score += specialtyScores[specialty] || 0
          })
        }
        if (selectedServices.length > 0 && staff.id) {
          // This will be refined with actual service matching later
          // For now, a simple bonus if any service is selected.
          score += 5
        }
        return { ...staff, score }
      })

      staffScores.sort((a, b) => b.score - a.score)
      const bestMatch = staffScores[0]

      console.log("[v0] Best match found:", {
        id: bestMatch.id,
        name: bestMatch.full_name,
        score: bestMatch.score,
      })

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
        const selectedServicesDetails = allServices
          .filter((s) => selectedServices.includes(s.id))
          .map((s) => `${s.name} (${s.category})`)
          .join(", ")

        console.log("[v0] Calling AI API with staffId:", bestMatch.id)

        const response = await fetch("/api/quiz/personalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: bestMatch.id,
            userAnswers: answers,
            quizQuestions: questions,
            selectedServices: selectedServicesDetails,
            referenceImagesCount: referenceImages.length,
            additionalNotes,
          }),
        })

        console.log("[v0] AI API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] AI message received successfully")
          setAiMessage(data.message)
        } else {
          const errorData = await response.json()
          console.error("[v0] AI API error:", errorData)
          toast.error("Erro ao gerar recomendação personalizada")
        }
      } catch (error) {
        console.error("[v0] Error fetching AI message:", error)
        toast.error("Erro ao gerar recomendação com IA")
      } finally {
        setLoadingAiMessage(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-lg">Carregando quiz...</p>
        </div>
      </div>
    )
  }

  if (result) {
    const whatsappMessage = encodeURIComponent(
      `Oi ${result.full_name}, vi seu perfil através do quiz do Styllus e gostaria de agendar um horário!${
        selectedServices.length > 0
          ? ` Estou interessado(a) nos serviços: ${allServices
              .filter((s) => selectedServices.includes(s.id))
              .map((s) => s.name)
              .join(", ")}`
          : ""
      }`,
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
                      <p className="text-sm text-muted-foreground">Gerando recomendação personalizada com IA...</p>
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
                  setSelectedServices([])
                  setReferenceImages([])
                  setAdditionalNotes("")
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
  // +2 for service selection and image upload steps
  const progress = ((currentQuestion + 1) / (questions.length + 2)) * 100

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

  const isLastQuestion = currentQuestion === questions.length
  const isServiceSelectionStep = currentQuestion === questions.length + 1
  const isImageUploadStep = currentQuestion === questions.length + 2

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

      <main className="container max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle>Encontre seu profissional ideal</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">
                {isImageUploadStep
                  ? `Detalhes adicionais`
                  : isServiceSelectionStep
                    ? `Personalize sua busca (Opcional)`
                    : `Pergunta ${currentQuestion + 1} de ${questions.length}`}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait" custom={direction}>
              {currentQuestion < questions.length ? ( // Question Step
                <motion.div
                  key={currentQuestion}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">
                      Pergunta {currentQuestion + 1} de {questions.length}
                    </h3>
                    <p className="text-lg text-balance">{currentQ?.question}</p>

                    <RadioGroup
                      value={answers[currentQ?.category] || ""}
                      onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQ.category]: value }))}
                    >
                      <div className="space-y-3">
                        {currentQ?.options.map((option: any, index: number) => (
                          <motion.div
                            key={option.value}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Label
                              htmlFor={`option-${option.value}`}
                              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                answers[currentQ?.category] === option.value
                                  ? "border-gold bg-gold/5"
                                  : "border-border hover:border-gold/50 hover:bg-muted/50"
                              }`}
                            >
                              <RadioGroupItem value={option.value} id={`option-${option.value}`} className="mr-3" />
                              <span className="text-foreground font-medium">{option.label}</span>
                            </Label>
                          </motion.div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </motion.div>
              ) : currentQuestion === questions.length ? ( // Service Selection Step
                <motion.div
                  key="service-selection"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">Personalize sua busca (Opcional)</h3>
                    <p className="text-lg text-balance">Quais serviços específicos você tem interesse?</p>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar serviços por nome ou categoria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                      {filteredServices.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nenhum serviço encontrado</p>
                      ) : (
                        Object.entries(servicesByCategory).map(([category, services]) => (
                          <div key={category}>
                            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gold" />
                              {category}
                            </h3>
                            <div className="grid gap-2 ml-4">
                              {services.map((service) => (
                                <Label
                                  key={service.id}
                                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                    selectedServices.includes(service.id)
                                      ? "border-gold bg-gold/5"
                                      : "border-border hover:border-gold/50 hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={selectedServices.includes(service.id)}
                                    onCheckedChange={() => toggleService(service.id)}
                                    id={`service-${service.id}`}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium text-foreground">{service.name}</span>
                                      <span className="text-sm font-semibold text-gold ml-2">
                                        R$ {Number(service.price).toFixed(2)}
                                      </span>
                                    </div>
                                    {service.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">{service.duration} minutos</p>
                                  </div>
                                </Label>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {selectedServices.length > 0 && (
                      <div className="mt-3 p-3 bg-gold/5 border border-gold/20 rounded-lg">
                        <p className="text-sm font-medium text-foreground">
                          {selectedServices.length} serviço(s) selecionado(s)
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div> // Image Upload and Notes Step
              ) : (
                <motion.div
                  key="images-and-notes"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">Detalhes adicionais (Opcional)</h3>
                    <p className="text-lg text-balance">Tem imagens de referência do que você deseja?</p>

                    <div className="border-2 border-dashed rounded-lg p-6">
                      <label htmlFor="image-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          Clique para enviar imagens de referência
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImages}
                        />
                      </label>
                    </div>

                    {uploadingImages && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4 animate-pulse" />
                        Enviando imagens...
                      </div>
                    )}

                    {referenceImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {referenceImages.map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={url || "/placeholder.svg"}
                              alt={`Referência ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações adicionais (Opcional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Descreva mais detalhes sobre o que você procura, estilos preferidos, alergias, etc."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || loadingAiMessage}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>

              <Button
                onClick={
                  currentQuestion < questions.length + 1 // Check if it's not the last step before submitting
                    ? () => {
                        // Handle navigation to next question/step
                        setDirection(1)
                        setCurrentQuestion(currentQuestion + 1)
                      }
                    : handleSubmit // If it's the last step, call handleSubmit
                }
                disabled={
                  loadingAiMessage || // Disable if AI is processing
                  (currentQuestion < questions.length && !answers[currentQ?.category]) // Disable if current question is unanswered
                  // For optional steps (service selection, image upload), we don't strictly need to disable,
                  // but we should ensure loadingAiMessage is checked.
                }
                className="gap-2"
              >
                {currentQuestion < questions.length + 1 ? (
                  <>
                    Próxima
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {loadingAiMessage ? "Processando..." : "Ver Recomendação"}
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
