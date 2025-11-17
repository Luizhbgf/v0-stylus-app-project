import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'

export const revalidate = 0

export default async function StaffFinanceiro() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  console.log("[v0] ========== FINANCEIRO ==========")
  console.log("[v0] User ID:", user.id)
  console.log("[v0] Buscando appointments do staff_id:", user.id)

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      status,
      payment_status,
      payment_method,
      staff_id,
      service:services(name, price),
      client:profiles!client_id(full_name),
      sporadic_client_name,
      client_type
    `,
    )
    .eq("staff_id", user.id)
    .order("appointment_date", { ascending: false })

  if (appointmentsError) {
    console.error("[v0] ❌ ERRO ao buscar appointments:", appointmentsError)
  }

  console.log("[v0] ✅ Total de appointments encontrados:", appointments?.length || 0)
  
  appointments?.forEach((apt, index) => {
    console.log(`[v0] --- Appointment ${index + 1} ---`)
    console.log(`[v0] ID: ${apt.id}`)
    console.log(`[v0] Status: ${apt.status}`)
    console.log(`[v0] Payment Status: ${apt.payment_status}`)
    console.log(`[v0] Staff ID: ${apt.staff_id}`)
    console.log(`[v0] Service: ${apt.service?.name} - R$ ${apt.service?.price}`)
    console.log(`[v0] Client Type: ${apt.client_type}`)
    console.log(`[v0] Client Name: ${apt.client_type === 'sporadic' ? apt.sporadic_client_name : apt.client?.full_name}`)
  })

  const earnings: any[] = []

  appointments?.forEach((apt) => {
    console.log(`[v0] 🔄 Processando appointment ${apt.id}`)
    
    if (apt.status === "cancelled") {
      console.log(`[v0] ⏭️ Pulando appointment ${apt.id} - cancelado`)
      return
    }

    const isPaid = apt.payment_status === "paid" || apt.status === "completed"
    console.log(`[v0] 💰 isPaid: ${isPaid} (payment_status: ${apt.payment_status}, status: ${apt.status})`)

    const clientName =
      apt.client_type === "sporadic" ? apt.sporadic_client_name : apt.client?.full_name || "Cliente não identificado"

    const earning = {
      id: apt.id,
      type: "appointment",
      amount: apt.service?.price || 0,
      payment_date: apt.appointment_date,
      payment_method: apt.payment_method || "Não informado",
      status: isPaid ? "paid" : "pending",
      service_name: apt.service?.name || "Serviço não especificado",
      client_name: clientName,
      notes: `${apt.service?.name || "Serviço"} - ${clientName}`,
    }
    
    console.log(`[v0] ✅ Adicionado ao earnings:`, earning)
    earnings.push(earning)
  })

  console.log("[v0] 📊 Total de earnings processados:", earnings.length)
  console.log("[v0] 💵 Earnings pagos:", earnings.filter((e) => e.status === "paid").length)
  console.log("[v0] ⏳ Earnings pendentes:", earnings.filter((e) => e.status === "pending").length)

  // Sort by date
  earnings.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())

  const totalPaid = earnings.filter((e) => e.status === "paid").reduce((sum, e) => sum + Number(e.amount), 0)
  const totalPending = earnings.filter((e) => e.status === "pending").reduce((sum, e) => sum + Number(e.amount), 0)

  console.log("[v0] 💰 Total Pago: R$", totalPaid.toFixed(2))
  console.log("[v0] ⏳ Total Pendente: R$", totalPending.toFixed(2))

  // Calculate this month earnings
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyEarnings = earnings
    .filter((e) => new Date(e.payment_date) >= firstDayOfMonth && e.status === "paid")
    .reduce((sum, e) => sum + Number(e.amount), 0)

  console.log("[v0] 📅 Ganhos do mês: R$", monthlyEarnings.toFixed(2))
  console.log("[v0] ========== FIM ==========")

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe seus ganhos e pagamentos</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Calendar className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R$ {monthlyEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Histórico de Pagamentos</h2>
          <div className="grid gap-4">
            {earnings && earnings.length > 0 ? (
              earnings.map((earning) => (
                <Card key={`${earning.type}-${earning.id}`} className="border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-semibold text-foreground mb-1">
                          R$ {Number(earning.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          Data: {new Date(earning.payment_date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">Cliente: {earning.client_name}</p>
                        <p className="text-sm text-muted-foreground mb-1">Serviço: {earning.service_name}</p>
                        {earning.payment_method && (
                          <p className="text-sm text-muted-foreground">Método: {earning.payment_method}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            earning.status === "paid"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {earning.status === "paid"
                            ? "Pago"
                            : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gold/20">
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-gold mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
