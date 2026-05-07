import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { loginApi, forgotPasswordApi, resetPasswordApi } from './api'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const { setAuth }           = useAuthStore()
  const navigate              = useNavigate()

  async function login(email: string, password: string) {
    setLoading(true)
    try {
      const { user, token } = await loginApi({ email, password })
      setAuth(user, token)
      // Route based on role stored in Supabase user_metadata
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return { login, loading }
}

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const { setAuth }           = useAuthStore()
  const navigate              = useNavigate()

  async function register(
    name:      string,
    email:     string,
    password:  string,
    practice?: string,
    role:      string = 'user',
  ) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, practice: practice ?? '' },
        },
      })

      if (error || !data.user) throw new Error(error?.message ?? 'Registration failed.')

      const user = {
        id:       data.user.id,
        email:    data.user.email ?? '',
        name:     data.user.user_metadata?.name ?? name,
        role:     data.user.user_metadata?.role ?? role,
        practice: data.user.user_metadata?.practice ?? practice ?? '',
      }

      const token = data.session?.access_token ?? ''
      setAuth(user, token)

      // Admin → admin dashboard, Paraplanner → user dashboard
      navigate(role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return { register, loading }
}

export function useLogout() {
  const { setAuth }  = useAuthStore()
  const navigate     = useNavigate()

  function logout() {
    supabase.auth.signOut()
    // Clear auth by setting null — works regardless of store method name
    setAuth(null as any, '')
    navigate('/login')
  }

  return { logout }
}

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  async function sendReset(email: string) {
    setLoading(true)
    try {
      await forgotPasswordApi(email)
      setSent(true)
      toast.success('Reset link sent — check your email.')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return { sendReset, loading, sent }
}

export function useResetPassword() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate              = useNavigate()

  async function resetPassword(_token: string, newPassword: string) {
    setLoading(true)
    try {
      await resetPasswordApi(_token, newPassword)
      setSuccess(true)
      toast.success('Password updated.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return { resetPassword, loading, success }
}