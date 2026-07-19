import React from "react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

/**
 * AdminRoleLayout structures the workspace for high-privilege users.
 * It includes a container with a sidebar to streamline direct moderation tasks.
 */

export default function AdminRoleLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-slate-200 bg-slate-900 text-slate-200 hidden md:flex md:flex-col">
                <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
                    <span className="text-xl font-black tracking-wider text-white">HEROES</span>
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">HQ Admin</span>
                </div>
                <nav className="flex-1 space-y-1 px-4 py-4">
                    {/* SIDEBAR OPTS */}
                </nav>
            </aside>

            <div className="flex flex-1 flex-col md:pl-64">
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
                    <h1 className="text-sm font-semibold text-slate-700">Control Panel</h1>
                </header>
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}