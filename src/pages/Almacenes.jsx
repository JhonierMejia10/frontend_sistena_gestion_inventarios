import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function Almacenes({ isConfigView = false }) {
    const [data, setData] = useState([]);
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
        direccion: ''
    });

    const fetchData = async (searchQuery = '') => {
        setLoading(true);
        try {
            const url = searchQuery ? `/api/v1/almacenes/?search=${searchQuery}` : '/api/v1/almacenes/';
            const [almacenesRes] = await Promise.all([
                api.get(url)
            ]);
            setData(almacenesRes.data.results || almacenesRes.data || []);
        } catch (error) {
            console.error('Error fetching almacenes or ubicaciones:', error);
            toast.error('Error al cargar datos');
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
        setFormData({ nombre: '', descripcion: '', direccion: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);

        setFormData({
            nombre: item.nombre,
            descripcion: item.descripcion || '',
            direccion: item.direccion || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Formatear payload para Django
        const payload = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            direccion: formData.direccion
        };

        try {
            if (editingItem) {
                await api.put(`/api/v1/almacenes/${editingItem.id}/`, payload);
                toast.success('Almacén actualizado con éxito');
            } else {
                await api.post('/api/v1/almacenes/', payload);
                toast.success('Almacén creado con éxito');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.error('Error al guardar el almacén');
        }
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        try {
            await api.delete(`/api/v1/almacenes/${deletingItem.id}/`);
            toast.success('Almacén eliminado con éxito (stock asociado eliminado)');
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            const msg = error.response?.data?.detail || 'Error al eliminar el almacén';
            toast.error(msg, { duration: 5000 });
        }
    };

    return (
        <div className={`text-white space-y-6 ${!isConfigView ? 'animate-in fade-in duration-500' : ''}`}>
            {!isConfigView && (
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Almacenes</h1>
                        <p className="text-[#a1a1aa]">Gestiona los centros de distribución y bodegas.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-[#a1a1aa]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar almacenes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition w-64 text-sm"
                            />
                        </div>
                        <button
                            onClick={openAddModal}
                            className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium subtle-transition flex items-center gap-2"
                        >
                            <Search className="w-4 h-4 hidden" /> {/* Hidden search icon to force import if not used elsewhere */}
                            <Plus className="w-4 h-4" strokeWidth={3} />
                            Nuevo Almacén
                        </button>
                    </div>
                </div>
            )}

            {isConfigView && (
                <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#a1a1aa]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar almacenes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a1a] border border-[#27272a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition w-64 text-sm"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium subtle-transition flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                        Nuevo Almacén
                    </button>
                </div>
            )}

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando datos...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay almacenes registrados.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Dirección</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((item, i) => (
                                    <tr key={item.id || i} className="hover:bg-[#1a1a1a] subtle-transition group">
                                        <td className="px-6 py-4 font-medium text-[#a1a1aa]">{item.id}</td>
                                        <td className="px-6 py-4 font-semibold text-white">{item.nombre || item.name}</td>
                                        <td className="px-6 py-4 text-[#a1a1aa]">
                                            {item.direccion || '-'}
                                        </td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Editar Almacén" : "Nuevo Almacén"}
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
                            placeholder="Ej. Bodega Principal Sur"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Dirección</label>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition"
                            placeholder="Ej. Calle 123..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="3"
                            className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10b981] subtle-transition resize-none"
                            placeholder="Detalles sobre este almacén..."
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
                            {editingItem ? 'Guardar Cambios' : 'Crear Almacén'}
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
                        ¿Estás seguro de que deseas eliminar el almacén <strong className="text-white">{deletingItem?.nombre}</strong>?
                        Si hay productos enlazados a este almacén, esta acción podría fallar o desencadenar borrados en cascada según las políticas de tu base de datos.
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
