"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login")
    })
  }, [])

  return <h1 className="text-2xl p-8">Bienvenido al Dashboard</h1>
}
