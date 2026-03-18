import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { formatearMoneda } from '../utils/formatters';

export default function Pagos() {
    const [dataVentas, setDataVentas] = useState([]);
    const [dataCompras, setDataCompras] = useState([]);
    const [mediosPago, setMediosPago] = useState([]);

    // For selects in Modal
    const [ordenesVenta, setOrdenesVenta] = useState([]);
    const [ordenesCompra, setOrdenesCompra] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' o 'compras'

    // Pagination states separated by tab
    const [nextVentasUrl, setNextVentasUrl] = useState(null);
    const [prevVentasUrl, setPrevVentasUrl] = useState(null);
    const [nextComprasUrl, setNextComprasUrl] = useState(null);
    const [prevComprasUrl, setPrevComprasUrl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);

    // Form state (Creating a Payment)
    // Nota: Por diseño, los pagos no se editan, solo se crean o anulan/eliminan.
    const [formData, setFormData] = useState({
        orden: '', // id orden venta
        orden_compra: '', // id orden compra
        monto: '',
        metodo_pago: '',
        nota: ''
    });

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [mediosRes, ordVenRes, ordCompRes] = await Promise.all([
                    api.get('/api/v1/medios-de-pago/'),
                    api.get('/api/v1/ordenes-de-venta/?con_saldo=true'),
                    api.get('/api/v1/ordenes-de-compra/?con_saldo=true')
                ]);
                setMediosPago(mediosRes.data.results || mediosRes.data || []);
                setOrdenesVenta(ordVenRes.data.results || ordVenRes.data || []);
                setOrdenesCompra(ordCompRes.data.results || ordCompRes.data || []);
            } catch (error) {
                console.error('Error fetching dependencies:', error);
            }
        };
        fetchDependencies();
    }, []);

    const fetchVentas = async (url) => {
        try {
            const res = await api.get(url);
            setDataVentas(res.data.results || res.data || []);
            setNextVentasUrl(res.data.next || null);
            setPrevVentasUrl(res.data.previous || null);
        } catch (error) {
            console.error('Error fetching ventas:', error);
        }
    };

    const fetchCompras = async (url) => {
        try {
            const res = await api.get(url);
            setDataCompras(res.data.results || res.data || []);
            setNextComprasUrl(res.data.next || null);
            setPrevComprasUrl(res.data.previous || null);
        } catch (error) {
            console.error('Error fetching compras:', error);
        }
    };

    const reloadData = () => {
        setLoading(true);
        const urlVentas = searchTerm ? `/api/v1/pagos-de-ventas/?search=${searchTerm}` : '/api/v1/pagos-de-ventas/';
        const urlCompras = searchTerm ? `/api/v1/pagos-de-compras/?search=${searchTerm}` : '/api/v1/pagos-de-compras/';
        Promise.all([fetchVentas(urlVentas), fetchCompras(urlCompras)]).finally(() => setLoading(false));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            reloadData();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const activeData = activeTab === 'ventas' ? dataVentas : dataCompras;
    const currentNextUrl = activeTab === 'ventas' ? nextVentasUrl : nextComprasUrl;
    const currentPrevUrl = activeTab === 'ventas' ? prevVentasUrl : prevComprasUrl;

    // Handlers
    const openAddModal = () => {
        setFormData({
            orden: '',
            orden_compra: '',
            monto: '',
            metodo_pago: mediosPago.length > 0 ? mediosPago[0].id : '',
            nota: ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        try {
            if (activeTab === 'ventas') {
                await api.delete(`/api/v1/pagos-de-ventas/${deletingItem.id}/`);
            } else {
                await api.delete(`/api/v1/pagos-de-compras/${deletingItem.id}/`);
            }
            toast.success('Pago eliminado');
            setIsDeleteModalOpen(false);
            reloadData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error('Error al eliminar el pago');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Armamos el payload segun la pestaña que este abierta
        // Registramos un pago de Venta
        if (activeTab === 'ventas') {
            if (!formData.orden) {
                toast.error("Seleccione una Orden de Venta");
                return;
            }
            const payload = {
                orden: formData.orden,
                monto: formData.monto,
                metodo_pago: formData.metodo_pago,
                nota: formData.nota
            };
            try {
                await api.post('/api/v1/pagos-de-ventas/', payload);
                toast.success('Pago de venta registrado exitosamente');
                setIsModalOpen(false);
                reloadData();
            } catch (err) {
                console.error("Error al registrar pago venta:", err);
                toast.error(err.response?.data?.error || 'Error al registrar el pago');
            }
        }
        // Registramos un pago de Compra
        else {
            if (!formData.orden_compra) {
                toast.error("Seleccione una Orden de Compra");
                return;
            }
            const payload = {
                orden_compra: formData.orden_compra,
                monto: formData.monto,
                metodo_pago: formData.metodo_pago,
                nota: formData.nota
            };
            try {
                await api.post('/api/v1/pagos-de-compras/', payload);
                toast.success('Pago de compra registrado exitosamente');
                setIsModalOpen(false);
                reloadData();
            } catch (err) {
                console.error("Error al registrar pago compra:", err);
                toast.error(err.response?.data?.error || 'Error al registrar el pago');
            }
        }
    };

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Pagos</h1>
                    <p className="text-[#a1a1aa]">Registro de transacciones entrantes y salientes.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#a1a1aa]" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Buscar pagos...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition w-64 text-sm"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium subtle-transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                        Registrar Pago de {activeTab === 'ventas' ? 'Venta' : 'Compra'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#27272a] space-x-6">
                <button
                    onClick={() => setActiveTab('ventas')}
                    className={`pb-3 font-medium text-sm subtle-transition border-b-2 ${activeTab === 'ventas' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-[#a1a1aa] hover:text-white'}`}
                >
                    Ingresos (Ventas)
                </button>
                <button
                    onClick={() => setActiveTab('compras')}
                    className={`pb-3 font-medium text-sm subtle-transition border-b-2 ${activeTab === 'compras' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-[#a1a1aa] hover:text-white'}`}
                >
                    Egresos (Compras)
                </button>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden mt-4">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando datos...</div>
                ) : activeData.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay pagos registrados en esta categoría.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Orden</th>
                                    <th className="px-6 py-4 text-right">Monto</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Medio de Pago</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {activeData.map((item, i) => (
                                    <tr key={i} className="hover:bg-[#1a1a1a] subtle-transition group">
                                        <td className="px-6 py-4 font-medium text-[#a1a1aa]">{item.id}</td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {activeTab === 'ventas'
                                                ? (item.orden ? `Orden #${item.orden}` : '-')
                                                : (item.orden_compra ? `Compra #${item.orden_compra}` : '-')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[#10b981] text-right">{formatearMoneda(item.monto)}</td>
                                        <td className="px-6 py-4 text-[#a1a1aa]">
                                            {item.fecha ? new Date(item.fecha).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-[#a1a1aa]">
                                            {item.metodo_pago_nombre || item.metodo_pago || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* No Edit in Pagos normally, only allow Delete to rollback a payment */}
                                                <button
                                                    onClick={() => { setDeletingItem(item); setIsDeleteModalOpen(true); }}
                                                    className="p-1.5 text-[#a1a1aa] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-md subtle-transition"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Paginación */}
                        {(currentNextUrl || currentPrevUrl) && (
                            <div className="flex justify-between items-center p-4 border-t border-[#27272a] bg-[#1a1a1a]">
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        if (activeTab === 'ventas') fetchVentas(currentPrevUrl).finally(() => setLoading(false));
                                        else fetchCompras(currentPrevUrl).finally(() => setLoading(false));
                                    }}
                                    disabled={!currentPrevUrl}
                                    className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg subtle-transition"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        if (activeTab === 'ventas') fetchVentas(currentNextUrl).finally(() => setLoading(false));
                                        else fetchCompras(currentNextUrl).finally(() => setLoading(false));
                                    }}
                                    disabled={!currentNextUrl}
                                    className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg subtle-transition"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={activeTab === 'ventas' ? "Registrar Pago de Venta" : "Registrar Pago de Compra"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'ventas' ? (
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Orden de Venta</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/ordenes-de-venta/?con_saldo=true"
                                transformOption={(ov) => ({
                                    ...ov,
                                    nombre: `Orden #${ov.id} (${ov.cliente ? (ov.cliente.nombre || ov.cliente) : 'Sin Cliente'})`
                                })}
                                staticOptions={ordenesVenta.map(ov => ({
                                    ...ov,
                                    nombre: `Orden #${ov.id} (${ov.cliente ? (ov.cliente.nombre || ov.cliente) : 'Sin Cliente'})`
                                }))}
                                name="orden"
                                required={true}
                                value={formData.orden}
                                onChange={handleChange}
                                placeholder="-- Seleccionar Orden --"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Orden de Compra</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/ordenes-de-compra/?con_saldo=true"
                                transformOption={(oc) => ({
                                    ...oc,
                                    nombre: `Compra #${oc.id} (${oc.proveedor ? (oc.proveedor.nombre || oc.proveedor) : 'Sin Proveedor'})`
                                })}
                                staticOptions={ordenesCompra.map(oc => ({
                                    ...oc,
                                    nombre: `Compra #${oc.id} (${oc.proveedor ? (oc.proveedor.nombre || oc.proveedor) : 'Sin Proveedor'})`
                                }))}
                                name="orden_compra"
                                required={true}
                                value={formData.orden_compra}
                                onChange={handleChange}
                                placeholder="-- Seleccionar Orden --"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Monto a Pagar ($)</label>
                        <input
                            type="number"
                            name="monto"
                            step="0.01"
                            required
                            value={formData.monto}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Medio de Pago</label>
                        <SearchableSelect
                            apiEndpoint="/api/v1/medios-de-pago/"
                            staticOptions={mediosPago.length > 0 ? mediosPago : null}
                            name="metodo_pago"
                            required={true}
                            value={formData.metodo_pago}
                            onChange={handleChange}
                            placeholder="-- Seleccionar Método --"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Notas (Opcional)</label>
                        <textarea
                            name="nota"
                            value={formData.nota}
                            onChange={handleChange}
                            rows="2"
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition resize-none"
                            placeholder="Ej. Transferencia ACH 12345"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-[#27272a]">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-lg subtle-transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] hover:bg-[#059669] rounded-lg subtle-transition"
                        >
                            Registrar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar Anulación"
            >
                <div className="space-y-4">
                    <p className="text-[#a1a1aa]">
                        ¿Estás seguro de que deseas anular el pago <strong className="text-white">#{deletingItem?.id}</strong> de <strong className="text-[#10b981]">{formatearMoneda(deletingItem?.monto)}</strong>? Esta acción no se puede deshacer y puede afectar el estado de cuenta de la orden respectiva.
                    </p>
                    <div className="pt-4 flex justify-end gap-3 border-t border-[#27272a]">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-lg subtle-transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#ef4444] hover:bg-[#b91c1c] rounded-lg subtle-transition"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
