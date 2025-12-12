"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session

      if (!session) {
        window.location.href = "/login"
        return
      }

      setAllowed(true)
      setLoading(false)
    }

    check()
  }, [])

  if (loading) return null
  if (!allowed) return null

  return <>{children}</>
}
