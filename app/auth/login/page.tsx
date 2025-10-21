"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Chrome, Apple } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Get user profile to check level
      const { data: profile } = await supabase.from("profiles").select("user_level").eq("id", data.user.id).single()

      // Redirect based on user level
      if (profile) {
        if (profile.user_level >= 30) {
          router.push("/admin")
        } else if (profile.user_level >= 20) {
          router.push("/staff")
        } else {
          router.push("/cliente")
        }
      } else {
        router.push("/cliente")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        // Check if it's a provider not enabled error
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          throw new Error(
            "Login com Google não está configurado. Por favor, habilite o provedor Google no painel do Supabase (Authentication > Providers).",
          )
        }
        throw error
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login com Google")
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        // Check if it's a provider not enabled error
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          throw new Error(
            "Login com Apple não está configurado. Por favor, habilite o provedor Apple no painel do Supabase (Authentication > Providers).",
          )
        }
        throw error
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login com Apple")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Styllus Logo" width={200} height={80} className="object-contain" />
          </div>
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Login</CardTitle>
              <CardDescription>Entre com seu email e senha para acessar sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gold/20 hover:bg-gold/5 bg-transparent"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <Chrome className="mr-2 h-4 w-4" />
                      Continuar com Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gold/20 hover:bg-gold/5 bg-transparent"
                      onClick={handleAppleLogin}
                      disabled={isLoading}
                    >
                      <Apple className="mr-2 h-4 w-4" />
                      Continuar com Apple
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gold/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continue com email</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gold/20 focus:border-gold"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gold/20 focus:border-gold"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Não tem uma conta?{" "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4 text-gold hover:text-gold/80">
                    Cadastre-se
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
