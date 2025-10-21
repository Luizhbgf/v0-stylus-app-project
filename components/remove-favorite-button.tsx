"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function RemoveFavoriteButton({ favoriteId }: { favoriteId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleRemove = async () => {
    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId)

    if (error) {
      toast.error("Erro ao remover favorito")
      return
    }

    toast.success("Removido dos favoritos")
    router.refresh()
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleRemove} className="text-gold hover:text-gold/80">
      <Heart className="h-5 w-5 fill-current" />
    </Button>
  )
}
