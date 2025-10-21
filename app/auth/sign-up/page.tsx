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

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/cliente`,
          data: {
            full_name: fullName,
            phone: phone,
            user_level: 10, // Default to client
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
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
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao cadastrar com Google")
      setIsLoading(false)
    }
  }

  const handleAppleSignUp = async () => {
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
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao cadastrar com Apple")
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
              <CardTitle className="text-2xl text-foreground">Cadastro</CardTitle>
              <CardDescription>Crie sua conta no Styllus</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gold/20 hover:bg-gold/5 bg-transparent"
                      onClick={handleGoogleSignUp}
                      disabled={isLoading}
                    >
                      <Chrome className="mr-2 h-4 w-4" />
                      Continuar com Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gold/20 hover:bg-gold/5 bg-transparent"
                      onClick={handleAppleSignUp}
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
                      <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com email</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-gold/20 focus:border-gold"
                    />
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
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                    {isLoading ? "Criando conta..." : "Cadastrar"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Já tem uma conta?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4 text-gold hover:text-gold/80">
                    Entrar
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
