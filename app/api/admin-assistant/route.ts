import { createServerClient } from "@/lib/supabase-server"
import { generateText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { message, metrics } = await req.json()
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

    const totalAppointments = appointments?.length || 0
    const completedAppointments = appointments?.filter((apt) => apt.status === "completed").length || 0
    const totalClients = clients?.length || 0

    // Contexto para IA
    const businessContext = `
Você é um assistente IA especializado em análise de negócios de salão de beleza.

DADOS DOS ÚLTIMOS 30 DIAS:
- Receita Total: R$ ${totalRevenue.toFixed(2)}
- Total de Agendamentos: ${totalAppointments}
- Agendamentos Concluídos: ${completedAppointments}
- Total de Clientes: ${totalClients}

Analise esses dados e responda à seguinte pergunta de forma objetiva e prática:

${message}

Forneça insights acionáveis identificando sucessos, desafios, oportunidades e recomendações específicas. Use números e seja direto.
`

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: businessContext,
    })

    return Response.json({ response: result.text })
  } catch (error) {
    console.error("[v0] Error in admin-assistant:", error)
    return Response.json({ error: "Erro ao processar a mensagem. Por favor, tente novamente." }, { status: 500 })
  }
}
