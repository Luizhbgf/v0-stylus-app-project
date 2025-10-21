import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    await supabase.auth.exchangeCodeForSession(code)

    // Get user profile to check level
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("user_level").eq("id", user.id).single()

      // Redirect based on user level
      if (profile) {
        if (profile.user_level >= 30) {
          return NextResponse.redirect(`${origin}/admin`)
        } else if (profile.user_level >= 20) {
          return NextResponse.redirect(`${origin}/staff`)
        }
      }
      return NextResponse.redirect(`${origin}/cliente`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
