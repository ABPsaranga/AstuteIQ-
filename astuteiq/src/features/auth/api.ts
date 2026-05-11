import supabase from '@/lib/supabase'
import type { AuthUser } from './store'

/* ───────────────── TYPES ───────────────── */

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: 'user' | 'admin'
  practice?: string
}

interface AuthResponse {
  user: AuthUser
  token: string
}

/* ───────────────── LOGIN ───────────────── */

export async function loginApi(
  payload: LoginPayload,
): Promise<AuthResponse> {

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error || !data.session || !data.user) {
    throw new Error(error?.message ?? 'Login failed.')
  }

  const user: AuthUser = {
    id: data.user.id,

    email: data.user.email ?? '',

    name:
      data.user.user_metadata?.name ??
      data.user.email ??
      '',

    role:
      data.user.user_metadata?.role ??
      'user',
  }

  return {
    user,
    token: data.session.access_token,
  }
}

/* ───────────────── REGISTER ───────────────── */

export async function registerApi(
  payload: RegisterPayload,
): Promise<AuthResponse> {

  const role = payload.role ?? 'user'

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,

    password: payload.password,

    options: {
      data: {
        name: payload.name,
        role,
        practice: payload.practice ?? '',
      },
    },
  })

  if (error || !data.user) {
    throw new Error(error?.message ?? 'Registration failed.')
  }

  const user: AuthUser = {
    id: data.user.id,

    email: data.user.email ?? '',

    name: payload.name,

    role,
  }

  return {
    user,
    token: data.session?.access_token ?? '',
  }
}

/* ───────────────── FORGOT PASSWORD ───────────────── */

export async function forgotPasswordApi(
  email: string,
): Promise<void> {

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${window.location.origin}/reset-password`,
    }
  )

  if (error) {
    throw new Error(error.message)
  }
}

/* ───────────────── RESET PASSWORD ───────────────── */

export async function resetPasswordApi(
  _token: string,
  password: string,
): Promise<void> {

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    throw new Error(error.message)
  }
}