"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsBell } from "@/components/notifications-bell"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NavbarProps {
  user?: {
    id?: string
    email?: string
    full_name?: string
    user_level?: number
  }
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getDashboardLink = () => {
    if (!user) return "/auth/login"
    if (user.user_level && user.user_level >= 30) return "/admin"
    if (user.user_level && user.user_level >= 20) return "/staff"
    return "/cliente"
  }

  return (
    <nav className="border-b border-gold/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Styllus" width={150} height={60} className="object-contain" />
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user?.id && <NotificationsBell userId={user.id} />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gold/20 bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    {user.full_name || user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>Dashboard</Link>
                  </DropdownMenuItem>
                  {user.user_level && user.user_level >= 20 && (
                    <DropdownMenuItem asChild>
                      <Link href="/staff/solicitacoes">Solicitações</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="outline" className="border-gold/20 hover:bg-gold/10 bg-transparent">
                  <Link href="/auth/login">Entrar</Link>
                </Button>
                <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                  <Link href="/auth/sign-up">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
