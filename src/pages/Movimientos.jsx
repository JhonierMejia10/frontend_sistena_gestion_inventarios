import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import api from '../utils/api';

export default function Movimientos() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [productosMap, setProductosMap] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const prodsRes = await api.get('/api/v1/productos/');
                const prods = prodsRes.data.results || prodsRes.data || [];
                const pMap = {};
                prods.forEach(p => {
                    pMap[p.id] = p.nombre || p.name;
                });
                setProductosMap(pMap);
            } catch (error) {
                console.error('Error fetching dependencies:', error);
            }
        };
        fetchDependencies();
    }, []);

    const fetchData = async (url) => {
        setLoading(true);
        try {
            const movsRes = await api.get(url);
            const movs = movsRes.data.results || movsRes.data || [];
            setData(movs);
            setNextUrl(movsRes.data.next || null);
            setPrevUrl(movsRes.data.previous || null);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const url = searchTerm ? `/api/v1/movimientos/?search=${searchTerm}` : '/api/v1/movimientos/';
            fetchData(url);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Movimientos</h1>
                    <p className="text-[#a1a1aa]">Registro histórico de entradas y salidas</p>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-[#a1a1aa]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar movimientos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition w-64 text-sm"
                    />
                </div>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando historial...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay movimientos registrados.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">ID / Referencia</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4 text-right">Cantidad</th>
                                    <th className="px-6 py-4 text-center">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((mov, i) => {
                                    const isEntrada = mov.tipo_movimiento === 'ENTRADA' || mov.type === 'IN';
                                    return (
                                        <tr key={i} className="hover:bg-[#1a1a1a] subtle-transition">
                                            <td className="px-6 py-4 font-semibold text-[#10b981] whitespace-nowrap">{mov.referencia || mov.id}</td>
                                            <td className="px-6 py-4 text-[#a1a1aa] font-medium">
                                                {mov.fecha_creacion ? new Date(mov.fecha_creacion).toLocaleString() : (mov.fecha || mov.date || '-')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded inline-flex text-xs font-medium border ${isEntrada
                                                    ? 'text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10'
                                                    : 'text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10'
                                                    }`}>
                                                    {isEntrada ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                                    {mov.tipo_movimiento || mov.type || 'MOVIMIENTO'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {mov.producto_nombre || productosMap[mov.producto] || (typeof mov.producto === 'object' ? mov.producto.nombre : mov.producto || '-')}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-right text-white">
                                                {isEntrada ? '+' : '-'}{mov.cantidad || mov.quantity || '0'}
                                            </td>
                                            <td className="px-6 py-4 text-center text-[#a1a1aa]">{mov.usuario || mov.user || '-'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Paginación */}
                        {(nextUrl || prevUrl) && (
                            <div className="flex justify-between items-center p-4 border-t border-[#27272a] bg-[#1a1a1a]">
                                <button
                                    onClick={() => fetchData(prevUrl)}
                                    disabled={!prevUrl}
                                    className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg subtle-transition"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => fetchData(nextUrl)}
                                    disabled={!nextUrl}
                                    className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg subtle-transition"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
