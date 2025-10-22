"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, UserX, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function GerenciarUsuario() {
  const [profile, setProfile] = useState<any>(null)
  const [targetUser, setTargetUser] = useState<any>(null)
  const [userLevel, setUserLevel] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

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

    // Load target user
    const { data: userData } = await supabase.from("profiles").select("*").eq("id", params.id).single()
    if (userData) {
      setTargetUser(userData)
      setUserLevel(userData.user_level.toString())
      setIsActive(userData.is_active)
    }
  }

  const handleUpdateLevel = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ user_level: Number.parseInt(userLevel) })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Nível de permissão atualizado!")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar nível")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("profiles").update({ is_active: !isActive }).eq("id", params.id)

      if (error) throw error

      toast.success(isActive ? "Usuário desativado!" : "Usuário ativado!")
      setIsActive(!isActive)
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", params.id)

      if (error) throw error

      toast.success("Usuário excluído!")
      router.push("/admin/usuarios")
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir usuário")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile || !targetUser) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile} />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Usuários
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gerenciar Usuário</h1>
          <p className="text-sm md:text-base text-muted-foreground">{targetUser.email}</p>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Informações do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nome Completo</Label>
                <p className="text-foreground font-medium">{targetUser.full_name || "Não informado"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-foreground font-medium">{targetUser.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Telefone</Label>
                <p className="text-foreground font-medium">{targetUser.phone || "Não informado"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="text-foreground font-medium">{isActive ? "Ativo" : "Inativo"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Permission Level */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Nível de Permissão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userLevel">Nível de Acesso</Label>
                <Select value={userLevel} onValueChange={setUserLevel}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Cliente</SelectItem>
                    <SelectItem value="20">Staff</SelectItem>
                    <SelectItem value="30">Admin</SelectItem>
                    <SelectItem value="40">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleUpdateLevel}
                disabled={isLoading || userLevel === targetUser.user_level.toString()}
                className="w-full bg-primary hover:bg-primary/90 text-black"
              >
                Atualizar Nível
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleToggleActive}
                disabled={isLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                <UserX className="h-4 w-4 mr-2" />
                {isActive ? "Desativar Usuário" : "Ativar Usuário"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isLoading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Usuário
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta do usuário e todos os dados
                      associados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
