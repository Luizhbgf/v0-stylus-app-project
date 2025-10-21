import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Clock, DollarSign, Tag, Users } from "lucide-react"
import { DeleteServiceButton } from "@/components/delete-service-button"

export default async function AdminServiceDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 30) redirect("/cliente")

  const { data: service } = await supabase.from("services").select("*").eq("id", params.id).single()

  if (!service) {
    redirect("/admin/servicos")
  }

  // Get staff members offering this service
  const { data: staffServices } = await supabase
    .from("staff_services")
    .select("*, staff:profiles(*)")
    .eq("service_id", params.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin/servicos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Serviços
          </Link>
        </div>

        <div className="grid gap-6">
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
                  <Link href={`/admin/servicos/${params.id}/editar`}>Editar Serviço</Link>
                </Button>
                <DeleteServiceButton serviceId={params.id} redirectTo="/admin/servicos" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gold" />
                Profissionais que oferecem este serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffServices && staffServices.length > 0 ? (
                <div className="space-y-3">
                  {staffServices.map((ss: any) => (
                    <div key={ss.id} className="flex items-center justify-between p-3 bg-gold/5 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{ss.staff?.full_name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{ss.staff?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum profissional oferece este serviço ainda</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
