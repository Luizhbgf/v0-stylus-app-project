import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Clock, DollarSign, Tag } from "lucide-react"
import { DeleteServiceButton } from "@/components/delete-service-button"

export default async function ServiceDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  const { data: service } = await supabase.from("services").select("*").eq("id", params.id).single()

  if (!service) {
    redirect("/staff/servicos")
  }

  // Check if staff has this service
  const { data: staffService } = await supabase
    .from("staff_services")
    .select("*")
    .eq("staff_id", user.id)
    .eq("service_id", params.id)
    .single()

  if (!staffService && profile.user_level < 30) {
    redirect("/staff/servicos")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link
            href="/staff/servicos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Serviços
          </Link>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{service.name}</CardTitle>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    service.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {service.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h3>
              <p className="text-foreground">{service.description || "Sem descrição"}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Preço</span>
                </div>
                <p className="text-2xl font-bold text-gold">R$ {Number(service.price).toFixed(2)}</p>
              </div>

              <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Duração</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{service.duration} min</p>
              </div>

              {service.category && (
                <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm">Categoria</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{service.category}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button asChild className="flex-1 bg-gold hover:bg-gold/90 text-black">
                <Link href={`/staff/servicos/${params.id}/editar`}>Editar Serviço</Link>
              </Button>
              <DeleteServiceButton serviceId={params.id} redirectTo="/staff/servicos" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
