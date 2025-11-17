import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/quiz" &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname.startsWith("/staff") || request.nextUrl.pathname.startsWith("/admin"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, staff_status, user_level")
      .eq("id", user.id)
      .single()

    if (profile) {
      // Block inactive users from staff/admin areas
      if (!profile.is_active || profile.staff_status === 'inactive') {
        const url = request.nextUrl.clone()
        url.pathname = "/cliente"
        url.searchParams.set("error", "inactive_account")
        return NextResponse.redirect(url)
      }
      
      // Ensure user has appropriate level for the area
      if (request.nextUrl.pathname.startsWith("/staff") && profile.user_level < 20) {
        const url = request.nextUrl.clone()
        url.pathname = "/cliente"
        return NextResponse.redirect(url)
      }
      
      if (request.nextUrl.pathname.startsWith("/admin") && profile.user_level < 30) {
        const url = request.nextUrl.clone()
        url.pathname = "/staff"
        return NextResponse.redirect(url)
      }
    }
  }
  // </CHANGE>

  return supabaseResponse
}
