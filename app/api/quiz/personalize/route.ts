import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { staffId, userAnswers, quizQuestions, selectedServices, referenceImagesCount, additionalNotes } =
      await req.json()

    const supabase = await createClient()

    const { data: staff } = await supabase.from("profiles").select("*").eq("id", staffId).single()

    if (!staff) {
      return Response.json({ error: "Staff member not found" }, { status: 404 })
    }

    const userPreferences = quizQuestions
      .map((q: any, index: number) => {
        const answer = Object.values(userAnswers)[index]
        return `${q.question}: ${answer}`
      })
      .join("\n")

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Você é um assistente especializado em beleza e estética que ajuda clientes a encontrarem o profissional ideal.

Com base no perfil do profissional e nas preferências detalhadas do cliente, crie uma mensagem personalizada e calorosa explicando por que este profissional é perfeito para o cliente.

PERFIL DO PROFISSIONAL:
Nome: ${staff.full_name}
Especialidades: ${staff.specialties?.join(", ") || "Profissional versátil"}
Bio: ${staff.bio || "Profissional experiente e dedicado"}

PREFERÊNCIAS DO CLIENTE (Quiz):
${userPreferences}

${selectedServices ? `SERVIÇOS DE INTERESSE ESPECÍFICO:\n${selectedServices}\n` : ""}

${referenceImagesCount > 0 ? `IMAGENS DE REFERÊNCIA: Cliente enviou ${referenceImagesCount} foto(s) de referência do estilo desejado.\n` : ""}

${additionalNotes ? `OBSERVAÇÕES DO CLIENTE:\n${additionalNotes}\n` : ""}

Crie uma mensagem de 2-3 parágrafos que:
1. Explique por que ${staff.full_name} é a escolha perfeita com base nas preferências e necessidades específicas do cliente
2. Destaque as especialidades e experiências relevantes
3. Se o cliente mencionou serviços específicos ou enviou fotos, comente sobre a capacidade do profissional de atender essas necessidades
4. Seja acolhedora, profissional, entusiasmada e personalizada
5. Termine com um convite caloroso para agendar

Use um tom amigável e brasileiro. Não use saudações ou despedidas, apenas o corpo da mensagem.`,
    })

    return Response.json({ message: text })
  } catch (error: any) {
    console.error("[v0] Error generating personalized message:", error)
    return Response.json({ error: error.message || "Failed to generate personalized message" }, { status: 500 })
  }
}
