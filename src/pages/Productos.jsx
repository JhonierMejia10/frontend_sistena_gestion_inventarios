import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { formatearMoneda } from '../utils/formatters';

export default function Productos() {
    const [data, setData] = useState([]);    // Mantenemos solo categorias, marcas y almacenes. Los tipos de producto son estáticos ahora.
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);

    const tiposEstaticos = [
        { id: 'Bienes', nombre: 'Bienes' },
        { id: 'Servicios', nombre: 'Servicios' }
    ];
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        marca: '',
        tipo_producto: '',
        stock_inicial: '',
        almacen: ''
    });

    useEffect(() => {
        const initDefaults = async () => {
            try {
                const [catRes, marcasRes, almacenesRes] = await Promise.all([
                    api.get('/api/v1/categorias/'),
                    api.get('/api/v1/marcas/'),
                    api.get('/api/v1/almacenes/')
                ]);
                setCategorias(catRes.data.results || catRes.data || []);
                setMarcas(marcasRes.data.results || marcasRes.data || []);
                setAlmacenes(almacenesRes.data.results || almacenesRes.data || []);
            } catch (error) {
                console.error('Error fetching dependencies:', error);
            }
        };
        initDefaults();
    }, []);

    const fetchData = async (searchQuery = '') => {
        setLoading(true);
        try {
            const url = searchQuery ? `/api/v1/productos/?search=${searchQuery}` : '/api/v1/productos/';
            const prodRes = await api.get(url);
            setData(prodRes.data.results || prodRes.data || []);
        } catch (error) {
            console.error('Error fetching productos:', error);
            toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            nombre: '',
            descripcion: '',
            precio: '',
            categoria: '',
            marca: '',
            tipo_producto: '',
            stock_inicial: '',
            almacen: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);

        // Extraer IDs en caso de que vengan como objetos anidados
        const getId = (val) => (typeof val === 'object' && val !== null ? val.id : (val || ''));

        setFormData({
            nombre: item.nombre,
            descripcion: item.descripcion || '',
            precio: item.precio || '',
            categoria: getId(item.categoria),
            marca: getId(item.marca),
            tipo_producto: getId(item.tipo_producto),
            stock_inicial: 0, // Ignored in edit typically, but keeping it to avoid undefined errors
            almacen: almacenes.length > 0 ? almacenes[0].id : ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.categoria || !formData.tipo_producto) {
            toast.error('Categoría y Tipo de Producto son obligatorios.');
            return;
        }

        const payload = {
            ...formData,
            marca: formData.marca === '' ? null : formData.marca
        };

        try {
            if (editingItem) {
                // Remove creation fields when editing just in case backend complains about unnecessary fields
                const putPayload = { ...payload };
                delete putPayload.stock_inicial;
                delete putPayload.almacen;

                await api.put(`/api/v1/productos/${editingItem.id}/`, putPayload);
                toast.success('Producto actualizado con éxito');
            } else {

                if (payload.stock_inicial === '' || !payload.almacen) {
                    toast.error('Stock inicial y almacén son requeridos para la creación.');
                    return;
                }

                await api.post('/api/v1/productos/', payload);
                toast.success('Producto creado con éxito');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error al guardar:', error);
            // Mostrar error específico de validación de Django si existe
            const msgs = error.response?.data;
            if (msgs && typeof msgs === 'object') {
                const errorStr = Object.entries(msgs)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
                toast.error(`Error: ${errorStr}`);
            } else {
                toast.error('Error al guardar el producto');
            }
        }
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        try {
            await api.delete(`/api/v1/productos/${deletingItem.id}/`);
            toast.success('Producto eliminado');
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error('Error al eliminar producto');
        }
    };

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Productos</h1>
                    <p className="text-[#a1a1aa]">Gestiona tu catálogo de productos, precios e información detallada.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#a1a1aa]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar productos..."
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
                        Nuevo Producto
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando catálogo...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay productos registrados.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">ID / SKU</th>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4">Categoría / Marca</th>
                                    <th className="px-6 py-4 text-right">Precio</th>
                                    {almacenes.map(al => (
                                        <th key={al.id} className="px-4 py-4 text-center whitespace-nowrap">
                                            <div className="text-xs">{al.nombre}</div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((item, i) => {
                                    // Construir mapa de stock para este producto
                                    const stockMap = {};
                                    (item.stock_por_almacen || []).forEach(s => {
                                        stockMap[s.almacen_id] = s.cantidad;
                                    });

                                    return (
                                        <tr key={i} className="hover:bg-[#1a1a1a] subtle-transition group">
                                            <td className="px-6 py-4 font-medium text-[#a1a1aa] whitespace-nowrap">{item.sku || item.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{item.nombre || item.name}</div>
                                                <div className="text-[#a1a1aa] text-xs mt-0.5 max-w-xs truncate">{item.descripcion || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white">
                                                    {item.categoria_nombre || item.categoria || '-'}
                                                </div>
                                                <div className="text-[#a1a1aa] text-xs mt-0.5">
                                                    {item.marca_nombre || item.marca || 'Sin Marca'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[#10b981] text-right">{formatearMoneda(item.precio || item.price)}</td>
                                            {almacenes.map(al => {
                                                const cant = stockMap[al.id] ?? 0;
                                                return (
                                                    <td key={al.id} className="px-4 py-4 text-center">
                                                        <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold ${cant > 0
                                                            ? 'bg-[#10b981]/15 text-[#10b981]'
                                                            : 'bg-[#27272a] text-[#71717a]'
                                                            }`}>
                                                            {cant}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-[#a1a1aa] hover:text-[#10b981] hover:bg-[#10b981]/10 rounded-md subtle-transition"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Editar Producto" : "Nuevo Producto"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                            placeholder="Nombre del producto"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Precio Unitario ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="precio"
                            required
                            value={formData.precio}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Categoría</label>
                            <SearchableSelect
                                apiEndpoint="/api/v1/categorias/"
                                staticOptions={categorias.length > 0 ? categorias : null}
                                name="categoria"
                                required={true}
                                value={formData.categoria}
                                onChange={handleChange}
                                placeholder="-- Seleccionar --"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Tipo de Producto</label>
                            <SearchableSelect
                                staticOptions={tiposEstaticos}
                                name="tipo_producto"
                                required={true}
                                value={formData.tipo_producto}
                                onChange={handleChange}
                                placeholder="-- Seleccionar --"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Marca (Opcional)</label>
                        <SearchableSelect
                            apiEndpoint="/api/v1/marcas/"
                            staticOptions={marcas.length > 0 ? marcas : null}
                            name="marca"
                            value={formData.marca}
                            onChange={handleChange}
                            placeholder="-- Sin Marca --"
                        />
                    </div>

                    {!editingItem && (
                        <div className="grid grid-cols-2 gap-4 border-t border-[#27272a] pt-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Stock Inicial</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="stock_inicial"
                                    required
                                    value={formData.stock_inicial}
                                    onChange={handleChange}
                                    className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Almacén de Ingreso</label>
                                <SearchableSelect
                                    apiEndpoint="/api/v1/almacenes/"
                                    staticOptions={almacenes.length > 0 ? almacenes : null}
                                    name="almacen"
                                    required={true}
                                    value={formData.almacen}
                                    onChange={handleChange}
                                    placeholder="-- Seleccionar --"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1 mt-2">Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="2"
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition resize-none"
                            placeholder="Detalles adicionales..."
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
                            {editingItem ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
            >
                <div className="space-y-4">
                    <p className="text-[#a1a1aa]">
                        ¿Estás seguro de que deseas eliminar el producto <strong className="text-white">{deletingItem?.nombre}</strong>?
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
