import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scissors, Clock, DollarSign, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminServicosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 30) {
    redirect("/cliente")
  }

  // Get all services
  const { data: services } = await supabase.from("services").select("*").order("name")

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Serviços</h1>
            <p className="text-muted-foreground">Gerenciar todos os serviços oferecidos</p>
          </div>
          <Button asChild className="bg-gold hover:bg-gold/90 text-black">
            <Link href="/admin/servicos/criar">Criar Novo Serviço</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services && services.length > 0 ? (
            services.map((service) => (
              <Card key={service.id} className="border-gold/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Scissors className="h-5 w-5 text-gold" />
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Duração:
                      </span>
                      <span className="font-medium text-foreground">{service.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Preço:
                      </span>
                      <span className="font-medium text-foreground">R$ {service.price}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button asChild variant="outline" className="bg-transparent">
                      <Link href={`/admin/servicos/${service.id}`}>Ver</Link>
                    </Button>
                    <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                      <Link href={`/admin/servicos/${service.id}/editar`}>Editar</Link>
                    </Button>
                    <Button asChild variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <Link href={`/admin/servicos/${service.id}/excluir`}>
                        <Trash2 className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gold/20 col-span-3">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
                <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                  <Link href="/admin/servicos/criar">Criar Primeiro Serviço</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
