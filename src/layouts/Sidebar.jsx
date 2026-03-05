import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Truck,
    ArrowLeftRight,
    Box,
    Tags,
    Users,
    CreditCard,
    ClipboardList,
    Warehouse,
    Settings,
    LogOut
} from 'lucide-react';

const sections = [
    {
        title: 'VISTA GENERAL',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'CATÁLOGOS',
        items: [
            { path: '/productos', label: 'Productos', icon: Package },
        ]
    },
    {
        title: 'OPERACIONES',
        items: [
            { path: '/ventas', label: 'Ventas', icon: ShoppingCart },
            { path: '/compras', label: 'Compras', icon: Truck },
            { path: '/pedidos', label: 'Pedidos', icon: ClipboardList },
            { path: '/pagos', label: 'Pagos', icon: CreditCard },
        ]
    },
    {
        title: 'INVENTARIO',
        items: [
            { path: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
        ]
    },
    {
        title: 'SISTEMA',
        items: [
            { path: '/configuracion', label: 'Configuración', icon: Settings },
        ]
    }
];

export default function Sidebar() {
    const { logout } = useAuth();

    return (
        <div className="w-64 h-screen bg-[#0a0a0a] border-r border-[#27272a] flex flex-col fixed left-0 top-0 overflow-y-auto custom-scrollbar">
            {/* Brand */}
            <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-[#27272a]">
                <Box className="w-6 h-6 text-[#10b981] mr-3" />
                <span className="text-white font-bold text-lg tracking-wide">Inventario Pro</span>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 py-6 space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="px-4 text-[10px] font-bold text-[#52525b] tracking-wider uppercase mb-2">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center px-4 py-2.5 rounded-lg subtle-transition font-medium text-sm ${isActive
                                                ? 'bg-[#1a1a1a] text-[#10b981] shadow-[inset_2px_0_0_0_#10b981]'
                                                : 'text-[#a1a1aa] hover:bg-[#121212] hover:text-white'
                                            }`
                                        }
                                    >
                                        <Icon className="w-5 h-5 mr-3" strokeWidth={2} />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Auth / Settings Footer */}
            <div className="p-4 border-t border-[#27272a]">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2.5 rounded-lg subtle-transition font-medium text-sm text-[#ef4444] hover:bg-[#ef4444]/10"
                >
                    <LogOut className="w-5 h-5 mr-3" strokeWidth={2} />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
