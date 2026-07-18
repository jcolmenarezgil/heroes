import React from "react";

interface PublicLayoutProps {
    children: React.ReactNode;
}

/**
 * PublicRoleLayout handles the interface accessible to civilians, family members, and field rescuers.
 * It provides tools for reading and submitting data suggestions during contingency situations.
 */

export default function PublicRoleLayout({ children }: PublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Navbar */}
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight text-blue-600">HEROES</span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Public Portal</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        {/* Links space */}
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}