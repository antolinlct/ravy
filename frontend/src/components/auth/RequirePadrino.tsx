"use client"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"

export function RequirePadrino({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    async function check(showBlocking: boolean) {
      if (showBlocking) {
        setLoading(true)
        setAllowed(false)
      }

      const { data, error } = await supabase.auth.getUser()
      if (!isMounted) return

      if (error || !data?.user) {
        setAllowed(false)
        setLoading(false)
        navigate("/login", { replace: true })
        return
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_establishment")
        .select("role")
        .eq("user_id", data.user.id)

      if (!isMounted) return

      if (rolesError) {
        setAllowed(false)
        setLoading(false)
        navigate("/login", { replace: true })
        return
      }

      const isPadrino =
        roles?.some((row) => row.role === "padrino" || row.role === "is_padrino") ??
        false

      if (!isPadrino) {
        setAllowed(false)
        setLoading(false)
        navigate("/login", { replace: true })
        return
      }

      setAllowed(true)
      setLoading(false)
    }

    const showBlocking = !hasCheckedRef.current
    hasCheckedRef.current = true
    check(showBlocking)

    return () => {
      isMounted = false
    }
  }, [location.pathname])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login", { replace: true })
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [navigate])

  if (loading) return null
  if (!allowed) return null

  return <>{children}</>
}
