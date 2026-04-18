import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { login } from "../services/authService"
import { useAuthStore } from "../hooks/authStore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  // ✅ auto redirect if already logged in
  useEffect(() => {
    if (!user) return

    navigate(user.role === "admin" ? "/admin" : "/dashboard", {
      replace: true,
    })
  }, [user])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      const res = await login(email, password)

      if (!res.user || !res.session) {
        alert("Invalid credentials")
        return
      }

      const role =
        res.user.user_metadata?.role === "admin"
          ? "admin"
          : "paraplanner"

      setUser({
        email: res.user.email || "",
        role,
      })

      navigate(role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      })
    } catch (err: any) {
      alert(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507] text-white">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-[#0C0C11] border border-white/10"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Welcome Back
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} setValue={setEmail} />
          <Input type="password" placeholder="Password" value={password} setValue={setPassword} />

          <button
            disabled={loading}
            className="w-full py-2.5 bg-violet-600 rounded-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-zinc-400">
          No account?{" "}
          <Link to="/register" className="text-violet-400">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

function Input({ type, placeholder, value, setValue }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10"
    />
  )
}