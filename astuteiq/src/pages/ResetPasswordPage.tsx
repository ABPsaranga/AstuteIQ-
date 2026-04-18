import { useState } from "react"
import { supabase } from "../utils/supabase"
import { useNavigate } from "react-router-dom"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Password updated successfully!")
      navigate("/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleUpdate} className="space-y-4 w-80">
        <h2 className="text-xl font-semibold">Set New Password</h2>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded bg-white/5 border border-white/10"
        />

        <button className="w-full py-2 bg-violet-600 rounded">
          Update Password
        </button>
      </form>
    </div>
  )
}