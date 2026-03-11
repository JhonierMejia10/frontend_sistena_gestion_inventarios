import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import api from '../utils/api';

export default function SearchableSelect({
    apiEndpoint, // e.g., '/api/v1/categorias/'
    staticOptions = null, // array of {id, nombre} if not fetching from API
    value,       // The current selected ID
    onChange,    // (name, value) => void
    name,
    placeholder = '-- Seleccionar --',
    className = '',
    required = false,
    disabled = false
}) {
    const [options, setOptions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const wrapperRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (staticOptions) {
            setOptions(staticOptions);
            const found = staticOptions.find(o => o.id === value);
            setSelectedOption(found || null);
        } else if (apiEndpoint) {
            fetchOptions('');
        }
    }, [apiEndpoint, staticOptions]);

    // Update selected option when value changes externally
    useEffect(() => {
        if (!value) {
            setSelectedOption(null);
            return;
        }

        // If the value is already in options, set it
        const found = options.find(o => String(o.id) === String(value));
        if (found) {
            setSelectedOption(found);
        } else if (apiEndpoint && value) {
            // Need to fetch the specific selected option from the backend so it displays the name
            fetchSubItem(value);
        }
    }, [value, options, apiEndpoint]);

    const fetchSubItem = async (id) => {
        try {
            const res = await api.get(`${apiEndpoint}${id}/`);
            if (res.data) {
                setSelectedOption(res.data);
                // Also add it to options if not present
                setOptions(prev => {
                    if (!prev.find(p => String(p.id) === String(id))) {
                        return [...prev, res.data];
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Error fetching selected option:', error);
        }
    };

    const fetchOptions = async (searchQuery) => {
        if (!apiEndpoint) return;
        setLoading(true);
        try {
            const url = searchQuery ? `${apiEndpoint}?search=${searchQuery}` : apiEndpoint;
            const res = await api.get(url);
            setOptions(res.data.results || res.data || []);
        } catch (error) {
            console.error(`Error fetching options from ${apiEndpoint}:`, error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        if (staticOptions) {
            // Filter locally
            if (searchTerm) {
                const filtered = staticOptions.filter(o =>
                    (o.nombre || o.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
                setOptions(filtered);
            } else {
                setOptions(staticOptions);
            }
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            if (isOpen) {
                fetchOptions(searchTerm);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, isOpen, staticOptions]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (option) => {
        setSelectedOption(option);
        onChange({ target: { name, value: option.id } });
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* hidden input for basic HTML requires */}
            {required && <input type="hidden" name={name} required={required} value={value || ''} />}

            <div
                className={`w-full bg-[#1a1a1a] border ${isOpen ? 'border-[#10b981]' : 'border-[#27272a]'} rounded-lg px-4 py-2 text-white cursor-pointer flex justify-between items-center subtle-transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? "text-white truncate" : "text-[#a1a1aa] truncate"}>
                    {selectedOption ? (selectedOption.nombre || selectedOption.name || selectedOption.razon_social || selectedOption.id) : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-[#a1a1aa]" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#27272a] rounded-lg shadow-lg overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-[#27272a] flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#a1a1aa]" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            autoFocus
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-white w-full text-sm"
                        />
                    </div>

                    <div className="overflow-y-auto no-scrollbar flex-1 p-1">
                        {loading ? (
                            <div className="p-3 text-center text-sm text-[#a1a1aa]">Cargando...</div>
                        ) : options.length === 0 ? (
                            <div className="p-3 text-center text-sm text-[#a1a1aa]">No se encontraron resultados.</div>
                        ) : (
                            options.map(option => {
                                const isSelected = String(option.id) === String(value);
                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={`px-3 py-2 text-sm rounded-md cursor-pointer flex justify-between items-center subtle-transition ${isSelected ? 'bg-[#10b981]/20 text-[#10b981]' : 'text-white hover:bg-[#27272a]'}`}
                                    >
                                        <span className="truncate">{option.nombre || option.name || option.razon_social || option.id}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
