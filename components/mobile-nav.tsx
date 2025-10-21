"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MobileNavProps {
  user?: {
    id?: string
    email?: string
    full_name?: string
    user_level?: number
  }
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
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
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-background/95 backdrop-blur-lg" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-card border-l border-primary/10 shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary/10">
                <Image src="/logo.png" alt="Styllus" width={140} height={50} className="object-contain" />
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Menu items */}
              <div className="flex-1 overflow-y-auto p-6">
                <nav className="space-y-4">
                  {user ? (
                    <>
                      <div className="pb-4 border-b border-primary/10">
                        <p className="text-sm text-muted-foreground mb-1">Bem-vindo,</p>
                        <p className="font-semibold text-foreground">{user.full_name || user.email?.split("@")[0]}</p>
                      </div>

                      <Link
                        href={getDashboardLink()}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <span className="font-medium">Dashboard</span>
                      </Link>

                      {user.user_level && user.user_level >= 20 && (
                        <Link
                          href="/staff/solicitacoes"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-4 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <span className="font-medium">Solicitações</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-4 rounded-lg hover:bg-destructive/5 transition-colors w-full text-left text-destructive"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Sair</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={() => setIsOpen(false)}
                        className="block p-4 rounded-lg hover:bg-primary/5 transition-colors font-medium text-center"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/auth/sign-up"
                        onClick={() => setIsOpen(false)}
                        className="block p-4 rounded-lg bg-primary hover:bg-primary/90 transition-colors font-semibold text-center text-black"
                      >
                        Cadastrar
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
