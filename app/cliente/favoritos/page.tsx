import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import { RemoveFavoriteButton } from "@/components/remove-favorite-button"

export default async function FavoritosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_level < 10) {
    redirect("/auth/login")
  }

  // Get user favorites with service details
  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `
      id,
      created_at,
      service:services(*)
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/cliente" className="inline-flex items-center text-gold hover:text-gold/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Meus Favoritos</h1>
          <p className="text-muted-foreground">Serviços que você marcou como favoritos</p>
        </div>

        {favorites && favorites.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="border-gold/20 hover:border-gold/40 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-foreground">{favorite.service?.name}</CardTitle>
                    <RemoveFavoriteButton favoriteId={favorite.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{favorite.service?.description}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1 text-gold" />
                      {favorite.service?.duration} min
                    </div>
                    <div className="flex items-center text-sm font-bold text-gold">
                      <DollarSign className="h-4 w-4" />
                      {favorite.service?.price}
                    </div>
                  </div>
                  <Button asChild className="w-full bg-gold hover:bg-gold/90 text-black">
                    <Link href="/agendar">Solicitar Agendamento</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gold/20">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum favorito ainda</h3>
              <p className="text-muted-foreground mb-6">Adicione serviços aos favoritos para acessá-los rapidamente</p>
              <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                <Link href="/agendar">Explorar Serviços</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
