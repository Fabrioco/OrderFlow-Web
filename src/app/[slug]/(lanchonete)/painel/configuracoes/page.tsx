"use client";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { createClient } from "@/utils/supabase/client";
import {
  Storefront,
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
  PaintBrushIcon,
  InstagramLogoIcon,
  WhatsappLogoIcon,
  TableIcon,
  PlusIcon,
  TrashIcon,
  Motorcycle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Table = {
  id: string;
  number: number;
  label: string | null;
  status: string;
  is_active: boolean;
};

type DeliveryZone = {
  id: string;
  tenant_id: string;
  neighborhood: string;
  fee: string;
  created_at: string;
};

/* ── Component ───────────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const slug = pathname.split("/")[1];
  const { settings } = useTenantSettings(slug);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableLabel, setNewTableLabel] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);

  /* ── Delivery zones state ── */
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newFee, setNewFee] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    banner_url: "",
    primary_color: "#f97316",
    button_text_color: "#ffffff",
    instagram_url: "",
    whatsapp_url: "",
    phone: "",
    address: "",
    city: "",
    is_open: true,
    pix_key: "",
    pix_key_type: "",
    payment_methods: ["cash", "pix"],
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || "",
        slug: settings.slug || "",
        description: settings.description || "",
        logo_url: settings.logo_url || "",
        banner_url: (settings as any).banner_url || "",
        primary_color: (settings as any).primary_color || "#f97316",
        button_text_color: (settings as any).button_text_color || "#ffffff",
        instagram_url: (settings as any).instagram_url || "",
        whatsapp_url: (settings as any).whatsapp_url || "",
        phone: settings.phone || "",
        address: settings.address || "",
        city: settings.city || "",
        is_open: settings.is_open ?? true,
        pix_key: settings.pix_key || "",
        pix_key_type: settings.pix_key_type || "",
        payment_methods: settings.payment_methods || ["cash", "pix"],
      });
      fetchTables();
      fetchZones(settings.id);
    }
  }, [settings]);

  const fetchTables = async () => {
    if (!settings?.id) return;
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("tenant_id", settings.id)
      .order("number");
    setTables((data as Table[]) ?? []);
  };

  /* ── Buscar zonas de entrega ── */
  const fetchZones = async (tenantId: string) => {
    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("neighborhood");
    setZones((data as DeliveryZone[]) ?? []);
  };

  /* ── Adicionar zona ── */
  const handleAddZone = async () => {
    if (!settings?.id) return;
    const neighborhood = newNeighborhood.trim();
    const fee = parseFloat(newFee.replace(",", "."));

    if (!neighborhood) {
      toast.error("Informe o nome do bairro.");
      return;
    }
    if (isNaN(fee) || fee < 0) {
      toast.error("Informe um valor de frete válido.");
      return;
    }
    const alreadyExists = zones.some(
      (z) => z.neighborhood.toLowerCase() === neighborhood.toLowerCase(),
    );
    if (alreadyExists) {
      toast.error("Esse bairro já está cadastrado.");
      return;
    }

    setLoadingZones(true);
    const { error } = await supabase.from("delivery_zones").insert({
      tenant_id: settings.id,
      neighborhood,
      fee: fee.toFixed(2),
    });

    if (error) {
      toast.error("Erro ao adicionar bairro.");
    } else {
      toast.success(`${neighborhood} adicionado!`);
      setNewNeighborhood("");
      setNewFee("");
      await fetchZones(settings.id);
    }
    setLoadingZones(false);
  };

  /* ── Remover zona ── */
  const handleDeleteZone = async (zone: DeliveryZone) => {
    if (!settings?.id) return;
    const { error } = await supabase
      .from("delivery_zones")
      .delete()
      .eq("id", zone.id);

    if (error) {
      toast.error("Erro ao remover bairro.");
    } else {
      toast.success(`${zone.neighborhood} removido.`);
      await fetchZones(settings.id);
    }
  };

  const formatFee = (fee: string) =>
    parseFloat(fee).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  /* ── Salvar tudo ── */
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
        primary_color: formData.primary_color,
        banner_url: formData.banner_url,
        button_text_color: formData.button_text_color,
        instagram_url: formData.instagram_url || null,
        whatsapp_url: formData.whatsapp_url || null,
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

  /* ── Upload logo ── */
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

  /* ── Upload banner ── */
  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings?.id) return;
    const fileExt = file.name.split(".").pop();
    const fileName = `${settings.id}/banner-${Date.now()}.${fileExt}`;
    toast.promise(
      async () => {
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { cacheControl: "3600", upsert: true });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);
        const { error: updateError } = await supabase
          .from("tenants")
          .update({ banner_url: publicUrl })
          .eq("id", settings.id);
        if (updateError) throw updateError;
        setFormData((prev) => ({ ...prev, banner_url: publicUrl }));
      },
      {
        loading: "Enviando banner...",
        success: "Banner atualizado!",
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
      setFormData((prev) => ({ ...prev, is_open: !newValue }));
      toast.error("Erro ao atualizar status da loja.");
    } else {
      toast.success(newValue ? "Loja aberta! ✓" : "Loja fechada.");
    }
  };

  async function handleAddTable() {
    if (!settings?.id) return;
    setLoadingTables(true);

    const { data, error: fetchError } = await supabase
      .from("tables")
      .select("number")
      .eq("tenant_id", settings.id);

    if (fetchError) {
      console.log(fetchError);
      toast.error("Erro ao calcular número da mesa.");
      setLoadingTables(false);
      return;
    }

    const usedNumbers = (data ?? []).map((t) => t.number);
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    const label = newTableLabel.trim() || `Mesa ${nextNumber}`;

    const { error } = await supabase.from("tables").insert({
      tenant_id: settings.id,
      number: nextNumber,
      label,
    });

    if (error) {
      console.log(error);
      toast.error("Erro ao adicionar mesa.");
    } else {
      toast.success(`${label} adicionada!`);
      setNewTableLabel("");
      await fetchTables();
    }

    setLoadingTables(false);
  }

  async function handleToggleTable(table: Table) {
    if (table.status !== "free") {
      toast.error("Mesa não está livre.");
      return;
    }

    const newState = !table.is_active;

    const { error } = await supabase
      .from("tables")
      .update({ is_active: newState })
      .eq("id", table.id);

    if (error) {
      console.log(error);
      toast.error("Erro ao atualizar mesa.");
      return;
    }

    toast.success(
      newState
        ? `${table.label ?? `Mesa ${table.number}`} ativada.`
        : `${table.label ?? `Mesa ${table.number}`} desativada.`,
    );

    await fetchTables();
  }

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

            {/* ── SEÇÃO 2: APARÊNCIA ── */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <PaintBrushIcon
                  size={20}
                  className="text-accent"
                  weight="duotone"
                />
                <h2 className="font-bold">Aparência do Cardápio</h2>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                      Cor Principal
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primary_color: e.target.value,
                          })
                        }
                        className="w-12 h-12 rounded-xl border border-border cursor-pointer bg-bg p-1 shrink-0"
                      />
                      <span className="font-mono text-xs text-text-muted">
                        {formData.primary_color}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        "#f97316",
                        "#ef4444",
                        "#8b5cf6",
                        "#3b82f6",
                        "#22c55e",
                        "#ec4899",
                        "#f59e0b",
                        "#1c1a17",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setFormData({ ...formData, primary_color: c })
                          }
                          className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor:
                              formData.primary_color === c
                                ? "#1a1814"
                                : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                      Cor do Texto dos Botões
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.button_text_color}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            button_text_color: e.target.value,
                          })
                        }
                        className="w-12 h-12 rounded-xl border border-border cursor-pointer bg-bg p-1 shrink-0"
                      />
                      <span className="font-mono text-xs text-text-muted">
                        {formData.button_text_color}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {["#ffffff", "#000000", "#1a1814", "#f8f7f4"].map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setFormData({ ...formData, button_text_color: c })
                          }
                          className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor:
                              formData.button_text_color === c
                                ? "#6366f1"
                                : "#e8e5e0",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-bg border border-border flex flex-wrap items-center gap-4">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">
                    Prévia
                  </span>
                  <button
                    className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm"
                    style={{
                      backgroundColor: formData.primary_color,
                      color: formData.button_text_color,
                    }}
                  >
                    Adicionar ao carrinho
                  </button>
                  <button
                    className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm"
                    style={{
                      backgroundColor: formData.primary_color,
                      color: formData.button_text_color,
                    }}
                  >
                    Confirmar pedido
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                    Banner do Cardápio{" "}
                    <span className="normal-case font-normal text-text-muted">
                      — recomendado 1200×400px
                    </span>
                  </label>
                  <label className="relative block cursor-pointer group">
                    <div className="w-full h-36 rounded-2xl overflow-hidden border-2 border-dashed border-border group-hover:border-accent/50 transition-all bg-bg flex items-center justify-center">
                      {formData.banner_url ? (
                        <>
                          <Image
                            src={formData.banner_url}
                            alt="Banner"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              Trocar banner
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-text-muted">
                          <ImageIcon size={32} />
                          <span className="text-xs font-bold">
                            Clique para enviar o banner
                          </span>
                          <span className="text-[10px]">
                            PNG, JPG ou WEBP • Máx. 5MB
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleUploadBanner}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* ── SEÇÃO 3: REDES SOCIAIS ── */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <InstagramLogoIcon
                  size={20}
                  className="text-accent"
                  weight="duotone"
                />
                <h2 className="font-bold">Redes Sociais</h2>
              </div>
              <div className="p-8 space-y-5">
                <p className="text-xs text-text-muted">
                  Os links aparecem no rodapé do cardápio online para os
                  clientes.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-2 ml-1">
                    <InstagramLogoIcon size={12} /> Instagram
                  </label>
                  <div className="flex items-center bg-bg border border-border rounded-xl overflow-hidden focus-within:border-accent transition-colors">
                    <span className="px-4 py-3 text-sm text-text-muted font-bold border-r border-border bg-surface-alt/30 whitespace-nowrap">
                      instagram.com/
                    </span>
                    <input
                      value={formData.instagram_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instagram_url: e.target.value,
                        })
                      }
                      placeholder="sualanchonete"
                      className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-text-muted flex items-center gap-2 ml-1">
                    <WhatsappLogoIcon size={12} /> WhatsApp
                  </label>
                  <div className="flex items-center bg-bg border border-border rounded-xl overflow-hidden focus-within:border-accent transition-colors">
                    <span className="px-4 py-3 text-sm text-text-muted font-bold border-r border-border bg-surface-alt/30 whitespace-nowrap">
                      +55
                    </span>
                    <input
                      value={formData.whatsapp_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp_url: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="19999999999"
                      maxLength={11}
                      className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted ml-1">
                    Só números, com DDD. Ex: 19999999999
                  </p>
                </div>

                {(formData.instagram_url || formData.whatsapp_url) && (
                  <div className="mt-2 p-4 rounded-2xl bg-bg border border-border">
                    <p className="text-[10px] font-black uppercase text-text-muted mb-3 tracking-widest">
                      Prévia no cardápio
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {formData.instagram_url && (
                        <a
                          href={`https://instagram.com/${formData.instagram_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-sm font-bold hover:border-accent/50 transition-colors"
                        >
                          <InstagramLogoIcon
                            size={16}
                            className="text-pink-500"
                          />
                          @{formData.instagram_url}
                        </a>
                      )}
                      {formData.whatsapp_url && (
                        <a
                          href={`https://wa.me/55${formData.whatsapp_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-sm font-bold hover:border-accent/50 transition-colors"
                        >
                          <WhatsappLogoIcon
                            size={16}
                            className="text-green-500"
                          />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SEÇÃO 4: LOCALIZAÇÃO ── */}
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

            {/* ── SEÇÃO 5: MESAS ── */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <TableIcon size={20} className="text-accent" weight="duotone" />
                <h2 className="font-bold">Mesas do PDV</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex gap-3">
                  <input
                    value={newTableLabel}
                    onChange={(e) => setNewTableLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
                    placeholder="Ex: Mesa 1, Varanda A, Balcão... (ou deixe vazio para numerar automaticamente)"
                    className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none placeholder:text-text-muted"
                  />
                  <button
                    onClick={handleAddTable}
                    disabled={loadingTables}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                  >
                    <PlusIcon size={14} weight="bold" />
                    Adicionar
                  </button>
                </div>

                {tables.length === 0 ? (
                  <div className="py-10 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-muted gap-2">
                    <TableIcon size={32} weight="thin" className="opacity-30" />
                    <p className="text-sm">Nenhuma mesa cadastrada ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {tables.map((table) => {
                      const isInactive = !table.is_active;
                      return (
                        <div
                          key={table.id}
                          className={`group relative flex flex-col items-center justify-center gap-1 p-4 rounded-2xl border transition-all ${
                            isInactive
                              ? "border-border bg-bg opacity-40"
                              : "border-border bg-bg hover:border-white/20"
                          }`}
                        >
                          <TableIcon
                            size={22}
                            weight="duotone"
                            className="text-text-muted"
                          />
                          <span className="text-sm font-bold text-text text-center">
                            {table.label ?? `Mesa ${table.number}`}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              isInactive
                                ? "text-gray-400"
                                : table.status === "free"
                                  ? "text-emerald-400"
                                  : table.status === "occupied"
                                    ? "text-accent"
                                    : "text-amber-400"
                            }`}
                          >
                            {isInactive
                              ? "Desativada"
                              : table.status === "free"
                                ? "Livre"
                                : table.status === "occupied"
                                  ? "Ocupada"
                                  : "Conta pedida"}
                          </span>
                          {table.status === "free" && (
                            <button
                              onClick={() => handleToggleTable(table)}
                              className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isInactive
                                  ? "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20"
                                  : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                              }`}
                            >
                              {isInactive ? (
                                <CheckCircle size={10} weight="bold" />
                              ) : (
                                <TrashIcon size={10} weight="bold" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-[11px] text-text-muted">
                  Mesas ocupadas não podem ser removidas. Feche a comanda
                  primeiro.
                </p>
              </div>
            </div>

            {/* ── SEÇÃO 6: ZONAS DE ENTREGA ── */}
            <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-surface-alt/20 flex items-center gap-3">
                <Motorcycle
                  size={20}
                  className="text-accent"
                  weight="duotone"
                />
                <h2 className="font-bold">Zonas de Entrega</h2>
                {zones.length > 0 && (
                  <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {zones.length} {zones.length === 1 ? "bairro" : "bairros"}
                  </span>
                )}
              </div>
              <div className="p-8 space-y-6">
                {/* Formulário de adição */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <MapPin
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                    <input
                      value={newNeighborhood}
                      onChange={(e) => setNewNeighborhood(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
                      placeholder="Nome do bairro ou zona"
                      className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:border-accent outline-none placeholder:text-text-muted"
                    />
                  </div>
                  <div className="relative w-full sm:w-36">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none select-none">
                      R$
                    </span>
                    <input
                      value={newFee}
                      onChange={(e) =>
                        setNewFee(e.target.value.replace(/[^0-9,.]/g, ""))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
                      placeholder="0,00"
                      className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:border-accent outline-none placeholder:text-text-muted"
                    />
                  </div>
                  <button
                    onClick={handleAddZone}
                    disabled={loadingZones}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                  >
                    <PlusIcon size={14} weight="bold" />
                    Adicionar
                  </button>
                </div>

                {/* Lista de zonas */}
                {zones.length === 0 ? (
                  <div className="py-10 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-text-muted gap-2">
                    <Motorcycle
                      size={32}
                      weight="thin"
                      className="opacity-30"
                    />
                    <p className="text-sm">
                      Nenhuma zona de entrega cadastrada ainda.
                    </p>
                    <p className="text-[11px] opacity-60">
                      Adicione os bairros que você atende acima.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-surface-alt/30 border-b border-border">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Bairro / Zona
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted text-right">
                        Frete
                      </span>
                      <span className="w-8" />
                    </div>
                    <div className="divide-y divide-border">
                      {zones.map((zone) => (
                        <div
                          key={zone.id}
                          className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-surface-alt/20 transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin
                              size={14}
                              className="text-text-muted shrink-0"
                              weight="duotone"
                            />
                            <span className="text-sm font-medium text-text truncate">
                              {zone.neighborhood}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-accent tabular-nums text-right whitespace-nowrap">
                            {formatFee(zone.fee)}
                          </span>
                          <button
                            onClick={() => handleDeleteZone(zone)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                            title="Remover bairro"
                          >
                            <TrashIcon size={13} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-text-muted">
                  O valor do frete é exibido para o cliente no momento do
                  pedido, de acordo com o bairro informado.
                </p>
              </div>
            </div>

            {/* ── SEÇÃO 7: PAGAMENTOS ── */}
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
                    {["cash", "pix", "card_on_delivery"].map((method) => (
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
                            : "Cartão na Entrega"}
                      </button>
                    ))}
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
                  />
                  Status de Operação
                </div>
                <button
                  onClick={handleToggleOpen}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    formData.is_open ? "bg-green-500" : "bg-border"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      formData.is_open ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
              <div
                className={`p-4 rounded-2xl text-center border ${
                  formData.is_open
                    ? "bg-green-500/10 border-green-500/20 text-green-600"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  {formData.is_open ? "Loja Aberta" : "Loja Fechada"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
