import { useEffect } from "react"
import { supabase } from "../utils/supabase"
import { useAuthStore } from "./authStore"

export default function useAuth() {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      const session = data.session

      if (session?.user) {
        const role =
          session.user.user_metadata?.role === "admin"
            ? "admin"
            : "paraplanner"

        setUser({
          email: session.user.email || "",
          role,
        })
      } else {
        setUser(null)
      }

      setLoading(false) // ✅ IMPORTANT
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          const role =
            session.user.user_metadata?.role === "admin"
              ? "admin"
              : "paraplanner"

          setUser({
            email: session.user.email || "",
            role,
          })
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])
}