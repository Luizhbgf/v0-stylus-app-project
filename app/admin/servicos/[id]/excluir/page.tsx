"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function ExcluirServicoAdmin() {
  const [profile, setProfile] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)

    const { data: serviceData } = await supabase.from("services").select("*").eq("id", params.id).single()
    setService(serviceData)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      // Admin can delete service completely for everyone
      const { error } = await supabase.from("services").delete().eq("id", params.id)

      if (error) throw error

      toast.success("Serviço excluído com sucesso!")
      router.push("/admin/servicos")
    } catch (error: any) {
      console.error("Erro ao excluir serviço:", error)
      toast.error(error.message || "Erro ao excluir serviço")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !service) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/admin/servicos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Serviços
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Excluir Serviço</h1>
          <p className="text-muted-foreground">Confirme a exclusão do serviço</p>
        </div>

        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-foreground">
                Você está prestes a excluir o serviço: <strong className="text-red-500">{service.name}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação removerá permanentemente o serviço de TODOS os funcionários e do sistema. Esta ação não pode
                ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDelete} disabled={isLoading} variant="destructive" className="flex-1">
                {isLoading ? "Excluindo..." : "Sim, Excluir Permanentemente"}
              </Button>
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/admin/servicos">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
