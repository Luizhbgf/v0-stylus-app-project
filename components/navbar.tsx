"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsBell } from "@/components/notifications-bell"
import { MobileNav } from "@/components/mobile-nav"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User, LayoutDashboard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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
    router.refresh()
  }

  const getDashboardLink = () => {
    if (!user) return "/auth/login"
    if (user.user_level && user.user_level >= 30) return "/admin"
    if (user.user_level && user.user_level >= 20) return "/staff"
    return "/cliente"
  }

  const getProfileLink = () => {
    if (!user) return "/auth/login"
    if (user.user_level && user.user_level >= 30) return "/admin/perfil/editar"
    if (user.user_level && user.user_level >= 20) return "/staff/perfil/editar"
    return "/cliente/perfil/editar"
  }

  return (
    <nav className="border-b border-primary/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-all duration-300 hover:scale-105">
            <Image src="/logo.png" alt="Styllus" width={160} height={60} className="object-contain w-32 md:w-44" />
          </Link>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user?.id && <NotificationsBell userId={user.id} />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/5 bg-transparent font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.full_name || user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer hover:bg-primary/5 transition-colors">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink()} className="cursor-pointer hover:bg-primary/5 transition-colors">
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  {user.user_level && user.user_level >= 20 && (
                    <DropdownMenuItem asChild>
                      <Link href="/staff/solicitacoes" className="cursor-pointer hover:bg-primary/5 transition-colors">
                        Solicitações
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hover:bg-primary/5 font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Link href="/auth/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-black font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Link href="/auth/sign-up">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggle />

            {user ? (
              <>
                {/* Dashboard button */}
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 transition-all duration-200 hover:scale-110"
                >
                  <Link href={getDashboardLink()}>
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>

                {/* Profile/Menu dropdown */}
                <MobileNav user={user} />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/5 font-semibold h-9 px-3 transition-all duration-200 hover:scale-105"
                >
                  <Link href="/auth/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-black font-semibold h-9 px-3 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
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
