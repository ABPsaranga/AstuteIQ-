import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import RunReviewPage from './pages/RunReviewPage';
import ReviewResultsPage from './pages/ReviewResultsPage';
import ReviewHistoryPage from './pages/ReviewHistoryPage';
import SOAAnalysisPage from './pages/SOAAnalysisPage';
import SettingsPage from './pages/SettingsPage';
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsxs(Route, { element: _jsx(AppLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsxs(Route, { element: _jsx(PublicRoute, {}), children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) })] }), _jsxs(Route, { element: _jsx(ProtectedRoute, { roles: ['user'] }), children: [_jsx(Route, { path: "/dashboard", element: _jsx(UserDashboardPage, {}) }), _jsx(Route, { path: "/run-review", element: _jsx(RunReviewPage, {}) }), _jsx(Route, { path: "/soa-analysis", element: _jsx(SOAAnalysisPage, {}) }), _jsx(Route, { path: "/review/:id", element: _jsx(ReviewResultsPage, {}) }), _jsx(Route, { path: "/history", element: _jsx(ReviewHistoryPage, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(AnalyticsDashboard, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) })] }), _jsxs(Route, { element: _jsx(ProtectedRoute, { roles: ['admin'] }), children: [_jsx(Route, { path: "/admin", element: _jsx(AdminDashboardPage, {}) }), _jsx(Route, { path: "/admin/users", element: _jsx(AdminUsersPage, {}) })] })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
