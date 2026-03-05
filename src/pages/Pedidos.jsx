import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Truck, RefreshCw, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const ESTADO_COLORES = {
    'Preparando': { border: 'border-[#eab308]', text: 'text-[#eab308]', bg: 'bg-[#eab308]/10' },
    'Enviado': { border: 'border-[#3b82f6]', text: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' },
    'Entregado': { border: 'border-[#10b981]', text: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
    'Cancelado': { border: 'border-[#ef4444]', text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10' },
};

const getEstadoStyle = (nombre) => ESTADO_COLORES[nombre] || { border: 'border-[#a1a1aa]', text: 'text-[#a1a1aa]', bg: 'bg-[#a1a1aa]/10' };

export default function Pedidos() {
    const [data, setData] = useState([]);
    const [estados, setEstados] = useState([]);
    const [estadosMap, setEstadosMap] = useState({});
    const [loading, setLoading] = useState(true);

    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Detail / Update modal
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editEstado, setEditEstado] = useState('');
    const [editObservaciones, setEditObservaciones] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const ecList = [
            { id: 'Preparando', nombre: 'Preparando' },
            { id: 'Enviado', nombre: 'Enviado' },
            { id: 'Entregado', nombre: 'Entregado' },
            { id: 'Cancelado', nombre: 'Cancelado' }
        ];
        setEstados(ecList);

        const ecMap = {};
        ecList.forEach(e => { ecMap[e.id] = e.nombre; });
        setEstadosMap(ecMap);
    }, []);

    const fetchData = async (url) => {
        setLoading(true);
        try {
            const pedidosRes = await api.get(url);
            setData(pedidosRes.data.results || pedidosRes.data || []);
            setNextUrl(pedidosRes.data.next || null);
            setPrevUrl(pedidosRes.data.previous || null);
        } catch (error) {
            console.error('Error fetching pedidos:', error);
            toast.error('Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const url = searchTerm ? `/api/v1/pedidos/?search=${searchTerm}` : '/api/v1/pedidos/';
            fetchData(url);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const openDetail = (pedido) => {
        setSelectedPedido(pedido);
        setEditEstado(pedido.estado || '');
        setEditObservaciones(pedido.observaciones || '');
        setIsDetailOpen(true);
    };

    const handleUpdateEstado = async () => {
        if (!selectedPedido || !editEstado) return;

        setIsUpdating(true);
        try {
            await api.patch(`/api/v1/pedidos/${selectedPedido.id}/`, {
                estado: editEstado,
                observaciones: editObservaciones || null
            });
            toast.success('Estado del pedido actualizado');
            setIsDetailOpen(false);
            fetchData(searchTerm ? `/api/v1/pedidos/?search=${searchTerm}` : '/api/v1/pedidos/');
        } catch (error) {
            console.error('Error al actualizar pedido:', error);
            const msgs = error.response?.data;
            if (msgs && typeof msgs === 'object') {
                const errorStr = Object.entries(msgs)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
                toast.error(`Error: ${errorStr}`);
            } else {
                toast.error('Error al actualizar el pedido');
            }
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Pedidos (Logística)</h1>
                    <p className="text-[#a1a1aa]">Gestiona el estado logístico de los envíos generados desde órdenes de venta.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#a1a1aa]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar pedidos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition w-64 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[#a1a1aa] text-sm bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#27272a] h-[38px]">
                        <Truck className="w-4 h-4 text-[#10b981]" />
                        {data.length} pedido{data.length !== 1 ? 's' : ''} activo{data.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando pedidos...</div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                        <Truck className="w-8 h-8 text-[#27272a] mx-auto mb-3" />
                        <p className="text-[#a1a1aa]">No hay pedidos en curso.</p>
                        <p className="text-[#3f3f46] text-xs mt-1">Los pedidos se crean automáticamente cuando una orden de venta tiene tipo de entrega distinto a "Caja".</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">Pedido</th>
                                    <th className="px-6 py-4">Orden</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Dirección</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((item, i) => {
                                    const estadoNombre = item.estado_nombre || estadosMap[item.estado] || 'Desconocido';
                                    const style = getEstadoStyle(estadoNombre);
                                    return (
                                        <tr key={item.id || i} className="hover:bg-[#1a1a1a] subtle-transition group">
                                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-[#10b981]" />
                                                #{item.id}
                                            </td>
                                            <td className="px-6 py-4 text-[#a1a1aa]">
                                                V-{item.orden_id || item.orden}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {item.cliente_nombre || 'General'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white max-w-[200px] truncate" title={item.direccion_envio}>
                                                    {item.direccion_envio || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded inline-block text-[11px] font-medium tracking-wide border ${style.border} ${style.text}`}>
                                                    {estadoNombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[#a1a1aa]">
                                                {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => openDetail(item)}
                                                    className="text-[#a1a1aa] hover:text-[#3b82f6] bg-[#27272a] hover:bg-[#3b82f6]/10 px-3 py-1.5 rounded-lg subtle-transition text-xs font-medium inline-flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Gestionar
                                                </button>
                                            </td>
                                        </tr>
                                    );
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

            {/* Detail / Update Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Pedido #${selectedPedido?.id}`}
            >
                {selectedPedido && (
                    <div className="space-y-5">
                        {/* Info cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Orden de Venta</p>
                                <p className="text-white font-medium">V-{selectedPedido.orden_id || selectedPedido.orden}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Cliente</p>
                                <p className="text-white font-medium">{selectedPedido.cliente_nombre || 'General'}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Total Orden</p>
                                <p className="text-[#10b981] font-bold text-lg">${selectedPedido.orden_total || '0.00'}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Dirección de Envío</p>
                                <p className="text-white font-medium text-sm">{selectedPedido.direccion_envio}</p>
                            </div>
                        </div>

                        {/* Estado actual */}
                        {(() => {
                            const estadoNombre = selectedPedido.estado_nombre || estadosMap[selectedPedido.estado] || 'Desconocido';
                            const isTerminal = estadoNombre === 'Entregado' || estadoNombre === 'Cancelado';
                            const style = getEstadoStyle(estadoNombre);

                            return isTerminal ? (
                                <div className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-center gap-3`}>
                                    <Truck className={`w-5 h-5 ${style.text}`} />
                                    <p className={`${style.text} text-sm font-medium`}>
                                        Este pedido está marcado como "{estadoNombre}". No se puede modificar.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a] space-y-4">
                                    <h4 className="flex items-center gap-2 text-white font-semibold">
                                        <RefreshCw className="w-4 h-4 text-[#3b82f6]" />
                                        Actualizar Estado del Pedido
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Nuevo Estado</label>
                                            <select
                                                value={editEstado}
                                                onChange={(e) => setEditEstado(e.target.value)}
                                                className="w-full bg-[#121212] border border-[#27272a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#3b82f6] subtle-transition"
                                            >
                                                {estados.map(e => (
                                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Observaciones</label>
                                            <input
                                                type="text"
                                                value={editObservaciones}
                                                onChange={(e) => setEditObservaciones(e.target.value)}
                                                placeholder="Ej. Entregado al portero..."
                                                className="w-full bg-[#121212] border border-[#27272a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#3b82f6] subtle-transition"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUpdateEstado}
                                        disabled={isUpdating}
                                        className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium subtle-transition flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                                        {isUpdating ? 'Actualizando...' : 'Actualizar Estado'}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Observaciones actuales */}
                        {selectedPedido.observaciones && (
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Observaciones Actuales</p>
                                <p className="text-white text-sm">{selectedPedido.observaciones}</p>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end border-t border-[#27272a]">
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-lg subtle-transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
