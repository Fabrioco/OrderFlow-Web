"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  StorefrontIcon,
  MapPinIcon,
  CreditCardIcon,
  MotorcycleIcon,
  CheckIcon,
  CaretRightIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { getSupabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────── */

type Section = "lanchonete" | "endereco" | "pagamentos" | "entrega";

type DeliveryZone = { id?: string; neighborhood: string; fee: string };

type Form = {
  name: string;
  slug: string;
  phone: string;
  city: string;
  description: string;
  logo_url: string;
  is_open: boolean;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_zip: string;
  payment_methods: string[];
  pix_key: string;
  pix_key_type: string;
};

const INITIAL_FORM: Form = {
  name: "",
  slug: "",
  phone: "",
  city: "",
  description: "",
  logo_url: "",
  is_open: true,
  address_street: "",
  address_number: "",
  address_neighborhood: "",
  address_city: "",
  address_zip: "",
  payment_methods: ["cash", "pix"],
  pix_key: "",
  pix_key_type: "phone",
};

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  {
    key: "lanchonete",
    label: "Lanchonete",
    icon: <StorefrontIcon size={18} weight="duotone" />,
  },
  {
    key: "endereco",
    label: "Endereço",
    icon: <MapPinIcon size={18} weight="duotone" />,
  },
  {
    key: "pagamentos",
    label: "Pagamentos",
    icon: <CreditCardIcon size={18} weight="duotone" />,
  },
  {
    key: "entrega",
    label: "Entrega",
    icon: <MotorcycleIcon size={18} weight="duotone" />,
  },
];

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Dinheiro", sub: "Na entrega", icon: "💵" },
  { value: "pix", label: "PIX", sub: "Na entrega", icon: "🏦" },
  { value: "credit_card", label: "Crédito", sub: "Maquininha", icon: "💳" },
  { value: "debit_card", label: "Débito", sub: "Maquininha", icon: "💳" },
];

