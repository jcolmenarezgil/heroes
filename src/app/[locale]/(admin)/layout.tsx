import React from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-neutral-900 bg-neutral-950 md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-900 px-6">
          <span className="text-lg font-semibold tracking-tight text-white">
            Heroes
          </span>
          <span className="rounded border border-red-800 bg-red-950 px-2 py-0.5 text-xs font-medium text-red-400">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          {/* Sidebar links will go here */}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="flex h-14 items-center justify-between border-b border-neutral-900 bg-black px-4 md:px-8">
          <h1 className="text-sm font-medium text-white">Control Panel</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
