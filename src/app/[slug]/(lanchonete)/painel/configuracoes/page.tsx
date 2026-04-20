"use client";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { createClient } from "@/utils/supabase/client";
import {
  Storefront,
  CreditCard,
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
  ChairIcon,
  UserPlusIcon,
  TrashIcon,
  UserIcon,
  PlusIcon,
  TableIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────── */

type Table = {
  id: string;
  number: number;
  label: string | null;
  status: string;
};

type Garcom = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
};

/* ── Component ───────────────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const slug = pathname.split("/")[1];

  const { settings } = useTenantSettings(slug);

  const [isUpdating, setIsUpdating] = useState(false);

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

  // ── Mesas ──
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableLabel, setNewTableLabel] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);

  // ── Garçons ──
  const [garcons, setGarcons] = useState<Garcom[]>([]);
  const [newGarcomEmail, setNewGarcomEmail] = useState("");
  const [loadingGarcons, setLoadingGarcons] = useState(false);

  /* ── Fetch mesas ── */
  const fetchTables = async () => {
    if (!settings?.id) return;
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("tenant_id", settings.id)
      .order("number");
    setTables((data as Table[]) ?? []);
  };

  /* ── Fetch garçons ── */
  const fetchGarcons = async () => {
    if (!settings?.id) return;
    const { data } = await supabase
      .from("tenant_users")
      .select("id, user_id, role, created_at")
      .eq("tenant_id", settings.id)
      .eq("role", "garcom");
    setGarcons((data as Garcom[]) ?? []);
  };

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || "",
        slug: settings.slug || "",
        description: settings.description || "",
        logo_url: settings.logo_url || "",
        phone: settings.phone || "",
        address: settings.address || "",
        city: settings.city || "",
        is_open: settings.is_open ?? true,
        pix_key: settings.pix_key || "",
        pix_key_type: settings.pix_key_type || "",
        payment_methods: settings.payment_methods || ["cash", "pix"],
      });
      fetchTables();
      fetchGarcons();
    }
  }, [settings]);

  /* ── Adicionar mesa ── */
  async function handleAddTable() {
    if (!settings?.id) return;
    setLoadingTables(true);

    const nextNumber =
      tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;

    const label = newTableLabel.trim() || `Mesa ${nextNumber}`;

    const { error } = await supabase.from("tables").insert({
      tenant_id: settings.id,
      number: nextNumber,
      label,
    });

    if (error) {
      toast.error("Erro ao adicionar mesa.");
    } else {
      toast.success(`${label} adicionada!`);
      setNewTableLabel("");
      await fetchTables();
    }
    setLoadingTables(false);
  }

  /* ── Remover mesa ── */
  async function handleRemoveTable(tableId: string, label: string) {
    const { error } = await supabase.from("tables").delete().eq("id", tableId);

    if (error) {
      toast.error("Erro ao remover mesa.");
    } else {
      toast.success(`${label} removida.`);
      await fetchTables();
    }
  }

  /* ── Adicionar garçom ── */
  async function handleAddGarcom() {
    if (!newGarcomEmail.trim() || !settings?.id) return;
    setLoadingGarcons(true);

    // Busca o user pelo email via função RPC ou auth.users
    // Como não temos acesso direto ao auth.users no client,
    // usamos uma API route para isso
    const res = await fetch("/api/admin/invite-garcom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newGarcomEmail.trim(),
        tenantId: settings.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Erro ao adicionar garçom.");
    } else {
      toast.success("Garçom adicionado!");
      setNewGarcomEmail("");
      await fetchGarcons();
    }
    setLoadingGarcons(false);
  }

  /* ── Remover garçom ── */
  async function handleRemoveGarcom(id: string) {
    const { error } = await supabase.from("tenant_users").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao remover garçom.");
    } else {
      toast.success("Garçom removido.");
      await fetchGarcons();
    }
  }

  /* ── Handlers existentes ── */
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
    const fullUrl = `${window.location.origin}/${formData.slug}/cardapio`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link do cardápio copiado!");
  };

  const handleToggleOpen = async () => {
    const newValue = !formData.is_open;
    setFormData((prev) => ({ ...prev, is_open: newValue }));

    const { error } = await supabase
      .from("tenants")
      .update({ is_open: newValue })
      .eq("id", settings.id);

    if (error) {
      // reverte se falhar
      setFormData((prev) => ({ ...prev, is_open: !newValue }));
      toast.error("Erro ao atualizar status da loja.");
    } else {
      toast.success(newValue ? "Loja aberta! ✓" : "Loja fechada.");
    }
  };

  if (!settings)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
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
            className="px-8 py-3 rounded-2xl bg-accent text-menu-text text-sm font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-accent/20"
          >
            {isUpdating ? "Salvando..." : "Salvar Todas as Alterações"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* ── SEÇÃO 1: IDENTIDADE ── */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <Storefront
                  size={20}
                  className="text-accent"
                  weight="duotone"
                />
                <h2 className="font-bold">Identidade & URL</h2>
              </div>
              <div className="p-8 space-y-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-36 h-36 rounded-3xl overflow-hidden bg-bg border-2 border-dashed border-border group-hover:border-accent/50 transition-all flex items-center justify-center">
                      {formData.logo_url ? (
                        <Image
                          fill
                          src={formData.logo_url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <ImageIcon size={40} className="text-text-muted" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-accent text-menu-text flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all">
                      <CameraIcon size={20} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUploadLogo}
                      />
                    </label>
                  </div>
                </div>
                <div className="w-full max-w-2xl mx-auto space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                      Nome da Loja
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-bg border border-border rounded-xl px-4 py-4 text-sm focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                      Link (Slug)
                    </label>
                    <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-4 py-4 focus-within:border-accent overflow-hidden">
                      <span className="text-sm font-bold text-text-muted whitespace-nowrap truncate max-w-[45%]">
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
                        className="flex-1 min-w-0 bg-transparent text-sm outline-none font-bold"
                      />
                      <span className="text-sm font-bold text-text-muted whitespace-nowrap">
                        /cardapio
                      </span>
                      <button onClick={handleCopyLink} className="shrink-0">
                        <CopyIcon
                          size={18}
                          className="text-text-muted hover:text-accent"
                        />
                      </button>
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
                      className="w-full bg-bg border border-border rounded-xl px-4 py-4 text-sm h-28 resize-none outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SEÇÃO 2: LOCALIZAÇÃO ── */}
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

            {/* ── SEÇÃO 3: PAGAMENTOS ── */}
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
                              ? "bg-accent border-accent text-menu-text"
                              : "bg-bg border-border text-text-muted hover:border-accent/50"
                          }`}
                        >
                          {method === "cash"
                            ? "Dinheiro"
                            : method === "pix"
                              ? "PIX Manual"
                              : method === "card_on_delivery"
                                ? "Cartão na Entrega"
                                : "Cartão de Crédito/Débito"}
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

          {/* ── SIDEBAR DIREITA ── */}
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
                  onClick={handleToggleOpen}
                  className={`relative w-12 h-6 rounded-full transition-all ${formData.is_open ? "bg-green-500" : "bg-border"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_open ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
              <div
                className={`p-4 rounded-2xl text-center border ${formData.is_open ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  {formData.is_open ? "Loja Aberta" : "Loja Fechada"}
                </p>
              </div>
            </div>

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
                    : "bg-accent text-menu-text hover:brightness-110"
                }`}
              >
                {settings?.mp_access_token
                  ? "Conectado com Sucesso"
                  : "Conectar agora"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
