import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import "./index.css";
ReactDOM.createRoot(document.getElementById('root')).render(_jsxs(React.StrictMode, { children: [_jsx(App, {}), _jsx(Toaster, { position: "top-right", toastOptions: {
                style: {
                    background: '#181c27',
                    color: '#f1f5f9',
                    border: '1px solid #252a38',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#181c27' } },
                error: { iconTheme: { primary: '#c9e802', secondary: '#181c27' } },
            } })] }));
