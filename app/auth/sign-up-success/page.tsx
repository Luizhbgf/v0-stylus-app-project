import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Styllus Logo" width={200} height={80} className="object-contain" />
          </div>
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Cadastro realizado!</CardTitle>
              <CardDescription>Verifique seu email para confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Você se cadastrou com sucesso! Por favor, verifique seu email para confirmar sua conta antes de fazer
                login.
              </p>
              <Button asChild className="w-full bg-gold hover:bg-gold/90 text-black">
                <Link href="/auth/login">Ir para Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
