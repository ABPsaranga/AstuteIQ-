import supabase from '@/lib/supabase';
export async function loginApi(payload) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
    });
    if (error || !data.session)
        throw new Error(error?.message ?? 'Login failed.');
    const user = {
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? data.user.email ?? '',
        role: data.user.user_metadata?.role ?? 'user',
    };
    return { user, token: data.session.access_token };
}
export async function registerApi(payload) {
    const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: { data: { name: payload.name, role: 'user' } },
    });
    if (error || !data.session)
        throw new Error(error?.message ?? 'Registration failed.');
    const user = {
        id: data.user.id,
        email: data.user.email ?? '',
        name: payload.name,
        role: 'user',
    };
    return { user, token: data.session.access_token };
}
export async function forgotPasswordApi(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error)
        throw new Error(error.message);
}
export async function resetPasswordApi(_token, password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
        throw new Error(error.message);
}
