import { AdminSidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Background Effects */}
      <div className="bg-noise pointer-events-none fixed inset-0 z-0" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-200 h-125 bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Unbound Sidebar (Handles both Mobile & Desktop via Tailwind) */}
      <AdminSidebar />

      {/* Main Content Wrapper:
          - ml-0 no mobile (barra fica embaixo)
          - lg:ml-64 no desktop (espaço para sidebar lateral)
          - pb-24 no mobile para o conteúdo não sumir atrás da bottom nav
      */}
      <main className="relative z-10 min-h-screen transition-all duration-300 ml-0 lg:ml-64 pb-24 lg:pb-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
