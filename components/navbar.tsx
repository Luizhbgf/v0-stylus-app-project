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

  return (
    <nav className="border-b border-primary/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Styllus" width={140} height={50} className="object-contain w-28 md:w-40" />
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
                    className="border-primary/20 hover:bg-primary/5 bg-transparent font-semibold"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.full_name || user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
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
            ) : (
              <>
                <Button asChild variant="ghost" className="hover:bg-primary/5 font-semibold">
                  <Link href="/auth/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-black font-semibold shadow-lg shadow-primary/20"
                >
                  <Link href="/auth/sign-up">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {user?.id && <NotificationsBell userId={user.id} />}
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </nav>
  )
}
