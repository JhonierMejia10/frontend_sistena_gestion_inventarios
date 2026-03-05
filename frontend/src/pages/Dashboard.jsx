import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Truck, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { formatearMoneda } from '../utils/formatters';

export default function Dashboard() {
    const [statsData, setStatsData] = useState({
        total_productos: 0,
        total_ventas: 0,
        compras_pendientes: 0,
        stock_bajo: 0,
        valor_ventas: '$0'
    });

    const [recentSales, setRecentSales] = useState([]);
    const [recentPurchases, setRecentPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [dashRes, salesRes, purchRes] = await Promise.all([
                    api.get('/api/v1/dashboard/'),
                    api.get('/api/v1/ordenes-de-venta/'),
                    api.get('/api/v1/ordenes-de-compra/')
                ]);

                setStatsData({
                    ...statsData,
                    ...dashRes.data
                });

                // Limit to 3 recent
                const salesData = salesRes.data.results || salesRes.data || [];
                const purchData = purchRes.data.results || purchRes.data || [];
                setRecentSales(Array.isArray(salesData) ? salesData.slice(0, 3) : []);
                setRecentPurchases(Array.isArray(purchData) ? purchData.slice(0, 3) : []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const stats = [
        { title: 'Productos', value: statsData.total_productos, subtitle: 'Total en catálogo', icon: Package, color: 'text-gray-400' },
        { title: 'Ventas Realizadas', value: statsData.total_ventas, subtitle: 'Total histórico', icon: ShoppingCart, color: 'text-[#10b981]' },
        { title: 'Compras Pendientes', value: statsData.compras_pendientes, subtitle: 'Por aprobar/recibir', icon: Truck, color: 'text-[#10b981]' },
        { title: 'Stock Bajo', value: statsData.stock_bajo || 0, subtitle: 'Productos a reabastecer', icon: AlertTriangle, color: 'text-gray-400' },
        { title: 'Valor en Ventas', value: statsData.valor_ventas || '$0', subtitle: 'Total facturado', icon: TrendingUp, color: 'text-gray-400' },
    ];

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
                <p className="text-[#a1a1aa]">Resumen general de tu inventario y operaciones</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-[#a1a1aa]">Cargando métricas...</div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {stats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 hover:bg-[var(--color-bg-card-hover)] subtle-transition cursor-default">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[#a1a1aa] font-medium text-sm">{stat.title}</span>
                                        <Icon className={`w-5 h-5 ${stat.color}`} strokeWidth={1.5} />
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                    <div className="text-xs text-[#a1a1aa]">{stat.subtitle}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Recent Orders Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales */}
                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-6">Últimas Órdenes de Venta</h2>
                            <div className="space-y-4">
                                {recentSales.length === 0 ? (
                                    <div className="text-sm text-[#a1a1aa]">No hay ventas recientes.</div>
                                ) : (
                                    recentSales.map((sale, idx) => (
                                        <div key={idx} className="flex items-center justify-between pb-4 border-b border-[#27272a] last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-semibold text-sm">Venta #{sale.id}</div>
                                                <div className="text-[#a1a1aa] text-xs mt-1">{sale.fecha || 'Sin fecha'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm block min-w-[60px] text-right">{formatearMoneda(sale.total)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Purchases */}
                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-6">Últimas Órdenes de Compra</h2>
                            <div className="space-y-4">
                                {recentPurchases.length === 0 ? (
                                    <div className="text-sm text-[#a1a1aa]">No hay compras recientes.</div>
                                ) : (
                                    recentPurchases.map((purchase, idx) => (
                                        <div key={idx} className="flex items-center justify-between pb-4 border-b border-[#27272a] last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-semibold text-sm">Compra #{purchase.id}</div>
                                                <div className="text-[#a1a1aa] text-xs mt-1">{purchase.fecha_esperada || 'Sin fecha'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm block min-w-[60px] text-right">{formatearMoneda(purchase.total)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
