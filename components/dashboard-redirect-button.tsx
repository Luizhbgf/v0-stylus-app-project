"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Home } from "lucide-react"

interface DashboardRedirectButtonProps {
  userLevel: number
  className?: string
}

export function DashboardRedirectButton({ userLevel, className }: DashboardRedirectButtonProps) {
  const router = useRouter()

  const handleRedirect = () => {
    if (userLevel >= 30) {
      router.push("/admin")
    } else if (userLevel >= 20) {
      router.push("/staff")
    } else {
      router.push("/cliente")
    }
  }

  const getDashboardName = () => {
    if (userLevel >= 30) return "Admin"
    if (userLevel >= 20) return "Staff"
    return "Cliente"
  }

  return (
    <Button onClick={handleRedirect} className={className} variant="outline">
      <Home className="mr-2 h-4 w-4" />
      Ir para Dashboard {getDashboardName()}
    </Button>
  )
}
