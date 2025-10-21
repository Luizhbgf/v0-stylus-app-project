"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogOut, Bell, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface MobileNavProps {
  user?: {
    id?: string
    email?: string
    full_name?: string
    user_level?: number
  }
}

export function MobileNav({ user }: MobileNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getProfileLink = () => {
    if (!user) return "/auth/login"
    if (user.user_level && user.user_level >= 30) return "/admin/perfil/editar"
    if (user.user_level && user.user_level >= 20) return "/staff/perfil/editar"
    return "/cliente/perfil/editar"
  }

  const getConfigLink = () => {
    if (!user) return "/auth/login"
    if (user.user_level && user.user_level >= 30) return "/admin/configuracoes"
    if (user.user_level && user.user_level >= 20) return "/staff/configuracoes"
    return "/cliente/configuracoes"
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-2">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name || "Usuário"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={getProfileLink()} className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Meu Perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={getConfigLink()} className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Link>
        </DropdownMenuItem>

        {user.id && (
          <DropdownMenuItem asChild>
            <Link href="/cliente/notificacoes" className="cursor-pointer">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </Link>
          </DropdownMenuItem>
        )}

        {user.user_level && user.user_level >= 20 && (
          <DropdownMenuItem asChild>
            <Link href="/staff/solicitacoes" className="cursor-pointer">
              Solicitações
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
