import { createServerClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    console.log("[v0] Admin assistant API called")
    const { message, metrics } = await req.json()

    console.log("[v0] Message:", message)
    console.log("[v0] Metrics:", metrics)

    const supabase = createServerClient()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [appointmentsResult, servicesResult, staffResult, clientsResult] = await Promise.allSettled([
      supabase
        .from("appointments")
        .select("*, services(*), profiles!appointments_staff_id_fkey(*)")
        .gte("appointment_date", thirtyDaysAgo),
      supabase.from("services").select("*"),
      supabase.from("profiles").select("*").gte("user_level", 20),
      supabase.from("profiles").select("*").eq("user_level", 10),
    ])

    const appointments = appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data || [] : []
    const services = servicesResult.status === "fulfilled" ? servicesResult.value.data || [] : []
    const staff = staffResult.status === "fulfilled" ? staffResult.value.data || [] : []
    const clients = clientsResult.status === "fulfilled" ? clientsResult.value.data || [] : []

    console.log("[v0] Appointments data:", appointments.length)
    console.log("[v0] Payments processed:", appointments.filter((a) => a.status === "completed").length)

    const completedAppointments = appointments.filter((apt) => apt.status === "completed")
    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      const price = apt.custom_price || apt.services?.price || 0
      return sum + price
    }, 0)

    const totalAppointments = appointments.length
    const totalClients = clients.length
    const totalStaff = staff.length

    const serviceRevenue = new Map<string, { name: string; revenue: number; count: number }>()
    completedAppointments.forEach((apt) => {
      const serviceName = apt.services?.name || "Serviço desconhecido"
      const serviceId = apt.service_id || "unknown"
      const price = apt.custom_price || apt.services?.price || 0

      if (!serviceRevenue.has(serviceId)) {
        serviceRevenue.set(serviceId, { name: serviceName, revenue: 0, count: 0 })
      }

      const current = serviceRevenue.get(serviceId)!
      current.revenue += price
      current.count += 1
    })

    const topServices = Array.from(serviceRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const staffPerformance = new Map<string, { name: string; revenue: number; appointments: number }>()
    completedAppointments.forEach((apt) => {
      const staffId = apt.staff_id
      const staffName = apt.profiles?.full_name || "Staff desconhecido"
      const price = apt.custom_price || apt.services?.price || 0

      if (!staffPerformance.has(staffId)) {
        staffPerformance.set(staffId, { name: staffName, revenue: 0, appointments: 0 })
      }

      const current = staffPerformance.get(staffId)!
      current.revenue += price
      current.appointments += 1
    })

    const topStaff = Array.from(staffPerformance.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    let response = ""
    const messageLower = message.toLowerCase()

    if (messageLower.includes("desempenho") || messageLower.includes("como está")) {
      const completionRate =
        totalAppointments > 0 ? ((completedAppointments.length / totalAppointments) * 100).toFixed(1) : "0"

      response = `**Análise de Desempenho (Últimos 30 dias):**

📊 **Visão Geral:**
- Receita Total: R$ ${totalRevenue.toFixed(2)}
- Agendamentos: ${totalAppointments} (${completedAppointments.length} concluídos)
- Taxa de Conclusão: ${completionRate}%
- Clientes Ativos: ${totalClients}
- Equipe: ${totalStaff} profissionais

${
  topServices.length > 0
    ? `
🏆 **Top Serviços:**
${topServices.map((s, i) => `${i + 1}. ${s.name}: R$ ${s.revenue.toFixed(2)} (${s.count} atendimentos)`).join("\n")}
`
    : ""
}

${
  topStaff.length > 0
    ? `
👥 **Performance da Equipe:**
${topStaff.map((s, i) => `${i + 1}. ${s.name}: R$ ${s.revenue.toFixed(2)} (${s.appointments} atendimentos)`).join("\n")}
`
    : ""
}

✅ **Sucessos:** ${completionRate}% de taxa de conclusão ${Number.parseFloat(completionRate) >= 80 ? "é excelente!" : "pode melhorar."}
${totalRevenue > 0 ? `💡 **Oportunidade:** Foque nos serviços mais rentáveis para maximizar receita.` : ""}`
    } else if (messageLower.includes("receita") || messageLower.includes("ganho")) {
      const avgPerAppointment =
        completedAppointments.length > 0 ? (totalRevenue / completedAppointments.length).toFixed(2) : "0.00"

      response = `**Análise de Receita (Últimos 30 dias):**

💰 **Receita Total:** R$ ${totalRevenue.toFixed(2)}
📊 **Ticket Médio:** R$ ${avgPerAppointment} por atendimento
✅ **Atendimentos Pagos:** ${completedAppointments.length}

${
  topServices.length > 0
    ? `
🏆 **Serviços Mais Rentáveis:**
${topServices.map((s, i) => `${i + 1}. ${s.name}: R$ ${s.revenue.toFixed(2)}`).join("\n")}

💡 **Recomendação:** Promova os serviços mais rentáveis para aumentar seu faturamento.
`
    : "Adicione serviços para começar a faturar!"
}`
    } else if (messageLower.includes("oportunidade") || messageLower.includes("crescimento")) {
      response = `**Oportunidades de Crescimento:**

${
  totalAppointments > completedAppointments.length
    ? `
⚠️ **Reduzir Cancelamentos:** Você tem ${totalAppointments - completedAppointments.length} agendamentos não concluídos. Implemente lembretes automáticos.
`
    : ""
}

${
  totalClients > 0
    ? `
📈 **Fidelização:** Com ${totalClients} clientes, crie programas de fidelidade e planos mensais para receita recorrente.
`
    : ""
}

${
  topServices.length > 0
    ? `
💡 **Upsell:** Promova serviços complementares aos clientes dos top ${topServices.length} serviços.
`
    : ""
}

🎯 **Marketing Digital:** Invista em redes sociais mostrando resultados do seu trabalho.
📱 **Sistema de Agendamento:** Facilite o agendamento online para atrair mais clientes.
🎓 **Capacitação:** Invista em cursos para sua equipe oferecer novos serviços.`
    } else if (messageLower.includes("serviço") || messageLower.includes("rentável")) {
      response = `**Análise de Serviços:**

${
  topServices.length > 0
    ? `
🏆 **Top 5 Serviços Mais Rentáveis:**
${topServices
  .map(
    (s, i) => `
${i + 1}. **${s.name}**
   - Receita: R$ ${s.revenue.toFixed(2)}
   - Atendimentos: ${s.count}
   - Ticket Médio: R$ ${(s.revenue / s.count).toFixed(2)}
`,
  )
  .join("\n")}

💡 **Recomendação:** Foque em promover esses serviços e treine sua equipe para maximizar a qualidade.
`
    : "Nenhum serviço concluído nos últimos 30 dias. Comece a agendar atendimentos!"
}

📊 **Total de Serviços Cadastrados:** ${services.length}`
    } else {
      response = `**Resumo do Negócio:**

Baseado nos últimos 30 dias:
- 💰 Receita: R$ ${totalRevenue.toFixed(2)}
- 📅 Agendamentos: ${totalAppointments}
- ✅ Concluídos: ${completedAppointments.length}
- 👥 Clientes: ${totalClients}

Como posso ajudá-lo? Pergunte sobre:
- Desempenho geral do negócio
- Análise de receita detalhada
- Oportunidades de crescimento
- Serviços mais rentáveis`
    }

    console.log("[v0] Response generated successfully")
    return Response.json({ response })
  } catch (error) {
    console.error("[v0] Error in admin-assistant:", error)
    return Response.json(
      {
        error: "Erro ao processar mensagem",
        response: "Desculpe, ocorreu um erro ao analisar os dados. Por favor, tente novamente em alguns instantes.",
      },
      { status: 500 },
    )
  }
}
