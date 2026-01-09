"use client"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const login = async (e: any) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return alert(error.message)

    router.push("/dashboard")
  }

  return (
    <form onSubmit={login} className="space-y-4">
      <input className="input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} />
      <button className="btn">Ingresar</button>
    </form>
  )
}
