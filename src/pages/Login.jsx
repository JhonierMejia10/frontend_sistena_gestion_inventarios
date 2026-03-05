import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Por favor ingresa usuario y contraseña');
            return;
        }

        setIsSubmitting(true);
        const result = await login(username, password);
        setIsSubmitting(false);

        if (result.success) {
            toast.success('Sesión iniciada correctamente');
            navigate('/dashboard', { replace: true });
        } else {
            toast.error(result.message || 'Credenciales inválidas');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center mb-4 border border-[#10b981]/20">
                        <Box className="w-6 h-6 text-[#10b981]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Inventario Pro</h1>
                    <p className="text-[#a1a1aa] text-sm mt-1">Inicia sesión en tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[#fafafa] mb-1.5" htmlFor="username">
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#121212] border border-[#27272a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] subtle-transition"
                            placeholder="Ingresa tu usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#fafafa] mb-1.5" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#121212] border border-[#27272a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] subtle-transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold rounded-lg px-4 py-3 subtle-transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isSubmitting ? 'Iniciando sesión...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
