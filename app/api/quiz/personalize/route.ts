import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { staffId, userAnswers, quizQuestions } = await req.json()

    const supabase = await createClient()

    // Get staff member details
    const { data: staff } = await supabase.from("profiles").select("*").eq("id", staffId).single()

    if (!staff) {
      return Response.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Create a summary of user preferences based on answers
    const userPreferences = quizQuestions
      .map((q: any, index: number) => {
        const answer = Object.values(userAnswers)[index]
        return `${q.question}: ${answer}`
      })
      .join("\n")

    // Generate personalized recommendation using AI
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Você é um assistente especializado em beleza e estética que ajuda clientes a encontrarem o profissional ideal.

Com base no perfil do profissional e nas preferências do cliente, crie uma mensagem personalizada e calorosa explicando por que este profissional é perfeito para o cliente.

PERFIL DO PROFISSIONAL:
Nome: ${staff.full_name}
Especialidades: ${staff.specialties?.join(", ") || "Não especificadas"}
Bio: ${staff.bio || "Profissional experiente"}
Qualificações: ${staff.qualifications?.map((q: any) => q.title || q).join(", ") || "Não especificadas"}

PREFERÊNCIAS DO CLIENTE:
${userPreferences}

Crie uma mensagem de 2-3 parágrafos que:
1. Explique por que ${staff.full_name} é a escolha perfeita com base nas preferências do cliente
2. Destaque as especialidades e qualificações relevantes
3. Seja acolhedora, profissional e entusiasmada
4. Termine com um convite para agendar

Use um tom amigável e brasileiro. Não use saudações ou despedidas, apenas o corpo da mensagem.`,
    })

    return Response.json({ message: text })
  } catch (error: any) {
    console.error("[v0] Error generating personalized message:", error)
    return Response.json({ error: error.message || "Failed to generate personalized message" }, { status: 500 })
  }
}
