import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function Marcas({ isConfigView = false }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // null means "Create", otherwise holds the object
    const [deletingItem, setDeletingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    const fetchData = async (searchQuery = '') => {
        setLoading(true);
        try {
            const url = searchQuery ? `/api/v1/marcas/?search=${searchQuery}` : '/api/v1/marcas/';
            const response = await api.get(url);
            setData(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching marcas:', error);
            toast.error('Error al cargar las marcas');
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

    // Form handlers
    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ nombre: '', descripcion: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({ nombre: item.nombre, descripcion: item.descripcion || '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/api/v1/marcas/${editingItem.id}/`, formData);
                toast.success('Marca actualizada con éxito');
            } else {
                await api.post('/api/v1/marcas/', formData);
                toast.success('Marca creada con éxito');
            }
            setIsModalOpen(false);
            fetchData(searchTerm);
        } catch (error) {
            console.error('Error al guardar:', error);
            const errStr = error.response?.data?.nombre ? error.response.data.nombre.join(', ') : 'Error al guardar la marca';
            toast.error(errStr);
        }
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        try {
            await api.delete(`/api/v1/marcas/${deletingItem.id}/`);
            toast.success('Marca eliminada');
            setIsDeleteModalOpen(false);
            fetchData(searchTerm);
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error('Error al eliminar la marca centralmente asignada o en uso');
        }
    };

    return (
        <div className={`text-white space-y-6 ${!isConfigView ? 'animate-in fade-in duration-500' : ''}`}>
            {!isConfigView && (
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Marcas</h1>
                        <p className="text-[#a1a1aa]">Organiza tus productos por su marca fabricante.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-[#a1a1aa]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar marcas..."
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
                            Nueva Marca
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
                            placeholder="Buscar marcas..."
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
                        Nueva Marca
                    </button>
                </div>
            )}

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[#a1a1aa]">Cargando datos...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-[#a1a1aa]">No hay marcas registradas.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#27272a] text-[#a1a1aa] font-medium">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {data.map((item, i) => (
                                    <tr key={item.id || i} className="hover:bg-[#1a1a1a] subtle-transition group">
                                        <td className="px-6 py-4 font-medium text-[#a1a1aa]">{item.id}</td>
                                        <td className="px-6 py-4 font-semibold text-white">{item.nombre}</td>
                                        <td className="px-6 py-4 text-[#a1a1aa]">{item.descripcion || '-'}</td>
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
                onClose={handleCloseModal}
                title={editingItem ? "Editar Marca" : "Nueva Marca"}
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
                            placeholder="Ej. Samsung, Apple..."
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
                            placeholder="Breve descripción de la marca..."
                        ></textarea>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-[#27272a]">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-lg subtle-transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] hover:bg-[#059669] rounded-lg subtle-transition"
                        >
                            {editingItem ? 'Guardar Cambios' : 'Crear Marca'}
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
                        ¿Estás seguro de que deseas eliminar la marca <strong className="text-white">{deletingItem?.nombre}</strong>? Esta acción no se puede deshacer y puede afectar productos que la usen.
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
