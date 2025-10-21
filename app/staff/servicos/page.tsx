import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function StaffServicos() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile || profile.user_level < 20) redirect("/cliente")

  const { data: staffServices } = await supabase
    .from("staff_services")
    .select(
      `
      *,
      service:services(*)
    `,
    )
    .eq("staff_id", user.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Meus Serviços</h1>
            <p className="text-muted-foreground">Serviços que você oferece</p>
          </div>
          <Button asChild className="bg-gold hover:bg-gold/90 text-black">
            <Link href="/staff/servicos/adicionar">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {staffServices && staffServices.length > 0 ? (
            staffServices.map((staffService) => (
              <Card key={staffService.id} className="border-gold/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{staffService.service?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{staffService.service?.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {staffService.service?.duration} min
                        </span>
                        {staffService.service?.category && (
                          <span className="px-2 py-1 bg-gold/10 text-gold rounded text-xs">
                            {staffService.service.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gold/20">
                    <span className="text-2xl font-bold text-gold">
                      R$ {Number(staffService.service?.price).toFixed(2)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        staffService.service?.is_active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {staffService.service?.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href={`/staff/servicos/${staffService.service_id}`}>Ver Detalhes</Link>
                    </Button>
                    <Button asChild className="flex-1 bg-gold hover:bg-gold/90 text-black">
                      <Link href={`/staff/servicos/${staffService.service_id}/editar`}>Editar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20 md:col-span-2">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-gold mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
                <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                  <Link href="/staff/servicos/adicionar">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Serviço
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
