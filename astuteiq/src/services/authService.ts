import { supabase } from "../utils/supabase"

export type Role = "admin" | "paraplanner"

export async function register(
  name: string,
  email: string,
  password: string,
  role: Role = "paraplanner"
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  })

  if (error) throw error

  return data
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function logout() {
  await supabase.auth.signOut()
}