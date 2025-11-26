import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 30) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  // Get current month data
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Get appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      *,
      service:services(*),
      staff:staff_id(full_name)
    `,
    )
    .gte("appointment_date", firstDayOfMonth.toISOString())
    .lte("appointment_date", lastDayOfMonth.toISOString())

  const completedAppointments = appointments?.filter((a) => a.status === "completed") || []

  // Calculate revenue
  const totalRevenue = completedAppointments.reduce((sum, a) => {
    const price = a.custom_price || a.service?.price || 0
    return sum + Number(price)
  }, 0)

  // Get feedback
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .gte("created_at", firstDayOfMonth.toISOString())
    .lte("created_at", lastDayOfMonth.toISOString())

  const avgRating =
    feedback && feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

  // Top services
  const serviceStats: Record<string, { count: number; revenue: number }> = {}
  completedAppointments.forEach((a) => {
    const serviceName = a.service?.name || "Desconhecido"
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = { count: 0, revenue: 0 }
    }
    serviceStats[serviceName].count++
    serviceStats[serviceName].revenue += Number(a.custom_price || a.service?.price || 0)
  })

  const topServices = Object.entries(serviceStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3)
    .map(([name, stats]) => ({ name, ...stats }))

  // Pending appointments
  const pendingAppointments = appointments?.filter((a) => a.status === "pending")?.length || 0

  const summary = {
    period: "Mês atual",
    totalAppointments: completedAppointments.length,
    totalRevenue: totalRevenue.toFixed(2),
    avgRating: avgRating.toFixed(1),
    pendingAppointments,
    topServices,
    totalFeedback: feedback?.length || 0,
  }

  return NextResponse.json(summary)
}