const PIX_KEY_TYPES = [
  { value: "phone", label: "Telefone" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "random", label: "Chave aleatória" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function sectionComplete(s: Section, form: Form, zones: DeliveryZone[]) {
  switch (s) {
    case "lanchonete":
      return !!form.name && !!form.slug && !!form.phone;
    case "endereco":
      return !!form.address_street && !!form.address_city;
    case "pagamentos":
      return form.payment_methods.length > 0;
    case "entrega":
      return zones.some((z) => z.neighborhood && z.fee);
  }
}

/* ── Component ───────────────────────────────────────────────── */

export default function SettingsProfilePage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [active, setActive] = useState<Section>("lanchonete");
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [zones, setZones] = useState<DeliveryZone[]>([
    { neighborhood: "", fee: "" },
  ]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load ── */
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: tu } = await supabase
        .from("tenant_users")
        .select("tenant_id, tenants(*)")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .single();

      if (tu?.tenants) {
        const t = tu.tenants as unknown as Record<string, unknown>;
        setTenantId(tu.tenant_id);
        setForm((prev) => ({
          ...prev,
          name: (t.name as string) || "",
          slug: (t.slug as string) || "",
          phone: (t.phone as string) || "",
          city: (t.city as string) || "",
          logo_url: (t.logo_url as string) || "",
          is_open: t.is_open !== false,
          payment_methods: (t.payment_methods as string[]) || ["cash", "pix"],
          pix_key: (t.pix_key as string) || "",
          pix_key_type: (t.pix_key_type as string) || "phone",
        }));
        if (t.logo_url) setLogoPreview(t.logo_url as string);
        if (t.address) {
          const addr = t.address as Record<string, string>;
          setForm((prev) => ({
            ...prev,
            address_street: addr.street || "",
            address_number: addr.number || "",
            address_neighborhood: addr.neighborhood || "",
            address_city: addr.city || "",
            address_zip: addr.zip || "",
          }));
        }
        const { data: dz } = await supabase
          .from("delivery_zones")
          .select("*")
          .eq("tenant_id", tu.tenant_id)
          .order("neighborhood");
        if (dz?.length)
          setZones(
            dz.map((z) => ({
              id: z.id,
              neighborhood: z.neighborhood,
              fee: String(z.fee),
            })),
          );
      }
    }
    load();
  }, []);

  /* ── Slug ── */
  function handleNameChange(value: string) {
    const s = slugify(value);
    setForm((f) => ({ ...f, name: value, slug: s }));
    validateSlug(s);
  }
  function handleSlugChange(value: string) {
    const s = slugify(value);
    setForm((f) => ({ ...f, slug: s }));
    validateSlug(s);
  }
  function validateSlug(slug: string) {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    setSlugError("");
    if (!slug) return;
    slugTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .neq("id", tenantId ?? "")
        .maybeSingle();
      if (data) setSlugError("Esse endereço já está em uso");
    }, 500);
  }

  /* ── Payments ── */
  function togglePayment(value: string) {
    setForm((f) => ({
      ...f,
      payment_methods: f.payment_methods.includes(value)
        ? f.payment_methods.filter((p) => p !== value)
        : [...f.payment_methods, value],
    }));
  }

  /* ── Zones ── */
  function addZone() {
    setZones((z) => [...z, { neighborhood: "", fee: "" }]);
  }
  function removeZone(i: number) {
    setZones((z) => z.filter((_, idx) => idx !== i));
  }
  function updateZone(i: number, field: keyof DeliveryZone, value: string) {
    setZones((z) =>
      z.map((zone, idx) => (idx === i ? { ...zone, [field]: value } : zone)),
    );
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── Save ── */
  async function handleSave() {
    if (!form.name || !form.slug) {
      showToast("Preencha nome e endereço", false);
      return;
    }
    if (slugError) {
      showToast("Corrija o endereço antes de salvar", false);
      return;
    }
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const payload = {
        name: form.name,
        slug: form.slug,
        phone: form.phone,
        city: form.city,
        logo_url: form.logo_url || null,
        is_open: form.is_open,
        payment_methods: form.payment_methods,
        pix_key: form.pix_key || null,
        pix_key_type: form.pix_key ? form.pix_key_type : null,
        address: {
          street: form.address_street,
          number: form.address_number,
          neighborhood: form.address_neighborhood,
          city: form.address_city,
          zip: form.address_zip,
        },
      };

      let tid = tenantId;
      if (tid) {
        const { error } = await supabase
          .from("tenants")
          .update(payload)
          .eq("id", tid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("tenants")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        tid = data.id;
        setTenantId(tid);
        await supabase
          .from("tenant_users")
          .insert({ user_id: user.id, tenant_id: tid, role: "owner" });
      }

      if (tid) {
        await supabase.from("delivery_zones").delete().eq("tenant_id", tid);
        const valid = zones.filter((z) => z.neighborhood && z.fee);
        if (valid.length)
          await supabase.from("delivery_zones").insert(
            valid.map((z) => ({
              tenant_id: tid,
              neighborhood: z.neighborhood,
              fee: parseFloat(z.fee),
            })),
          );
      }
      showToast("Salvo com sucesso!");
    } catch (e) {
      console.error(e);
      showToast("Erro ao salvar. Tente novamente.", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    await handleSave();
    if (form.slug) router.push(`/${form.slug}/painel/pedidos`);
  }

  const completedCount = SECTIONS.filter((s) =>
    sectionComplete(s.key, form, zones),
  ).length;
  const activeIndex = SECTIONS.findIndex((s) => s.key === active);

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-accent/30 relative">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full h-16 flex items-center justify-between px-6 md:px-10 backdrop-blur-md z-50 border-b border-border bg-bg/20">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tighter text-accent">
            OrderFlow
          </span>
          <span className="hidden sm:block text-border">·</span>
          <span className="hidden sm:block text-sm text-text-muted font-medium">
            Configurar lanchonete
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            {SECTIONS.map((s, i) => (
              <div
                key={s.key}
                className={`rounded-full transition-all duration-300 ${
                  sectionComplete(s.key, form, zones)
                    ? "w-2 h-2 bg-accent"
                    : i === activeIndex
                      ? "w-4 h-2 bg-accent/40"
                      : "w-2 h-2 bg-border"
                }`}
              />
            ))}
            <span className="text-xs text-text-muted ml-1 font-medium">
              {completedCount}/4
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm text-text-secondary hover:text-text font-medium px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            Salvar
          </button>
          <button
            onClick={handleFinish}
            disabled={saving || completedCount < 2}
            className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm bg-linear-to-r from-[#C084FC] to-accent text-white hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ir para o painel
            <CaretRightIcon size={14} weight="bold" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0 pt-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-text-muted px-3 mb-3">
            Configurações
          </p>
          {SECTIONS.map((s, i) => {
            const done = sectionComplete(s.key, form, zones);
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border ${
                  isActive
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "text-text-secondary hover:text-text hover:bg-surface-alt border-transparent"
                }`}
              >
                <span
                  className={
                    isActive
                      ? "text-accent"
                      : "text-text-muted group-hover:text-text-secondary"
                  }
                >
                  {s.icon}
                </span>
                <span className="flex-1">{s.label}</span>
                {done ? (
                  <CheckIcon
                    size={13}
                    weight="bold"
                    className="text-accent shrink-0"
                  />
                ) : (
                  <span className="text-[10px] text-text-muted/40 font-mono shrink-0">
                    0{i + 1}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-6 p-4 rounded-xl border border-border bg-surface">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-text-muted">
                Progresso
              </span>
              <span className="text-xs font-bold text-accent">
                {Math.round((completedCount / 4) * 100)}%
              </span>
            </div>
            <div className="w-full h-1 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-[#C084FC] to-accent rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 4) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Mobile bottom tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-bg/95 backdrop-blur-md border-t border-border px-2 py-2 gap-1">
          {SECTIONS.map((s) => {
            const done = sectionComplete(s.key, form, zones);
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? "text-accent bg-accent/10" : "text-text-muted"
                }`}
              >
                {s.icon}
                {s.label}
                {done && <span className="w-1 h-1 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          {/* ── LANCHONETE ── */}
          {active === "lanchonete" && (
            <FormSection
              title="Sua lanchonete"
              subtitle="Informações que aparecem no cardápio público"
            >
              <div className="flex items-center gap-5 p-5 rounded-2xl border border-border bg-surface">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-surface-alt flex items-center justify-center overflow-hidden shrink-0 text-3xl">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🏪"
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text mb-1.5">
                    Logo da lanchonete
                  </p>
                  <input
                    className={inputCls}
                    placeholder="Cole o link de uma imagem..."
                    value={form.logo_url}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, logo_url: e.target.value }));
                      setLogoPreview(e.target.value);
                    }}
                  />
                  <p className="text-xs text-text-muted mt-1.5">
                    Upload por arquivo em breve.
                  </p>
                </div>
              </div>

              <Field label="Nome da lanchonete *">
                <input
                  className={inputCls}
                  placeholder="Ex: Cachorro Quente Imperador"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </Field>

              <Field
                label="Endereço público (slug) *"
                hint={
                  form.slug
                    ? `seuapp.com/${form.slug}`
                    : "seuapp.com/minha-lanchonete"
                }
              >
                <input
                  className={`${inputCls} ${slugError ? "border-red-500/50! focus:border-red-500!" : ""}`}
                  placeholder="minha-lanchonete"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
                {slugError && (
                  <p className="text-xs text-red-400 mt-1.5">⚠ {slugError}</p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Telefone / WhatsApp *">
                  <input
                    className={inputCls}
                    placeholder="(19) 99999-9999"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Cidade">
                  <input
                    className={inputCls}
                    placeholder="Campinas"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <Field label="Descrição curta">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Os melhores cachorros quentes da cidade..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>

              <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-surface">
                <div>
                  <p className="text-sm font-bold text-text">Loja aberta</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Clientes podem fazer pedidos agora
                  </p>
                </div>
                <Toggle
                  checked={form.is_open}
                  onChange={(v) => setForm((f) => ({ ...f, is_open: v }))}
                />
              </div>

              <NextBtn onClick={() => setActive("endereco")} />
            </FormSection>
          )}

          {/* ── ENDEREÇO ── */}
          {active === "endereco" && (
            <FormSection title="Endereço" subtitle="Onde fica sua lanchonete">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="Rua / Avenida *">
                    <input
                      className={inputCls}
                      placeholder="Rua das Acácias"
                      value={form.address_street}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address_street: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Número">
                  <input
                    className={inputCls}
                    placeholder="123"
                    value={form.address_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address_number: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Bairro">
                  <input
                    className={inputCls}
                    placeholder="Centro"
                    value={form.address_neighborhood}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address_neighborhood: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="CEP">
                  <input
                    className={inputCls}
                    placeholder="13000-000"
                    value={form.address_zip}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address_zip: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Cidade *">
                <input
                  className={inputCls}
                  placeholder="Campinas"
                  value={form.address_city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address_city: e.target.value }))
                  }
                />
              </Field>
              <NextBtn onClick={() => setActive("pagamentos")} />
            </FormSection>
          )}

          {/* ── PAGAMENTOS ── */}
          {active === "pagamentos" && (
            <FormSection
              title="Pagamentos"
              subtitle="Quais métodos você aceita na entrega"
            >
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map((opt) => {
                  const checked = form.payment_methods.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => togglePayment(opt.value)}
                      className={`group flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                        checked
                          ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                          : "border-border bg-surface hover:border-accent/40 hover:bg-surface-alt"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text">
                          {opt.label}
                        </p>
                        <p className="text-xs text-text-muted">{opt.sub}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? "border-accent bg-accent" : "border-border"
                        }`}
                      >
                        {checked && (
                          <CheckIcon
                            size={10}
                            weight="bold"
                            className="text-white"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.payment_methods.includes("pix") && (
                <div className="p-5 rounded-2xl border border-accent/20 bg-accent/5">
                  <p className="text-sm font-bold text-text mb-4">
                    🏦 Chave PIX
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tipo da chave">
                      <select
                        className={inputCls}
                        value={form.pix_key_type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pix_key_type: e.target.value,
                          }))
                        }
                      >
                        {PIX_KEY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Chave">
                      <input
                        className={inputCls}
                        placeholder={
                          form.pix_key_type === "phone"
                            ? "(19) 99999-9999"
                            : form.pix_key_type === "email"
                              ? "email@exemplo.com"
                              : form.pix_key_type === "cpf"
                                ? "000.000.000-00"
                                : form.pix_key_type === "cnpj"
                                  ? "00.000.000/0000-00"
                                  : "Cole sua chave"
                        }
                        value={form.pix_key}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, pix_key: e.target.value }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              <NextBtn onClick={() => setActive("entrega")} />
            </FormSection>
          )}

          {/* ── ENTREGA ── */}
          {active === "entrega" && (
            <FormSection
              title="Zonas de entrega"
              subtitle="Bairros que você atende e a taxa de cada um"
            >
              <div className="space-y-2">
                {zones.map((zone, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder="Nome do bairro"
                      value={zone.neighborhood}
                      onChange={(e) =>
                        updateZone(i, "neighborhood", e.target.value)
                      }
                    />
                    <div className="relative w-36 shrink-0">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">
                        R$
                      </span>
                      <input
                        className={`${inputCls} pl-9`}
                        placeholder="5,00"
                        type="number"
                        min="0"
                        step="0.50"
                        value={zone.fee}
                        onChange={(e) => updateZone(i, "fee", e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => removeZone(i)}
                      disabled={zones.length === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-20"
                    >
                      <XIcon size={14} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addZone}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-accent text-text-muted hover:text-accent text-sm py-3.5 rounded-2xl transition-all font-medium"
              >
                <PlusIcon size={16} weight="bold" /> Adicionar bairro
              </button>

              <div className="pt-4 mt-2 border-t border-border flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 border border-border bg-surface hover:bg-surface-alt text-text-secondary hover:text-text text-sm py-3.5 rounded-xl transition font-semibold disabled:opacity-40"
                >
                  {saving ? "Salvando..." : "Salvar rascunho"}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-[#C084FC] to-accent text-white text-sm py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(139,92,246,0.3)] disabled:opacity-40"
                >
                  {saving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <span>Concluir</span>{" "}
                      <CaretRightIcon size={14} weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </FormSection>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl pointer-events-none z-50 ${
            toast.ok ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
          }`}
        >
          {toast.ok ? "✓ " : "⚠ "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

const inputCls = [
  "w-full bg-surface border border-border rounded-xl px-3.5 py-2.5",
  "text-sm text-text placeholder:text-text-muted",
  "focus:outline-none focus:border-accent/60 focus:bg-surface-alt",
  "transition-all",
].join(" ");

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-text">{title}</h2>
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

/* Toggle — w-11 (44px), knob w-4 (16px)
   OFF → translate-x-1 (4px)   | knob right edge: 4+16 = 20px  ✓
   ON  → translate-x-6 (24px)  | knob right edge: 24+16 = 40px < 44px ✓ */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        checked
          ? "bg-accent shadow-[0_0_12px_rgba(139,92,246,0.5)]"
          : "bg-surface-alt border border-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NextBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-linear-to-r from-[#C084FC] to-accent text-white hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)]"
      >
        Próximo <CaretRightIcon size={14} weight="bold" />
      </button>
    </div>
  );
}
