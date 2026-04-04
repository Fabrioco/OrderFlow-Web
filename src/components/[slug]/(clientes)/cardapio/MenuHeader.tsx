import { Tenant } from "@/types/supabase";
import Image from "next/image";

export function MenuHeader({ tenant }: { tenant: Tenant }) {
  return (
    <header className="relative h-64 w-full border-b border-[#4A4455]/20 overflow-hidden">
      {tenant?.logo_url ? (
        <Image
          fill
          src={tenant.logo_url}
          alt={tenant.name}
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-[#D2BBFF]/10 to-transparent" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-[#131313] via-[#131313]/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest font-black mb-4 ${
            tenant.is_open
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              tenant.is_open ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          {tenant.is_open ? "Aberto agora" : "Fechado"}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
          {tenant.name}
        </h1>
        {tenant.description && (
          <p className="text-[#CCC3D8] mt-2 max-w-xl text-sm leading-relaxed">
            {tenant.description}
          </p>
        )}
      </div>
    </header>
  );
}
