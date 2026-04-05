import { AdminSidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <div className="bg-noise pointer-events-none fixed inset-0 z-0" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-200 h-125 bg-accent/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <AdminSidebar />

      <div className="ml-64 relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
