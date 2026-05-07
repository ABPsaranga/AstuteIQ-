import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
export default function AppLayout() {
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-background text-white", children: [_jsx(Navbar, {}), _jsx("main", { className: "w-full px-4 sm:px-6 lg:px-10 py-6", children: _jsx(Outlet, {}) }), _jsx(Footer, {})] }));
}
