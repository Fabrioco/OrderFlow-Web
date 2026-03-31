"use client";
import { Sidebar } from "@/components/Sidebar";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { createClient } from "@/utils/supabase/client";
import {
  Storefront,
  UserCircle,
  Bell,
  Globe,
  WhatsappLogo,
  CreditCard,
  CaretRight,
  CheckCircle,
  Clock,
  ShieldCheck,
} from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  const { settings } = useTenantSettings(pathname.split("/")[1]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(settings?.is_open);
  const [slug, setSlug] = useState(settings?.slug || "");

  const handleToggleStatus = async () => {
    const newStatus = !isStoreOpen;

    // 1. Update Visual Imediato
    setIsStoreOpen(newStatus);
    setIsUpdating(true);

    // 2. Persistência no Supabase (Seção 4.1 do Doc)
    const { error } = await supabase
      .from("tenants")
      .update({ is_open: newStatus })
      .eq("id", settings.id);

    if (error) {
      // 3. Rollback em caso de erro
      setIsStoreOpen(!newStatus);
      toast.error("Erro ao atualizar status operacional");
    } else {
      toast.success(newStatus ? "Loja Aberta!" : "Loja Fechada");
    }
    setIsUpdating(false);
  };

  const updateSlug = async () => {
    if (slug === settings.slug) return; // Não faz nada se não mudou

    const { error } = await supabase
      .from("tenants")
      .update({ slug: slug })
      .eq("id", settings.id);

    if (error?.code === "23505") {
      // Erro de duplicidade no Postgres
      toast.error("Este endereço já está em uso por outra loja.");
      setSlug(settings.slug); // Volta ao original
    } else if (!error) {
      toast.success("Endereço da loja atualizado!");
      // Opcional: Redirecionar para a nova URL do painel
      router.replace(`/${slug}/painel/configuracoes`);
    }
  };

  const handleConnectMP = () => {
    if (!settings?.id) return;

    // Redireciona para a rota que inicia o fluxo do Mercado Pago
    // Passamos o tenantId para saber quem está conectando no callback
    window.location.href = `/api/auth/mercadopago?tenantId=${settings.id}`;
  };

  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      <div className="bg-noise pointer-events-none" />

      {/* Background Glow */}
      <div className="fixed top-[-10%] right-0 w-[800px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <Sidebar />

      <section className="lg:ml-64 p-8 md:p-12 relative z-10 max-w-7xl mx-auto">
        {/* Header Identitário */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
            <ShieldCheck size={14} weight="bold" />
            Painel de Controle
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">
            Configurações
          </h1>
          <p className="text-text-secondary mt-4 max-w-2xl">
            Gerencie sua identidade visual, horários de funcionamento e
            integrações de pagamento em um só lugar.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Principal: Formulários */}
          <div className="lg:col-span-8 space-y-8">
            {/* Card: Perfil da Loja */}
            <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Storefront size={24} weight="duotone" />
                  </div>
                  <h2 className="text-xl font-bold text-text">
                    Perfil do Estabelecimento
                  </h2>
                </div>
                <button className="text-xs font-black uppercase tracking-widest text-accent hover:brightness-125 transition-all">
                  Salvar Alterações
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Nome da Loja
                  </label>
                  <input
                    type="text"
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none transition-all"
                    placeholder="Ex: Obsidian Burger"
                    defaultValue="The Obsidian Flow"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    URL Personalizada
                  </label>
                  <div className="flex items-center bg-bg border border-border rounded-xl px-4 py-3 focus-within:border-accent">
                    <span className="text-text-muted text-xs mr-1">
                      orderflow.vercel.app/
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => {
                        const sanitized = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-") // Espaço -> Hífen
                          .replace(/[^\w-]+/g, ""); // Remove tudo que não é letra/número/hífen
                        setSlug(sanitized);
                      }}
                      onBlur={updateSlug} // Salva quando o usuário clica fora do campo
                      className="bg-transparent border-none outline-none text-sm w-full font-medium"
                    />
                  </div>{" "}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Bio / Descrição Curta
                  </label>
                  <textarea
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none transition-all h-24 resize-none"
                    placeholder="Conte um pouco sobre sua loja..."
                  />
                </div>
              </div>
            </div>

            {/* Card: Horário de Funcionamento */}
            <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <Clock size={24} weight="duotone" />
                </div>
                <h2 className="text-xl font-bold text-text">
                  Horários & Operação
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-bg border border-border">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full animate-pulse ${storeOpen ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-danger"}`}
                    />
                    <div>
                      <p className="text-sm font-bold text-text">
                        Status da Loja
                      </p>
                      <p className="text-xs text-text-muted">
                        Defina se a loja está aceitando pedidos agora.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className={`relative w-14 h-7 rounded-full transition-all ${isStoreOpen ? "bg-green-500" : "bg-surface-alt border border-border"}`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isStoreOpen ? "left-8" : "left-1"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral: Integrações Rápida */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted ml-2">
              Conexões
            </h3>


            {/* Card Integração: Mercado Pago */}
            <div
              onClick={!settings?.mp_access_token ? handleConnectMP : undefined}
              className={`group bg-surface border border-border rounded-3xl p-6 transition-all cursor-pointer ${
                settings?.mp_access_token
                  ? "hover:border-green-500/30"
                  : "hover:border-accent/30"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-2xl ${settings?.mp_access_token ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"}`}
                >
                  <CreditCard size={28} weight="duotone" />
                </div>

                {/* Badge Dinâmico */}
                <div
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                    settings?.mp_access_token
                      ? "bg-green-500/10 text-green-500"
                      : "bg-surface-alt border border-border text-text-muted"
                  }`}
                >
                  {settings?.mp_access_token ? "Conectado" : "Pendente"}
                </div>
              </div>

              <h4 className="font-bold text-text mb-1">Mercado Pago</h4>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                {settings?.mp_access_token
                  ? "Sua conta está pronta para receber pagamentos via PIX e Cartão."
                  : "Aceite Cartão e PIX diretamente no seu checkout."}
              </p>

              {/* Botão de Ação Dinâmico */}
              <div
                className={`flex items-center gap-2 text-xs font-bold group-hover:gap-3 transition-all ${
                  settings?.mp_access_token ? "text-green-500" : "text-accent"
                }`}
              >
                {settings?.mp_access_token ? (
                  <>
                    {" "}
                    Gerenciar Integração <CaretRight />{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    Conectar Conta <CaretRight />{" "}
                  </>
                )}
              </div>
            </div>
            {/* Dica Enterprise */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
              <p className="text-sm font-bold text-text mb-2">
                Precisa de ajuda?
              </p>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
                Nossa equipe de suporte pode ajudar você a configurar seu
                domínio próprio.
              </p>
              <button className="w-full py-3 rounded-xl bg-surface border border-border text-xs font-bold text-text hover:bg-surface-alt transition-all">
                Falar com Consultor
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
