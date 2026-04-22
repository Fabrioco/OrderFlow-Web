import { InstagramLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react";

type Props = {
  name?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  instagram_url?: string | null;
  whatsapp_url?: string | null;
};

export function TenantHero({
  name,
  logoUrl,
  bannerUrl,
  primaryColor,
  instagram_url,
  whatsapp_url,
}: Props) {
  const fallbackColor = primaryColor ?? "#f97316";

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative w-full aspect-3/1 md:aspect-4/1 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: bannerUrl
              ? `url(${bannerUrl})`
              : `linear-gradient(135deg, ${fallbackColor}, ${fallbackColor}99)`,
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Conteúdo */}
      <div className="relative px-4 md:px-8 pb-4">
        {/* Header (logo + nome) */}
        <div className="flex items-end gap-3 -mt-12 md:-mt-16">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`Logo ${name}`}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 border-white shadow-lg object-cover shrink-0"
            />
          )}

          <h1 className="text-lg md:text-2xl font-bold text-white leading-tight">
            {name}
          </h1>
        </div>

        {/* Botões */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {instagram_url && (
            <a
              href={`https://instagram.com/${instagram_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur text-xs md:text-sm font-semibold hover:bg-white/10 transition"
            >
              <InstagramLogoIcon size={16} className="text-pink-500" />
              <span className="truncate max-w-30 md:max-w-none">
                @{instagram_url}
              </span>
            </a>
          )}

          {whatsapp_url && (
            <a
              href={`https://wa.me/55${whatsapp_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur text-xs md:text-sm font-semibold hover:bg-white/10 transition"
            >
              <WhatsappLogoIcon size={16} className="text-green-500" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
