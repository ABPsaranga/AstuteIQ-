import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { loginApi, registerApi, forgotPasswordApi, resetPasswordApi } from './api';
import supabase from '../../lib/supabase';
import toast from 'react-hot-toast';
/* ───────────────── LOGIN ───────────────── */
export function useLogin() {
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();
    async function login(email, password) {
        setLoading(true);
        try {
            const { user, token } = await loginApi({ email, password });
            setAuth(user, token);
            toast.success('Welcome back!');
            // Route by role
            if (user.role === 'admin') {
                navigate('/admin');
            }
            else {
                navigate('/dashboard');
            }
        }
        catch (err) {
            toast.error(err.message ?? 'Login failed.');
        }
        finally {
            setLoading(false);
        }
    }
    return { login, loading };
}
/* ───────────────── REGISTER ───────────────── */
export function useRegister() {
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();
    async function register(name, email, password, practice = '', role = 'user') {
        setLoading(true);
        try {
            const { user, token } = await registerApi({
                name,
                email,
                password,
                practice,
                role: role,
            });
            setAuth(user, token);
            toast.success('Account created successfully.');
            // ✅ Navigate by role
            if (user.role === 'admin') {
                navigate('/admin');
            }
            else {
                navigate('/dashboard');
            }
        }
        catch (err) {
            toast.error(err.message ?? 'Registration failed.');
        }
        finally {
            setLoading(false);
        }
    }
    return { register, loading };
}
/* ───────────────── LOGOUT ───────────────── */
export function useLogout() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();
    async function logout() {
        await supabase.auth.signOut();
        setAuth(null, '');
        navigate('/login');
    }
    return { logout };
}
/* ───────────────── FORGOT PASSWORD ───────────────── */
export function useForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    async function sendReset(email) {
        setLoading(true);
        try {
            await forgotPasswordApi(email);
            setSent(true);
            toast.success('Reset link sent.');
        }
        catch (err) {
            toast.error(err.message ?? 'Request failed.');
        }
        finally {
            setLoading(false);
        }
    }
    return { sendReset, loading, sent };
}
/* ───────────────── RESET PASSWORD ───────────────── */
export function useResetPassword() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    async function resetPassword(token, newPassword) {
        setLoading(true);
        try {
            await resetPasswordApi(token, newPassword);
            setSuccess(true);
            toast.success('Password updated.');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        }
        catch (err) {
            toast.error(err.message ?? 'Reset failed.');
        }
        finally {
            setLoading(false);
        }
    }
    return { resetPassword, loading, success };
}
