import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
    return (
        <div className="flex min-h-screen bg-[var(--color-bg-base)]">
            {/* Sidebar fixed to the left */}
            <Sidebar />

            {/* Main content area offset by the sidebar width */}
            <div className="flex-1 ml-64 p-8 bg-[var(--color-bg-base)] min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
