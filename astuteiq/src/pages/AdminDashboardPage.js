import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Users, FileSearch, TrendingUp, AlertTriangle, UserPlus, Activity, Shield, Clock, } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import ActivityChart from '../components/ActivityChart';
import InviteUserModal from '../components/InviteUserModal';
import RoleGuard from '../components/RoleGuard';
import apiClient from '../lib/api';
import { useReviewStore } from '../store/liveReviewStore';
export default function AdminDashboardPage() {
    const [showInvite, setShowInvite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalReviews: 0,
        completedReviews: 0,
        failedReviews: 0,
        processingReviews: 0,
        avgScore: 0,
    });
    const { reviews: liveReviews, lastUpdated } = useReviewStore();
    async function loadDashboard() {
        try {
            setLoading(true);
            // reviews
            const reviewRes = await apiClient.get('/api/reviews/history?page=1&limit=1000');
            // users
            let usersRes = { data: [] };
            try {
                usersRes = await apiClient.get('/api/admin/users');
            }
            catch {
                //
            }
            const backendReviews = reviewRes.data?.reviews ?? [];
            const merged = new Map();
            backendReviews.forEach((r) => merged.set(r.id, r));
            liveReviews.forEach((r) => merged.set(r.id, r));
            const allReviews = Array.from(merged.values());
            const completed = allReviews.filter((r) => r.status === 'complete');
            const failed = allReviews.filter((r) => r.status === 'failed');
            const processing = allReviews.filter((r) => r.status === 'processing');
            const avgScore = completed.length
                ? Math.round(completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length)
                : 0;
            setStats({
                totalUsers: usersRes.data?.length ?? 0,
                totalReviews: allReviews.length,
                completedReviews: completed.length,
                failedReviews: failed.length,
                processingReviews: processing.length,
                avgScore,
            });
            // build top users
            const grouped = new Map();
            allReviews.forEach((review) => {
                const email = review.userEmail ??
                    review.email ??
                    'unknown@example.com';
                const existing = grouped.get(email);
                if (!existing) {
                    grouped.set(email, {
                        id: email,
                        name: review.userName ??
                            review.name ??
                            email.split('@')[0],
                        email,
                        reviews: 1,
                        avgScore: review.score ?? 0,
                        lastActive: review.createdAt,
                    });
                }
                else {
                    existing.reviews += 1;
                    existing.avgScore =
                        Math.round((existing.avgScore +
                            (review.score ?? 0)) /
                            2);
                    if (new Date(review.createdAt).getTime() >
                        new Date(existing.lastActive ??
                            0).getTime()) {
                        existing.lastActive =
                            review.createdAt;
                    }
                }
            });
            const topUsers = Array.from(grouped.values())
                .sort((a, b) => b.reviews - a.reviews)
                .slice(0, 10);
            setUsers(topUsers);
        }
        catch (err) {
            console.error('Admin dashboard error:', err);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadDashboard();
        const interval = setInterval(() => {
            loadDashboard();
        }, 15000);
        return () => clearInterval(interval);
    }, [lastUpdated]);
    const systemHealth = useMemo(() => {
        if (!stats.totalReviews)
            return 'Healthy';
        const failureRate = (stats.failedReviews /
            stats.totalReviews) *
            100;
        if (failureRate >= 20)
            return 'Critical';
        if (failureRate >= 10)
            return 'Warning';
        return 'Healthy';
    }, [stats]);
    return (_jsx(RoleGuard, { roles: "admin", children: _jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-start justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Admin Dashboard" }), _jsx("p", { className: "page-sub", children: "Real-time platform analytics, reviews, user activity and operational monitoring." })] }), _jsxs("button", { onClick: () => setShowInvite(true), className: "btn-primary", children: [_jsx(UserPlus, { size: 14 }), "Invite user"] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4", children: [_jsx(StatCard, { label: "Total users", value: loading
                                ? '...'
                                : stats.totalUsers, icon: Users }), _jsx(StatCard, { label: "Total reviews", value: loading
                                ? '...'
                                : stats.totalReviews, icon: FileSearch, variant: "success" }), _jsx(StatCard, { label: "Avg score", value: loading
                                ? '...'
                                : `${stats.avgScore}%`, icon: TrendingUp, variant: "success" }), _jsx(StatCard, { label: "Failed reviews", value: loading
                                ? '...'
                                : stats.failedReviews, icon: AlertTriangle, variant: "danger" }), _jsx(StatCard, { label: "Processing", value: loading
                                ? '...'
                                : stats.processingReviews, icon: Clock, variant: "warning" }), _jsx(StatCard, { label: "System health", value: systemHealth, icon: Shield, variant: systemHealth ===
                                'Healthy'
                                ? 'success'
                                : systemHealth ===
                                    'Warning'
                                    ? 'warning'
                                    : 'danger' })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Platform activity" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Live review volume and scoring trends." })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-[#2DD4A0]", children: [_jsx(Activity, { size: 12, className: "animate-pulse" }), "LIVE"] })] }), _jsx(ActivityChart, { height: 220 })] }), _jsxs("div", { className: "card p-0 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-slate-800 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Top users by review volume" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Updated automatically in real time." })] }), _jsxs("div", { className: "text-xs text-slate-500", children: [users.length, " users"] })] }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-800 bg-slate-900/40 text-xs text-slate-500 uppercase tracking-wide", children: [_jsx("th", { className: "text-left px-5 py-3", children: "User" }), _jsx("th", { className: "text-left px-5 py-3", children: "Reviews" }), _jsx("th", { className: "text-left px-5 py-3", children: "Avg score" }), _jsx("th", { className: "text-left px-5 py-3", children: "Last active" })] }) }), _jsxs("tbody", { children: [loading &&
                                            [...Array(6)].map((_, i) => (_jsxs("tr", { className: "border-b border-slate-800/40", children: [_jsx("td", { className: "px-5 py-4", children: _jsx("div", { className: "skeleton h-4 rounded w-40" }) }), _jsx("td", { className: "px-5 py-4", children: _jsx("div", { className: "skeleton h-4 rounded w-16" }) }), _jsx("td", { className: "px-5 py-4", children: _jsx("div", { className: "skeleton h-4 rounded w-20" }) }), _jsx("td", { className: "px-5 py-4", children: _jsx("div", { className: "skeleton h-4 rounded w-24" }) })] }, i))), !loading &&
                                            users.map((u) => (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors", children: [_jsxs("td", { className: "px-5 py-4", children: [_jsx("p", { className: "text-slate-200 font-medium", children: u.name }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: u.email })] }), _jsx("td", { className: "px-5 py-4 text-slate-300 font-medium", children: u.reviews }), _jsx("td", { className: "px-5 py-4", children: _jsxs("span", { className: `font-semibold ${u.avgScore >= 80
                                                                ? 'text-[#2DD4A0]'
                                                                : u.avgScore >=
                                                                    60
                                                                    ? 'text-[#FFB347]'
                                                                    : 'text-[#FF6B6B]'}`, children: [u.avgScore, "%"] }) }), _jsx("td", { className: "px-5 py-4 text-xs text-slate-500", children: u.lastActive
                                                            ? new Date(u.lastActive).toLocaleString()
                                                            : '—' })] }, u.email)))] })] })] }), showInvite && (_jsx(InviteUserModal, { onClose: () => setShowInvite(false) }))] }) }));
}
