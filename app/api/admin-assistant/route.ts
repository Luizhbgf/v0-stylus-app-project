import { createServerClient } from "@/lib/supabase-server"
import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = createServerClient()

  // Buscar dados do negócio para contexto
  const [
    { data: appointments },
    { data: services },
    { data: staff },
    { data: clients },
    { data: subscriptions },
    { data: courses },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, services(*), profiles!appointments_staff_id_fkey(*)")
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("services").select("*"),
    supabase.from("profiles").select("*").gte("user_level", 20),
    supabase.from("profiles").select("*").eq("user_level", 10),
    supabase.from("subscriptions").select("*, subscription_plans(*)"),
    supabase.from("courses").select("*, course_enrollments(*)"),
  ])

  // Calcular estatísticas
  const totalRevenue =
    appointments?.reduce((sum, apt) => {
      const price = apt.custom_price || apt.services?.price || 0
      return sum + (apt.status === "completed" ? price : 0)
    }, 0) || 0

  const completedAppointments = appointments?.filter((apt) => apt.status === "completed").length || 0
  const pendingAppointments = appointments?.filter((apt) => apt.status === "pending").length || 0
  const canceledAppointments = appointments?.filter((apt) => apt.status === "canceled").length || 0

  // Serviços mais populares
  const serviceStats = appointments?.reduce((acc: any, apt) => {
    const serviceName = apt.services?.name || "Desconhecido"
    if (!acc[serviceName]) {
      acc[serviceName] = { count: 0, revenue: 0 }
    }
    acc[serviceName].count++
    if (apt.status === "completed") {
      acc[serviceName].revenue += apt.custom_price || apt.services?.price || 0
    }
    return acc
  }, {})

  const topServices = Object.entries(serviceStats || {})
    .map(([name, data]: [string, any]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Performance dos staff
  const staffStats = appointments?.reduce((acc: any, apt) => {
    const staffName = apt.profiles?.full_name || "Desconhecido"
    if (!acc[staffName]) {
      acc[staffName] = { completed: 0, revenue: 0, canceled: 0 }
    }
    if (apt.status === "completed") {
      acc[staffName].completed++
      acc[staffName].revenue += apt.custom_price || apt.services?.price || 0
    } else if (apt.status === "canceled") {
      acc[staffName].canceled++
    }
    return acc
  }, {})

  const staffPerformance = Object.entries(staffStats || {})
    .map(([name, data]: [string, any]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Taxa de conclusão
  const completionRate = appointments?.length ? ((completedAppointments / appointments.length) * 100).toFixed(1) : 0

  // Contexto para IA
  const businessContext = `
Você é um assistente IA especializado em análise de negócios de salão de beleza.

DADOS DOS ÚLTIMOS 30 DIAS:
- Receita Total: R$ ${totalRevenue.toFixed(2)}
- Agendamentos Concluídos: ${completedAppointments}
- Agendamentos Pendentes: ${pendingAppointments}
- Agendamentos Cancelados: ${canceledAppointments}
- Taxa de Conclusão: ${completionRate}%
- Total de Clientes: ${clients?.length || 0}
- Total de Funcionários: ${staff?.length || 0}
- Total de Serviços: ${services?.length || 0}
- Assinaturas Ativas: ${subscriptions?.filter((s) => s.status === "active").length || 0}
- Cursos Oferecidos: ${courses?.length || 0}

TOP 5 SERVIÇOS MAIS RENTÁVEIS:
${topServices.map((s, i) => `${i + 1}. ${s.name} - ${s.count} vendas - R$ ${s.revenue.toFixed(2)}`).join("\n")}

PERFORMANCE DOS FUNCIONÁRIOS:
${staffPerformance.map((s, i) => `${i + 1}. ${s.name} - ${s.completed} concluídos - R$ ${s.revenue.toFixed(2)} - ${s.canceled} cancelados`).join("\n")}

Analise esses dados e forneça insights acionáveis. Identifique:
- Sucessos (o que está funcionando bem)
- Desafios (problemas e gargalos)
- Oportunidades (onde pode melhorar)
- Recomendações específicas e práticas

Seja direto, use números e forneça sugestões concretas.
`

  const result = await streamText({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: businessContext,
      },
      ...messages,
    ],
  })

  return result.toUIMessageStreamResponse()
}
