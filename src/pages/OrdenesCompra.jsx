import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, ShoppingCart, PlusCircle, RefreshCw, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { formatearMoneda } from '../utils/formatters';

export default function OrdenesCompra() {
    const [data, setData] = useState([]);
    const [productosMap, setProductosMap] = useState({});

    // Select options for Create Form
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [estadosCompra, setEstadosCompra] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);

    const [loading, setLoading] = useState(true);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Edit state
    const [editEstado, setEditEstado] = useState('');
    const [editNota, setEditNota] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [estadosCompraMap, setEstadosCompraMap] = useState({});

    const [formData, setFormData] = useState({
        proveedor: '',
        ubicacion_entrega: '',
        estado_compra: '',
        pago_inicial: 0,
        metodo_pago: '',
        nota: '',
        fecha_esperada: ''
    });

    // Form state (Items processing)
    const [cartItems, setCartItems] = useState([]);

    // Current item being added
    const [currentItem, setCurrentItem] = useState({
        producto: '',
        cantidad: 1,
        precio_unitario: ''
    });

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [
                    prodRes,
                    provRes,
                    almacenesRes,
                    pagoRes
                ] = await Promise.all([
                    api.get('/api/v1/productos/'),
                    api.get('/api/v1/proveedores/'),
                    api.get('/api/v1/almacenes/'),
                    api.get('/api/v1/medios-de-pago/')
                ]);

                const prods = prodRes.data.results || prodRes.data || [];
                setProductos(prods);

                setProveedores(provRes.data.results || provRes.data || []);
                setAlmacenes(almacenesRes.data.results || almacenesRes.data || []);
                const ecList = [
                    { id: 'Pendiente', nombre: 'Pendiente' },
                    { id: 'Recibido', nombre: 'Recibido' },
                    { id: 'Cancelado', nombre: 'Cancelado' }
                ];
                setEstadosCompra(ecList);
                setMetodosPago(pagoRes.data.results || pagoRes.data || []);

                const ecMap = {};
                ecList.forEach(ec => { ecMap[ec.id] = ec.nombre; });
                setEstadosCompraMap(ecMap);

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
            const comprasRes = await api.get(url);
            setData(comprasRes.data.results || comprasRes.data || []);
            setNextUrl(comprasRes.data.next || null);
            setPrevUrl(comprasRes.data.previous || null);
        } catch (error) {
            console.error('Error fetching compras:', error);
            toast.error('Error al cargar datos de compras');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const url = searchTerm ? `/api/v1/ordenes-de-compra/?search=${searchTerm}` : '/api/v1/ordenes-de-compra/';
            fetchData(url);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const openDetails = (order) => {
        setSelectedOrder(order);
        setEditEstado(order.estado_compra || '');
        setEditNota(order.nota || '');
        setIsDetailsOpen(true);
    };

    const openCreateModal = () => {
        setFormData({
            proveedor: '',
            ubicacion_entrega: '',
            estado_compra: '',
            pago_inicial: 0,
            metodo_pago: '',
            nota: '',
            fecha_esperada: ''
        });
        setCartItems([]);
        setCurrentItem({
            producto: '',
            cantidad: 1,
            precio_unitario: ''
        });
        setIsCreateOpen(true);
    };

    // Handle header inputs
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle current item selection inputs
    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem({ ...currentItem, [name]: value });

        // Auto-fill cost slightly differently or leave empty for purchases.
        // Usually purchase cost differs from selling price, but we will leave
        // selling price as a reference.
        if (name === 'producto') {
            const selectedProd = productos.find(p => p.id.toString() === value.toString());
            if (selectedProd) {
                setCurrentItem((prev) => ({
                    ...prev,
                    producto: value,
                    // Optional: pre-filling the selling price into cost is debatable, 
                    // but providing a rough reference helps.
                    precio_unitario: selectedProd.precio || ''
                }));
            }
        }
    };

    // Add item to cart list
    const handleAddItem = () => {
        if (!currentItem.producto || !currentItem.cantidad || !currentItem.precio_unitario) {
            toast.error('Completa los datos del producto (Producto, Cantidad, Costo Unitario)');
            return;
        }

        if (Number(currentItem.cantidad) < 1) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        if (Number(currentItem.precio_unitario) < 0) {
            toast.error('El costo no puede ser negativo');
            return;
        }

        // Check if product already in cart
        const exists = cartItems.find(item => item.producto.toString() === currentItem.producto.toString());
        if (exists) {
            toast.error('Este producto ya fue agregado. Elimínelo si desea cambiar cantidad.');
            return;
        }

        setCartItems([...cartItems, { ...currentItem }]);

        // Reset current item logic
        setCurrentItem({
            producto: '',
            cantidad: 1,
            precio_unitario: ''
        });
    };

    // Remove item from cart list
    const handleRemoveItem = (index) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
    };

    // Calculate dynamic total
    const cartTotal = cartItems.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio_unitario)), 0);

    // Submit Master Order
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            toast.error('Debes agregar al menos un producto a la compra');
            return;
        }

        if (!formData.proveedor || !formData.ubicacion_entrega || !formData.estado_compra) {
            toast.error('Debes seleccionar todos los campos maestros de la orden (Proveedor, Almacén, Estado)');
            return;
        }

        const payload = {
            proveedor: formData.proveedor,
            ubicacion_entrega: formData.ubicacion_entrega,
            estado_compra: formData.estado_compra,
            pago_inicial: Number(formData.pago_inicial),
            metodo_pago: formData.metodo_pago || null,
            nota: formData.nota || null,
            fecha_esperada: formData.fecha_esperada || null,
            items: cartItems.map(item => ({
                producto: item.producto,
                cantidad: Number(item.cantidad),
                precio_unitario: Number(item.precio_unitario)
            }))
        };

        try {
            await api.post('/api/v1/ordenes-de-compra/', payload);
            toast.success('Orden de Compra creada exitosamente');
            setIsCreateOpen(false);
            fetchData(searchTerm ? `/api/v1/ordenes-de-compra/?search=${searchTerm}` : '/api/v1/ordenes-de-compra/');
        } catch (error) {
            console.error('Error al crear compra:', error);
            const msgs = error.response?.data;
            if (msgs && typeof msgs === 'object') {
                const errorStr = Object.entries(msgs)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
                toast.error(`Error: ${errorStr}`);
            } else {
                toast.error('Ocurrió un error al guardar la orden de compra');
            }
        }
    };

    // Handle update estado
    const handleUpdateEstado = async () => {
        if (!selectedOrder || !editEstado) return;

        setIsUpdating(true);
        try {
            const payload = {
                estado_compra: editEstado,
                nota: editNota || null
            };
            await api.patch(`/api/v1/ordenes-de-compra/${selectedOrder.id}/`, payload);
            toast.success('Orden actualizada exitosamente');
            setIsDetailsOpen(false);
            fetchData(searchTerm ? `/api/v1/ordenes-de-compra/?search=${searchTerm}` : '/api/v1/ordenes-de-compra/');
        } catch (error) {
            console.error('Error al actualizar:', error);
            const msgs = error.response?.data;
            if (msgs && typeof msgs === 'object') {
                const errorStr = Object.entries(msgs)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
                toast.error(`Error: ${errorStr}`);
            } else {
                toast.error('Error al actualizar la orden');
            }
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Órdenes de Compra</h1>
                    <p className="text-[#a1a1aa]">Reabastecimiento y compras a proveedores</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#a1a1aa]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar compras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition w-64 text-sm"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium subtle-transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                        Nueva Compra
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando órdenes...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay compras registradas.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">No. Orden</th>
                                    <th className="px-6 py-4">Proveedor / Fecha</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-center">Estado Logístico</th>
                                    <th className="px-6 py-4 text-center">Estado Pago</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((purchase, i) => (
                                    <tr key={purchase.id || i} className="hover:bg-[#1a1a1a] subtle-transition">
                                        <td className="px-6 py-4 font-semibold text-[#10b981] whitespace-nowrap">
                                            C-{purchase.numero_orden || purchase.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">
                                                {purchase.proveedor_nombre ? purchase.proveedor_nombre : (typeof purchase.proveedor === 'object' ? purchase.proveedor.nombre : `Prov. ${purchase.proveedor}`)}
                                            </div>
                                            <div className="text-[#a1a1aa] text-xs mt-0.5">Esperada: {purchase.fecha_esperada ? new Date(purchase.fecha_esperada).toLocaleDateString() : 'Sin fecha'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-right">
                                            <div className="text-[#10b981]">{formatearMoneda(purchase.total)}</div>
                                            {(purchase.saldo_pendiente > 0) && (
                                                <div className="text-[#ef4444] text-xs">Saldo: {formatearMoneda(purchase.saldo_pendiente)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border 
                                                ${purchase.estado_compra === 1 || purchase.estado_compra?.nombre === 'Completada' ? 'border-[#10b981] text-[#10b981]'
                                                    : 'border-[#3b82f6] text-[#3b82f6]'}`}>
                                                {typeof purchase.estado_compra === 'object' ? purchase.estado_compra.nombre : (purchase.estado_compra || 'Pendiente')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border 
                                                ${purchase.estado_pago_nombre === 'Completado' || purchase.estado_pago_nombre === 'Pagado' ? 'border-[#10b981] text-[#10b981]'
                                                    : purchase.estado_pago_nombre === 'Abonado' || purchase.estado_pago_nombre === 'Parcial' ? 'border-[#3b82f6] text-[#3b82f6]'
                                                        : 'border-[#eab308] text-[#eab308]'}`}>
                                                {purchase.estado_pago_nombre || 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openDetails(purchase)}
                                                className="text-[#a1a1aa] hover:text-[#10b981] bg-[#27272a] hover:bg-[#10b981]/10 px-3 py-1.5 rounded-lg subtle-transition text-xs font-medium inline-flex items-center gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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

            {/* CREATE PURCHASE ORDER MODAL */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Nueva Orden de Compra"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Proveedor</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/proveedores/"
                                staticOptions={proveedores.length > 0 ? proveedores : null}
                                name="proveedor"
                                required={true}
                                value={formData.proveedor}
                                onChange={handleFormChange}
                                placeholder="-- Seleccione un proveedor --"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Fecha Esperada</label>
                            <input
                                type="date"
                                name="fecha_esperada"
                                value={formData.fecha_esperada}
                                onChange={handleFormChange}
                                className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Almacén de Destino</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/almacenes/"
                                staticOptions={almacenes.length > 0 ? almacenes : null}
                                name="ubicacion_entrega"
                                required={true}
                                value={formData.ubicacion_entrega}
                                onChange={handleFormChange}
                                placeholder="-- Seleccione un almacén --"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Estado de la compra</label>
                            <SearchableSelect
                                staticOptions={estadosCompra}
                                name="estado_compra"
                                required={true}
                                value={formData.estado_compra}
                                onChange={handleFormChange}
                                placeholder="-- Seleccione estado logístico --"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Pago Inicial ($)</label>
                            <input
                                type="number"
                                name="pago_inicial"
                                value={formData.pago_inicial}
                                onChange={handleFormChange}
                                min="0"
                                step="0.01"
                                className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Método de Pago</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/medios-de-pago/"
                                staticOptions={metodosPago.length > 0 ? metodosPago : null}
                                name="metodo_pago"
                                value={formData.metodo_pago}
                                onChange={handleFormChange}
                                disabled={Number(formData.pago_inicial) <= 0}
                                placeholder={Number(formData.pago_inicial) > 0 ? "-- Seleccione método --" : "-- N/A --"}
                            />
                        </div>
                    </div>

                    <div className="border-t border-[#27272a] pt-6">
                        <h4 className="flex items-center gap-2 text-white font-semibold mb-4">
                            <ShoppingCart className="w-4 h-4 text-[#10b981]" />
                            Detalle de Productos a Comprar
                        </h4>

                        {/* Dynamic Item Adder */}
                        <div className="flex gap-3 mb-4 items-end bg-[#121212] p-4 rounded-xl border border-[#27272a]">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Producto</label>
                                <SearchableSelect
                                    apiEndpoint="/api/v1/productos/"
                                    staticOptions={productos.length > 0 ? productos : null}
                                    name="producto"
                                    value={currentItem.producto}
                                    onChange={handleItemChange}
                                    placeholder="Seleccionar..."
                                />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    min="1"
                                    value={currentItem.cantidad}
                                    onChange={handleItemChange}
                                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Costo Unit. ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="precio_unitario"
                                    value={currentItem.precio_unitario}
                                    onChange={handleItemChange}
                                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-medium subtle-transition flex items-center gap-2 h-[38px]"
                            >
                                <PlusCircle className="w-4 h-4" /> Agregar
                            </button>
                        </div>

                        {/* Cart Table */}
                        <div className="bg-[#1a1a1a] border border-[#27272a] rounded-xl overflow-hidden mb-4">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium bg-[#121212]">
                                        <th className="px-4 py-2">Producto</th>
                                        <th className="px-4 py-2 text-center">Cant.</th>
                                        <th className="px-4 py-2 text-right">Costo</th>
                                        <th className="px-4 py-2 text-right">Subtotal</th>
                                        <th className="px-4 py-2 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#27272a]">
                                    {cartItems.length > 0 ? (
                                        cartItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[#27272a] subtle-transition">
                                                <td className="px-4 py-3 text-white">
                                                    {item.producto_nombre || productosMap[item.producto] || `Producto #${item.producto}`}
                                                </td>
                                                <td className="px-4 py-3 text-center text-[#a1a1aa]">{item.cantidad}</td>
                                                <td className="px-4 py-3 text-right text-[#a1a1aa]">{formatearMoneda(item.precio_unitario)}</td>
                                                <td className="px-4 py-3 text-right text-white font-medium">
                                                    {formatearMoneda(item.cantidad * item.precio_unitario)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="text-[#a1a1aa] hover:text-[#ef4444] p-1 rounded subtle-transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-6 text-center text-[#a1a1aa] border-b border-dashed border-[#27272a]">
                                                No ha agregado productos a la orden.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-start">
                            <div className="w-1/2">
                                <textarea
                                    name="nota"
                                    value={formData.nota}
                                    onChange={handleFormChange}
                                    placeholder="Notas adicionales (opcional)..."
                                    rows="2"
                                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981] resize-none"
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-[#a1a1aa] text-sm">Costo Estimado</p>
                                <p className="text-3xl font-bold text-[#10b981]">{formatearMoneda(cartTotal)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-[#27272a]">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-lg subtle-transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] hover:bg-[#059669] rounded-lg subtle-transition"
                        >
                            Crear Compra
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ORDER DETAILS MODAL (Read Only) */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`Detalles de Orden de Compra C-${selectedOrder?.id}`}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Proveedor</p>
                                <p className="text-white font-medium">
                                    {selectedOrder.proveedor_nombre ? selectedOrder.proveedor_nombre : (typeof selectedOrder.proveedor === 'object' ? selectedOrder.proveedor.nombre : `Prov. ${selectedOrder.proveedor}`)}
                                </p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Fecha Esperada</p>
                                <p className="text-white font-medium">{selectedOrder.fecha_esperada ? new Date(selectedOrder.fecha_esperada).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Total a Pagar</p>
                                <p className="text-[#10b981] font-bold text-lg">{formatearMoneda(selectedOrder.total)}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Pendiente de Pago</p>
                                <p className={`font-bold text-lg ${selectedOrder.saldo_pendiente > 0 ? 'text-[#ef4444]' : 'text-white'}`}>
                                    {formatearMoneda(selectedOrder.saldo_pendiente)}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div>
                            <h4 className="flex items-center gap-2 text-white font-semibold mb-3">
                                <ShoppingCart className="w-4 h-4 text-[#10b981]" />
                                Productos Adquiridos
                            </h4>
                            <div className="bg-[#1a1a1a] border border-[#27272a] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium bg-[#121212]">
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-center">Cant.</th>
                                            <th className="px-4 py-3 text-right">Costo Unit.</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#27272a]">
                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item, idx) => (
                                                <tr key={idx || item.id}>
                                                    <td className="px-4 py-3 text-white">
                                                        {item.producto_nombre || productosMap[item.producto] || `Producto #${item.producto}`}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-[#a1a1aa]">{item.cantidad}</td>
                                                    <td className="px-4 py-3 text-right text-[#a1a1aa]">{formatearMoneda(item.precio_unitario || item.precio)}</td>
                                                    <td className="px-4 py-3 text-right text-white font-medium">{formatearMoneda(item.cantidad * (item.precio_unitario || item.precio))}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-4 text-center text-[#a1a1aa]">No hay items detallados en esta orden.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedOrder.nota && (
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Notas Adicionales</p>
                                <p className="text-white text-sm">{selectedOrder.nota}</p>
                            </div>
                        )}

                        {/* Cambiar Estado Section */}
                        {estadosCompraMap[selectedOrder.estado_compra] === 'Recibido' ? (
                            <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4 flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-[#10b981]" />
                                <p className="text-[#10b981] text-sm font-medium">Esta orden ya fue recibida. El inventario fue actualizado.</p>
                            </div>
                        ) : (
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a] space-y-4">
                                <h4 className="flex items-center gap-2 text-white font-semibold">
                                    <RefreshCw className="w-4 h-4 text-[#3b82f6]" />
                                    Cambiar Estado de la Orden
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Nuevo Estado</label>
                                        <SearchableSelect
                                            staticOptions={estadosCompra}
                                            name="editEstado"
                                            value={editEstado}
                                            onChange={(e) => setEditEstado(e.target.value)}
                                            placeholder="-- Seleccione estado logístico --"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Nota (opcional)</label>
                                        <input
                                            type="text"
                                            value={editNota}
                                            onChange={(e) => setEditNota(e.target.value)}
                                            placeholder="Agregar una nota..."
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
                        )}

                        <div className="pt-2 flex justify-end border-t border-[#27272a]">
                            <button
                                onClick={() => setIsDetailsOpen(false)}
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
