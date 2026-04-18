import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { register } from "../services/authService"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  async function handleSubmit(e: any) {
    e.preventDefault()

    try {
      await register(name, email, password, "paraplanner")

      alert("Registered successfully. Please login.")
      navigate("/login")
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507] text-white">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 rounded-2xl bg-[#0C0C11] border border-white/10"
      >
        <h2 className="text-xl mb-6">Register</h2>

        <Input placeholder="Name" value={name} setValue={setName} />
        <Input placeholder="Email" value={email} setValue={setEmail} />
        <Input type="password" placeholder="Password" value={password} setValue={setPassword} />

        <button className="w-full py-2 bg-violet-600 rounded-lg mt-3">
          Register
        </button>

        <p className="text-sm mt-4 text-zinc-400">
          Already have account?{" "}
          <Link to="/login" className="text-violet-400">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}

function Input({ placeholder, value, setValue, type = "text" }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full px-4 py-2 mb-3 rounded-lg bg-white/5 border border-white/10"
    />
  )
}