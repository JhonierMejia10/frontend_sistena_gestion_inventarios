import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`relative w-full ${maxWidth} max-h-full`}>
                <div className="relative bg-[#121212] border border-[#27272a] rounded-xl shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-[#27272a] rounded-t-xl">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {title}
                        </h3>
                        <button
                            type="button"
                            className="text-[#a1a1aa] bg-transparent hover:bg-[#27272a] hover:text-white rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center subtle-transition"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Body */}
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
