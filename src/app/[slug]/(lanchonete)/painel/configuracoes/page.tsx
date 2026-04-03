"use client";
import { Sidebar } from "@/components/Sidebar";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { createClient } from "@/utils/supabase/client";
import {
  Storefront,
  CreditCard,
  CaretRight,
  Clock,
  ShieldCheck,
  ImageIcon,
  CameraIcon,
  CopyIcon,
  Phone,
  MapPin,
  Buildings,
  Wallet,
  QrCode,
  CheckCircle,
} from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  const { settings } = useTenantSettings(pathname.split("/")[1]);

  const [isUpdating, setIsUpdating] = useState(false);

  // Estados Unificados conforme a Tabela tenants
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    phone: "",
    address: "",
    city: "",
    is_open: true,
    pix_key: "",
    pix_key_type: "",
    payment_methods: ["cash", "pix"],
  });

  const formatAddressDisplay = (address: any) => {
    if (!address) return "";
    if (typeof address === "string") {
      try {
        const parsed = JSON.parse(address);
        return `${parsed.street}, ${parsed.number} - ${parsed.neighborhood}`;
      } catch {
        return address;
      }
    }
    return `${address.street || ""}, ${address.number || ""} - ${address.neighborhood || ""}`;
  };

  // Atualiza o estado local quando os dados do banco chegam
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || "",
        slug: settings.slug || "",
        description: settings.description || "",
        logo_url: settings.logo_url || "",
        phone: settings.phone || "",
        address: formatAddressDisplay(settings.address) || "",
        city: settings.city || "",
        is_open: settings.is_open ?? true,
        pix_key: settings.pix_key || "",
        pix_key_type: settings.pix_key_type || "",
        payment_methods: settings.payment_methods || ["cash", "pix"],
      });
    }
  }, [settings]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        is_open: formData.is_open,
        pix_key: formData.pix_key,
        pix_key_type: formData.pix_key_type,
        payment_methods: formData.payment_methods,
      })
      .eq("id", settings.id);

    if (error) {
      error.code === "23505"
        ? toast.error("Este endereço (URL) já está em uso.")
        : toast.error("Erro ao salvar alterações.");
    } else {
      toast.success("Configurações atualizadas!");
      if (formData.slug !== settings.slug) {
        router.replace(`/${formData.slug}/painel/configuracoes`);
      }
    }
    setIsUpdating(false);
  };

  const handleTogglePaymentMethod = (method: string) => {
    setFormData((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter((m) => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings?.id) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${settings.id}/logo-${Date.now()}.${fileExt}`;

    toast.promise(
      async () => {
        setIsUpdating(true);
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from("tenants")
          .update({ logo_url: publicUrl })
          .eq("id", settings.id);

        if (updateError) throw updateError;
        setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
        setIsUpdating(false);
      },
      {
        loading: "Enviando logo...",
        success: "Logo atualizada!",
        error: (err) => `Erro: ${err.message}`,
      },
    );
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/${formData.slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link do cardápio copiado!");
  };

  if (!settings)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
      </div>
    );

  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative pb-20">
      <div className="bg-noise pointer-events-none" />

      <section className="lg:ml-64 p-8 md:p-12 relative z-10 max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
              <ShieldCheck size={14} weight="bold" />
              Configurações do Sistema
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text">
              Geral
            </h1>
          </div>
          <button
            onClick={handleUpdateProfile}
            disabled={isUpdating}
            className="px-8 py-3 rounded-2xl bg-accent text-white text-sm font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-accent/20"
          >
            {isUpdating ? "Salvando..." : "Salvar Todas as Alterações"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* --- SEÇÃO 1: IDENTIDADE --- */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <Storefront
                  size={20}
                  className="text-accent"
                  weight="duotone"
                />
                <h2 className="font-bold">Identidade & URL</h2>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  <div className="relative group shrink-0">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden bg-bg border-2 border-dashed border-border group-hover:border-accent/50 transition-all flex items-center justify-center">
                      {formData.logo_url ? (
                        <img
                          src={formData.logo_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={40} className="text-text-muted" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all">
                      <CameraIcon size={20} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUploadLogo}
                      />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                          Nome da Loja
                        </label>
                        <input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                          Link (Slug)
                        </label>
                        <div className="flex items-center bg-bg border border-border rounded-xl px-4 py-3 focus-within:border-accent">
                          <span className="text-sm font-bold text-text-muted">
                            {process.env.NEXT_PUBLIC_URL}/
                          </span>
                          <input
                            value={formData.slug}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                slug: e.target.value
                                  .toLowerCase()
                                  .replace(/\s+/g, "-"),
                              })
                            }
                            className="bg-transparent text-sm w-full outline-none font-bold"
                          />
                          <button onClick={handleCopyLink}>
                            <CopyIcon
                              size={18}
                              className="text-text-muted hover:text-accent"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                        Bio / Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm h-20 resize-none outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SEÇÃO 2: LOCALIZAÇÃO & CONTATO --- */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <MapPin size={20} className="text-accent" weight="duotone" />
                <h2 className="font-bold">Localização & Contato</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-2 ml-1">
                    <Phone size={12} /> WhatsApp/Telefone
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(19) 99999-9999"
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-2 ml-1">
                    <Buildings size={12} /> Cidade
                  </label>
                  <input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-2 ml-1">
                    <MapPin size={12} /> Endereço Completo
                  </label>
                  <input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* --- SEÇÃO 3: PAGAMENTOS MANUAIS --- */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <Wallet size={20} className="text-accent" weight="duotone" />
                <h2 className="font-bold">Pagamento na Entrega / Retirada</h2>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                    Métodos Aceitos
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["cash", "pix", "card_on_delivery", "credit_card"].map(
                      (method) => (
                        <button
                          key={method}
                          onClick={() => handleTogglePaymentMethod(method)}
                          className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            formData.payment_methods.includes(method)
                              ? "bg-accent border-accent text-white"
                              : "bg-bg border-border text-text-muted hover:border-accent/50"
                          }`}
                        >
                          {method === "cash"
                            ? "Dinheiro"
                            : method === "pix"
                              ? "PIX Manual"
                              : method === "card_on_delivery"
                                ? "Cartão na Entrega"
                                : "Cartão de Crédito/Débito"
                          }
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {formData.payment_methods.includes("pix") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-bg border border-border border-dashed">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-2 ml-1">
                        <QrCode size={12} /> Chave PIX
                      </label>
                      <input
                        value={formData.pix_key}
                        onChange={(e) =>
                          setFormData({ ...formData, pix_key: e.target.value })
                        }
                        placeholder="Sua chave aqui"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                        Tipo de Chave
                      </label>
                      <select
                        value={formData.pix_key_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pix_key_type: e.target.value,
                          })
                        }
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm outline-none"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- SIDEBAR DE CONFIGURAÇÕES RÁPIDAS --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Clock
                    size={18}
                    className="text-secondary"
                    weight="duotone"
                  />{" "}
                  Status de Operação
                </div>
                <button
                  onClick={() =>
                    setFormData({ ...formData, is_open: !formData.is_open })
                  }
                  className={`relative w-12 h-6 rounded-full transition-all ${formData.is_open ? "bg-green-500" : "bg-border"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_open ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
              <div
                className={`p-4 rounded-2xl text-center border ${formData.is_open ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-danger/10 border-danger/20 text-danger"}`}
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  {formData.is_open ? "Loja Aberta" : "Loja Fechada"}
                </p>
              </div>
            </div>

            {/* MERCADO PAGO CARD */}
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-2xl ${settings?.mp_access_token ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"}`}
                >
                  <CreditCard size={24} weight="duotone" />
                </div>
                {settings?.mp_access_token && (
                  <CheckCircle
                    size={20}
                    weight="fill"
                    className="text-green-500"
                  />
                )}
              </div>
              <h3 className="font-bold mb-1">Mercado Pago</h3>
              <p className="text-[11px] text-text-muted leading-relaxed mb-4">
                {settings?.mp_access_token
                  ? "Sua integração está ativa. Você pode receber pagamentos via checkout transparente."
                  : "Conecte sua conta para aceitar cartões de crédito e PIX automático com conciliação."}
              </p>
              <button
                onClick={
                  !settings?.mp_access_token
                    ? () =>
                        (window.location.href = `/api/auth/mercadopago?tenantId=${settings.id}`)
                    : undefined
                }
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  settings?.mp_access_token
                    ? "bg-surface-alt border border-border text-text-muted cursor-default"
                    : "bg-accent text-white hover:brightness-110"
                }`}
              >
                {settings?.mp_access_token
                  ? "Conectado com Sucesso"
                  : "Conectar agora"}
              </button>
            </div>

            {/* PLANO ATUAL */}
            {/* <div className="p-6 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
              <p className="text-[10px] font-black uppercase text-accent mb-2">
                Plano Atual
              </p>
              <h4 className="text-xl font-bold capitalize">
                {settings?.plan || "Free"}
              </h4>
              <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                {settings?.plan === "free"
                  ? "Você está no plano gratuito. Faça o upgrade para remover taxas de transação."
                  : "Você possui todos os recursos liberados."}
              </p>
              {settings?.plan === "free" && (
                <button className="w-full mt-4 py-3 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest">
                  Mudar de Plano
                </button>
              )}
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
