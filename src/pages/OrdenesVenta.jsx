import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, ShoppingCart, PlusCircle, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { formatearMoneda } from '../utils/formatters';

export default function OrdenesVenta() {
    const [data, setData] = useState([]);
    const [productosMap, setProductosMap] = useState({});

    // Select options for Create Form
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [tiposEntrega, setTiposEntrega] = useState([]);

    const [loading, setLoading] = useState(true);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Form state (Header)
    const [formData, setFormData] = useState({
        cliente: '',
        almacen: '',
        pago_inicial: 0,
        metodo_pago: '',
        tipo_entrega: '',
        nota: '',
        direccion_envio: ''
    });

    // Map para resolver nombres de tipo_entrega por ID
    const [tiposEntregaMap, setTiposEntregaMap] = useState({});

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
                    clientesRes,
                    almacenesRes,
                    pagoRes
                ] = await Promise.all([
                    api.get('/api/v1/productos/'),
                    api.get('/api/v1/clientes/'),
                    api.get('/api/v1/almacenes/'),
                    api.get('/api/v1/medios-de-pago/')
                ]);

                const prods = prodRes.data.results || prodRes.data || [];
                setProductos(prods);
                setClientes(clientesRes.data.results || clientesRes.data || []);
                setAlmacenes(almacenesRes.data.results || almacenesRes.data || []);
                setMetodosPago(pagoRes.data.results || pagoRes.data || []);
                const teList = [
                    { id: 'Caja', nombre: 'Entrega en Caja' },
                    { id: 'Pedido', nombre: 'Envío a domicilio' }
                ];
                setTiposEntrega(teList);

                const teMap = {};
                teList.forEach(te => { teMap[te.id] = te.nombre; });
                setTiposEntregaMap(teMap);

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
            const ventasRes = await api.get(url);
            setData(ventasRes.data.results || ventasRes.data || []);
            setNextUrl(ventasRes.data.next || null);
            setPrevUrl(ventasRes.data.previous || null);
        } catch (error) {
            console.error('Error fetching ventas:', error);
            toast.error('Error al cargar las ventas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const url = searchTerm ? `/api/v1/ordenes-de-venta/?search=${searchTerm}` : '/api/v1/ordenes-de-venta/';
            fetchData(url);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const openCreateModal = () => {
        setFormData({
            cliente: '',
            almacen: '',
            pago_inicial: 0,
            metodo_pago: '',
            tipo_entrega: '',
            nota: '',
            direccion_envio: ''
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
    };

    // Called when a product is selected from the SearchableSelect with the full object
    const handleProductoSelected = (productoObj) => {
        // Add to productos array if not already present
        setProductos(prev => {
            if (!prev.find(p => String(p.id) === String(productoObj.id))) {
                return [...prev, productoObj];
            }
            return prev;
        });
        // Add to productosMap for display in cart table
        setProductosMap(prev => ({
            ...prev,
            [productoObj.id]: productoObj.nombre || productoObj.name
        }));
        // Auto-fill unit price
        setCurrentItem(prev => ({
            ...prev,
            precio_unitario: productoObj.precio || ''
        }));
    };

    // Add item to cart list
    const handleAddItem = () => {
        if (!currentItem.producto || !currentItem.cantidad || !currentItem.precio_unitario) {
            toast.error('Completa los datos del producto (Producto, Cantidad, Precio)');
            return;
        }

        if (Number(currentItem.cantidad) < 1) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        if (Number(currentItem.precio_unitario) < 0) {
            toast.error('El precio no puede ser negativo');
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
            toast.error('Debes agregar al menos un producto a la orden');
            return;
        }

        if (!formData.cliente || !formData.almacen || !formData.tipo_entrega) {
            toast.error('Debes seleccionar todos los campos maestros de la orden (Cliente, Almacén, Tipo Entrega)');
            return;
        }

        const payload = {
            almacen: formData.almacen,
            cliente: formData.cliente,
            pago_inicial: Number(formData.pago_inicial),
            metodo_pago: formData.metodo_pago || null,
            tipo_entrega: formData.tipo_entrega,
            nota: formData.nota || null,
            items: cartItems.map(item => ({
                producto: item.producto,
                cantidad: Number(item.cantidad),
                precio_unitario: Number(item.precio_unitario)
            }))
        };

        // Solo enviar direccion_envio si el tipo de entrega no es "Caja"
        const tipoNombre = tiposEntregaMap[formData.tipo_entrega] || '';
        if (tipoNombre.toLowerCase() !== 'caja' && formData.direccion_envio) {
            payload.direccion_envio = formData.direccion_envio;
        }

        try {
            await api.post('/api/v1/ordenes-de-venta/', payload);
            toast.success('Orden de Venta creada exitosamente');
            setIsCreateOpen(false);
            fetchData('/api/v1/ordenes-de-venta/');
        } catch (error) {
            console.error('Error al crear orden:', error);
            const msgs = error.response?.data;
            if (msgs && typeof msgs === 'object') {
                const errorStr = Object.entries(msgs)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
                toast.error(`Error: ${errorStr}`);
            } else {
                toast.error('Ocurrió un error al guardar la orden de venta');
            }
        }
    };

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Órdenes de Venta</h1>
                    <p className="text-[#a1a1aa]">Gestiona las órdenes de venta, despachos e items.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#a1a1aa]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar órdenes de venta..."
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
                        Nueva Venta
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando órdenes...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay ventas registradas.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">No. Orden</th>
                                    <th className="px-6 py-4">Cliente / Fecha</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-center">Estado Pago</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((sale, i) => (
                                    <tr key={sale.id || i} className="hover:bg-[#1a1a1a] subtle-transition">
                                        <td className="px-6 py-4 font-semibold text-[#10b981] whitespace-nowrap">
                                            V-{sale.numero_orden || sale.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{sale.cliente_nombre || 'Cliente General'}</div>
                                            <div className="text-[#a1a1aa] text-xs mt-0.5">{sale.fecha ? new Date(sale.fecha).toLocaleDateString() : 'Sin fecha'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-right">
                                            <div className="text-[#10b981]">{formatearMoneda(sale.total)}</div>
                                            {(sale.saldo_pendiente > 0) && (
                                                <div className="text-[#ef4444] text-xs">Saldo: {formatearMoneda(sale.saldo_pendiente)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded inline-block text-[11px] font-medium tracking-wide border 
                                                ${sale.estado_pago_nombre === 'Pagado' ? 'border-[#10b981] text-[#10b981]'
                                                    : sale.estado_pago_nombre === 'Parcial' ? 'border-[#3b82f6] text-[#3b82f6]'
                                                        : 'border-[#eab308] text-[#eab308]'}`}>
                                                {sale.estado_pago_nombre || sale.estado || 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openDetails(sale)}
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

            {/* CREATE ORDER MODAL */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Generar Nueva Venta"
            /* Optionally pass a larger max-width to the Modal if your component supports it */
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Cliente</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/clientes/"
                                staticOptions={clientes.length > 0 ? clientes : null}
                                name="cliente"
                                required={true}
                                value={formData.cliente}
                                onChange={handleFormChange}
                                placeholder="-- Seleccione un cliente --"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Almacén de Salida</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/almacenes/"
                                staticOptions={almacenes.length > 0 ? almacenes : null}
                                name="almacen"
                                required={true}
                                value={formData.almacen}
                                onChange={handleFormChange}
                                placeholder="-- Seleccione un almacén --"
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
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Tipo de Entrega</label>
                            <SearchableSelect
                                staticOptions={tiposEntrega}
                                name="tipo_entrega"
                                required={true}
                                value={formData.tipo_entrega}
                                onChange={handleFormChange}
                                placeholder="-- Seleccione entrega --"
                            />
                        </div>
                    </div>

                    {/* Dirección de envío - condicional al tipo de entrega */}
                    {(() => {
                        if (!formData.tipo_entrega || !tiposEntregaMap[formData.tipo_entrega]) return null;

                        const tipoNombre = tiposEntregaMap[formData.tipo_entrega].toLowerCase();
                        const palabrasClave = ['envío', 'envio', 'domicilio', 'pedido', 'delivery'];
                        const requiereEnvio = palabrasClave.some(kw => tipoNombre.includes(kw));

                        if (!requiereEnvio) return null;

                        return (
                            <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-xl p-4">
                                <label className="block text-sm font-medium text-[#3b82f6] mb-1">📦 Dirección de Envío</label>
                                <input
                                    type="text"
                                    name="direccion_envio"
                                    required
                                    value={formData.direccion_envio}
                                    onChange={handleFormChange}
                                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3b82f6] subtle-transition"
                                    placeholder="Ej. Calle 123 #45-67, Ciudad"
                                />
                                <p className="text-xs text-[#a1a1aa] mt-1">Se creará un pedido de envío automáticamente.</p>
                            </div>
                        );
                    })()}

                    <div className="border-t border-[#27272a] pt-6">
                        <h4 className="flex items-center gap-2 text-white font-semibold mb-4">
                            <ShoppingCart className="w-4 h-4 text-[#10b981]" />
                            Detalle de Productos
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
                                    onSelectOption={handleProductoSelected}
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
                                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Precio Unit. ($)</label>
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
                                        <th className="px-4 py-2 text-right">Precio</th>
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
                                <p className="text-[#a1a1aa] text-sm">Total Estimado</p>
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
                            Generar Factura
                        </button>
                    </div>
                </form>
            </Modal>


            {/* ORDER DETAILS MODAL (Read-Only) */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`Detalles de Orden V-${selectedOrder?.id}`}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Cliente</p>
                                <p className="text-white font-medium">{selectedOrder.cliente_nombre || 'General'}</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#27272a]">
                                <p className="text-[#a1a1aa] text-xs mb-1">Fecha de Creación</p>
                                <p className="text-white font-medium">{new Date(selectedOrder.fecha).toLocaleString()}</p>
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
                                Productos Incluidos
                            </h4>
                            <div className="bg-[#1a1a1a] border border-[#27272a] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium bg-[#121212]">
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-center">Cant.</th>
                                            <th className="px-4 py-3 text-right">Precio Unit.</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#27272a]">
                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item, idx) => (
                                                <tr key={item.id || idx}>
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
