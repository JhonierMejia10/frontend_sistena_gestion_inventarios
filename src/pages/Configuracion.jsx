import React, { useState } from 'react';
import { Settings, Tags, Warehouse, Users, CreditCard, Truck } from 'lucide-react';
import Categorias from './Categorias';
import Almacenes from './Almacenes';
import Clientes from './Clientes';
import Marcas from './Marcas';
import MediosPago from './MediosPago';
import Proveedores from './Proveedores';

export default function Configuracion() {
    const [activeTab, setActiveTab] = useState('categorias');

    const tabs = [
        { id: 'categorias', label: 'Categorías', icon: Tags },
        { id: 'marcas', label: 'Marcas', icon: Tags },
        { id: 'almacenes', label: 'Almacenes', icon: Warehouse },
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'mediospago', label: 'Medios de Pago', icon: CreditCard },
        { id: 'proveedores', label: 'Proveedores', icon: Truck },
    ];

    return (
        <div className="text-white space-y-6 animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-[#10b981]" />
                    Configuración General
                </h1>
                <p className="text-[#a1a1aa]">Administra catálogos menores y ajustes del sistema</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-[#27272a] mb-6 overflow-x-auto custom-scrollbar">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm subtle-transition whitespace-nowrap border-b-2 ${activeTab === tab.id
                                ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/5'
                                : 'border-transparent text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a]'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-[var(--color-bg-base)]">
                {activeTab === 'categorias' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <Categorias isConfigView={true} />
                    </div>
                )}
                {activeTab === 'almacenes' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <Almacenes isConfigView={true} />
                    </div>
                )}
                {activeTab === 'clientes' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <Clientes isConfigView={true} />
                    </div>
                )}
                {activeTab === 'marcas' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <Marcas isConfigView={true} />
                    </div>
                )}
                {activeTab === 'mediospago' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <MediosPago isConfigView={true} />
                    </div>
                )}
                {activeTab === 'proveedores' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <Proveedores isConfigView={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
