"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  CreditCard,
  ArrowRight,
  MapPin,
  User,
  Phone,
  CaretLeft,
  CheckCircle,
  Money,
  Bank,
} from "@phosphor-icons/react";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────── */

interface Category {
  name: string;
  emoji: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  categories: Category;
}

/* No bloco de Types */
interface Addon {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

interface CartItem extends Product {
  quantity: number;
  selected_addons: Addon[]; // Adicionado para rastrear extras
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_open: boolean;
  description: string | null;
  logo_url: string | null;
  payment_methods: string[];
  pix_key: string | null;
  pix_key_type: string | null;
  mp_public_key: string | null;
}

interface DeliveryZone {
  id: string;
  neighborhood: string;
  fee: number;
}

interface CustomerForm {
  name: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  payment_method: string;
  observation: string;
}

type Step = "cart" | "info";

const BLANK_FORM: CustomerForm = {
  name: "",
  phone: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  payment_method: "",
  observation: "",
};

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> =
  {
    pix: {
      label: "PIX — na entrega",
      icon: <Bank size={20} weight="duotone" />,
    },
    cash: {
      label: "Dinheiro — na entrega",
      icon: <Money size={20} weight="duotone" />,
    },
    credit_card: {
      label: "Cartão de Crédito",
      icon: <CreditCard size={20} weight="duotone" />,
    },
    debit_card: {
      label: "Cartão de Débito",
      icon: <CreditCard size={20} weight="duotone" />,
    },
  };

/* ── Component ───────────────────────────────────────────────── */

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = createClient();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [mpReady, setMpReady] = useState(false);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState<CustomerForm>(BLANK_FORM);
  const [processing, setProcessing] = useState(false);

  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(
    null,
  );
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);

  /* ── Fetch ── */
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: tenantData, error: tErr } = await supabase
          .from("tenants")
          .select(
            "id, name, slug, is_open, description, logo_url, payment_methods, pix_key, pix_key_type, mp_public_key",
          )
          .eq("slug", slug)
          .single();

        if (tErr || !tenantData) throw new Error("Lanchonete não encontrada");
        setTenant(tenantData as Tenant);

        // Inicializa o SDK do MP com a public key do lojista
        if (tenantData.mp_public_key) {
          initMercadoPago(tenantData.mp_public_key, { locale: "pt-BR" });
          setMpReady(true);
        }

        const [{ data: prods }, { data: dz }, { data: ads }] =
          await Promise.all([
            supabase
              .from("products")
              .select(
                "id, name, description, price, image_url, categories(name, emoji)",
              )
              .eq("tenant_id", tenantData.id)
              .eq("is_available", true)
              .order("sort_order"),

            supabase
              .from("delivery_zones")
              .select("id, neighborhood, fee")
              .eq("tenant_id", tenantData.id)
              .order("neighborhood"),

            supabase
              .from("addons")
              .select("id, name, price, is_available")
              .eq("tenant_id", tenantData.id)
              .eq("is_available", true)
              .order("name"),
          ]);

        setProducts((prods as unknown as Product[]) ?? []);
        setZones((dz as DeliveryZone[]) ?? []);
        setAddons((ads as Addon[]) ?? []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug]);

  /* ── Cart helpers ── */
  // 1. Função que de fato salva na sacola
  function confirmAddToCart() {
    if (!customizingProduct) return;

    setCart((prev) => {
      // Criamos uma chave única baseada no ID + Adicionais para não agrupar itens com extras diferentes
      const addonIds = selectedAddons
        .map((a) => a.id)
        .sort()
        .join(",");
      const exists = prev.find(
        (i) =>
          i.id === customizingProduct.id &&
          i.selected_addons
            .map((a) => a.id)
            .sort()
            .join(",") === addonIds,
      );

      if (exists) {
        return prev.map((i) =>
          i === exists ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }

      return [
        ...prev,
        { ...customizingProduct, quantity: 1, selected_addons: selectedAddons },
      ];
    });

    toast.success(`${customizingProduct.name} adicionado!`);
    setCustomizingProduct(null);
    setSelectedAddons([]);
  }

  // Adicione esta função ou ajuste a handleProductClick
  function addToCartDirect(product: Product) {
    setCart((prev) => {
      const exists = prev.find(
        (i) => i.id === product.id && i.selected_addons.length === 0,
      );
      if (exists) {
        return prev.map((i) =>
          i === exists ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...product, quantity: 1, selected_addons: [] }];
    });
    toast.success(`${product.name} adicionado!`);
  }

  function handleProductClick(product: Product) {
    if (addons.length > 0) {
      setCustomizingProduct(product);
      setSelectedAddons([]);
    } else {
      addToCartDirect(product); // Agora a função existe
    }
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const exists = prev.find(
        (i) => i.id === product.id && i.selected_addons.length === 0,
      );

      if (exists) {
        return prev.map((i) =>
          i === exists ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }

      return [...prev, { ...product, quantity: 1, selected_addons: [] }];
    });

    toast.success(`${product.name} adicionado!`);
  }
  function removeFromCart(id: string) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  }

  function openCart() {
    setStep("cart");
    setIsCartOpen(true);
  }

  const cartTotal = cart.reduce((acc, item) => {
    const addonsPrice =
      item.selected_addons?.reduce((sum, a) => sum + Number(a.price), 0) ?? 0;
    return acc + (Number(item.price) + addonsPrice) * item.quantity;
  }, 0);
  const selectedZone = zones.find((z) => z.neighborhood === form.neighborhood);
  const deliveryFee = selectedZone?.fee ?? 0;
  const totalFinal = cartTotal + deliveryFee;
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
  const isCardPayment = ["credit_card", "debit_card"].includes(
    form.payment_method,
  );

  /* ── Validation ── */
  function validateInfo(): boolean {
    if (!form.name.trim()) {
      toast.error("Informe seu nome");
      return false;
    }
    if (!form.phone.trim()) {
      toast.error("Informe seu WhatsApp");
      return false;
    }
    if (!form.street.trim()) {
      toast.error("Informe a rua");
      return false;
    }
    if (!form.number.trim()) {
      toast.error("Informe o número");
      return false;
    }
    if (!form.neighborhood) {
      toast.error("Selecione o bairro");
      return false;
    }
    if (!form.payment_method) {
      toast.error("Selecione a forma de pagamento");
      return false;
    }
    return true;
  }

  const getErrorMessage = (detail: string) => {
    switch (detail) {
      case "cc_rejected_high_risk":
        return "Pagamento recusado por segurança. Tente outro cartão.";
      case "cc_rejected_insufficient_amount":
        return "Saldo insuficiente.";
      case "cc_rejected_bad_filled_card_number":
        return "Número do cartão inválido.";
      default:
        return "Pagamento recusado.";
    }
  };

  /* ── Checkout ─────────────────────────────────────────────────
     mpFormData vem do brick quando o pagamento é cartão.
     Para PIX e dinheiro, é undefined.
  ── */
  async function handleCheckout(mpFormData?: any) {
    if (!validateInfo() || !tenant) return;

    setProcessing(true);

    // ✅ DEBUG REAL

    try {
      // 🔥 GARANTE SERIALIZAÇÃO LIMPA
      const cleanFormData = mpFormData
        ? JSON.parse(JSON.stringify(mpFormData))
        : null;

      // ❌ BLOQUEIA se estiver vazio (cartão exige isso)
      if (isCardPayment && !cleanFormData?.payer?.email) {
        throw new Error("Dados do pagador não preenchidos.");
      }

      const res = await fetch("/api/mp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          order_data: {
            tenantSlug: slug,
            customer_name: form.name,
            customer_phone: form.phone,
            payment_method: form.payment_method,
            subtotal: cartTotal,
            delivery_fee: deliveryFee,
            total: totalFinal,
            observation: form.observation || null,
            delivery_address: {
              street: form.street,
              number: form.number,
              neighborhood: form.neighborhood,
              complement: form.complement,
            },
          },
          items: cart.map((i) => ({
            id: i.id,
            title: i.name,
            unit_price: i.price,
            quantity: i.quantity,
            selected_addons: i.selected_addons, // Envia o array de adicionais para salvar em order_items
          })),
          use_mp: isCardPayment,
          mp_form_data: cleanFormData,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        const message = getErrorMessage(json.error?.detail);
        throw new Error(message);
      }

      toast.success("Pedido realizado com sucesso!");
      router.push(`/${slug}/meus-pedidos/${json.orderId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }
  /* ── Categories ── */
  const categories = [
    "Todos",
    ...Array.from(
      new Set(products.map((p) => p.categories?.name).filter(Boolean)),
    ),
  ];

  const filteredProds =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => p.categories?.name === activeCategory);

  /* ── Loading / Not found ── */
  if (loading)
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#D2BBFF]" />
      </div>
    );

  if (!tenant)
    return (
      <div className="min-h-screen bg-[#131313] text-white flex items-center justify-center">
        <p>Lanchonete não encontrada.</p>
      </div>
    );

  /* ── Render ── */
  return (
    <main className="min-h-screen bg-[#131313] text-[#E5E2E1] font-sans relative pb-32 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Store header */}
      <header className="relative h-64 w-full border-b border-[#4A4455]/20 overflow-hidden">
        {tenant.logo_url ? (
          <img
            src={tenant.logo_url}
            alt={tenant.name}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#D2BBFF]/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/50 to-transparent" />
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

      {/* Category nav */}
      <nav className="px-6 md:px-16 mt-6 sticky top-0 z-40 bg-[#131313]/90 backdrop-blur-xl py-4 border-b border-[#4A4455]/20">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeCategory === cat
                  ? "bg-[#D2BBFF] text-[#25005A] border-[#D2BBFF] shadow-[0_0_20px_rgba(210,187,255,0.25)]"
                  : "bg-[#1C1B1B] border-[#4A4455]/40 text-[#CCC3D8] hover:border-[#D2BBFF]/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Products */}
      <section className="px-6 md:px-16 mt-10 max-w-7xl mx-auto">
        {!tenant.is_open && (
          <div className="mb-8 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold text-center">
            Esta lanchonete está fechada no momento. Volte mais tarde!
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProds.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                if (!tenant.is_open) return;
                handleProductClick(product);
              }}
              disabled={!tenant.is_open}
              className="group text-left bg-[#1C1B1B] border border-[#4A4455]/20 rounded-[2rem] p-5 flex gap-5 hover:border-[#D2BBFF]/40 transition-all relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-[#131313] flex items-center justify-center text-4xl shadow-inner">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  product.categories?.emoji
                )}
              </div>
              <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                <div>
                  <h3 className="font-black text-white text-base uppercase tracking-tight italic group-hover:text-[#D2BBFF] transition-colors truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#CCC3D8] line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-black text-[#D2BBFF] text-lg">
                    {Number(product.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#D2BBFF]/10 text-[#D2BBFF] flex items-center justify-center group-hover:bg-[#D2BBFF] group-hover:text-[#25005A] transition-all">
                    <Plus size={18} weight="bold" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Floating cart button */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-25 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg z-50">
          <button
            onClick={openCart}
            className="w-full h-16 bg-[#D2BBFF] text-[#25005A] font-black rounded-[2rem] flex items-center justify-between px-7 shadow-[0_20px_50px_rgba(210,187,255,0.3)] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingBag size={28} weight="bold" />
                <span className="absolute -top-1 -right-1 bg-[#25005A] text-[#D2BBFF] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {cartCount}
                </span>
              </div>
              <span className="text-xs uppercase tracking-widest">
                Ver sacola
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black">
                {cartTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
              <ArrowRight size={18} weight="bold" />
            </div>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-[#131313]/90 backdrop-blur-md"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#1C1B1B] border-l border-[#4A4455]/30 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer header */}
            <div className="p-6 border-b border-[#4A4455]/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {step !== "cart" && (
                  <button
                    onClick={() => setStep("cart")}
                    className="p-1.5 hover:bg-[#2A2A2A] rounded-full transition-colors text-[#CCC3D8]"
                  >
                    <CaretLeft size={18} weight="bold" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                    {step === "cart" ? "Sua Sacola" : "Seus Dados"}
                  </h2>
                  <div className="flex gap-1 mt-1">
                    {(["cart", "info"] as Step[]).map((s, i) => (
                      <div
                        key={s}
                        className={`h-0.5 rounded-full transition-all duration-300 ${
                          s === step
                            ? "w-6 bg-[#D2BBFF]"
                            : i < (["cart", "info"] as Step[]).indexOf(step)
                              ? "w-3 bg-[#D2BBFF]/60"
                              : "w-3 bg-[#4A4455]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-[#2A2A2A] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── STEP: CART ── */}
            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 items-center p-3 rounded-2xl border border-[#4A4455]/20 bg-[#131313]/50"
                    >
                      <div className="w-16 h-16 rounded-xl bg-[#131313] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          item.categories?.emoji
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white text-sm uppercase tracking-tight truncate">
                          {item.name}
                        </h4>
                        <p className="text-[#D2BBFF] font-black text-sm mt-0.5">
                          {(Number(item.price) * item.quantity).toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-[#0D0D0D] p-1 rounded-xl border border-[#4A4455]/30">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 flex items-center justify-center hover:text-[#D2BBFF] transition-colors"
                        >
                          <Minus size={14} weight="bold" />
                        </button>
                        <span className="text-sm font-black w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 flex items-center justify-center hover:text-[#D2BBFF] transition-colors"
                        >
                          <Plus size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 pb-28 bg-[#201F1F] border-t border-[#4A4455]/20 space-y-4 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[#CCC3D8] text-xs font-bold uppercase tracking-widest">
                      Subtotal
                    </span>
                    <span className="font-black text-white">
                      {cartTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep("info")}
                    className="w-full py-4 bg-[#D2BBFF] text-[#25005A] font-black rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(210,187,255,0.2)]"
                  >
                    Continuar <ArrowRight size={18} weight="bold" />
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: INFO ── */}
            {step === "info" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <InfoField label="Nome completo" icon={<User size={16} />}>
                    <input
                      className={inputCls}
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </InfoField>

                  <InfoField label="WhatsApp" icon={<Phone size={16} />}>
                    <input
                      className={inputCls}
                      placeholder="(11) 99999-9999"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </InfoField>

                  <InfoField label="Bairro" icon={<MapPin size={16} />}>
                    <select
                      className={inputCls}
                      value={form.neighborhood}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, neighborhood: e.target.value }))
                      }
                    >
                      <option value="">Selecione o bairro</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.neighborhood}>
                          {z.neighborhood} — taxa R${" "}
                          {z.fee.toFixed(2).replace(".", ",")}
                        </option>
                      ))}
                    </select>
                  </InfoField>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <InfoField label="Rua / Avenida">
                        <input
                          className={inputCls}
                          placeholder="Rua das Flores"
                          value={form.street}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, street: e.target.value }))
                          }
                        />
                      </InfoField>
                    </div>
                    <InfoField label="Número">
                      <input
                        className={inputCls}
                        placeholder="123"
                        value={form.number}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, number: e.target.value }))
                        }
                      />
                    </InfoField>
                  </div>

                  <InfoField label="Complemento (opcional)">
                    <input
                      className={inputCls}
                      placeholder="Apto, bloco..."
                      value={form.complement}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, complement: e.target.value }))
                      }
                    />
                  </InfoField>

                  <InfoField label="Observação (opcional)">
                    <textarea
                      className={`${inputCls} resize-none h-20`}
                      placeholder="Alguma observação para o pedido?"
                      value={form.observation}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, observation: e.target.value }))
                      }
                    />
                  </InfoField>

                  {/* Seletor de forma de pagamento */}
                  <div>
                    <label className="block text-[10px] font-black text-[#CCC3D8] uppercase tracking-widest mb-2">
                      Forma de pagamento
                    </label>
                    <div className="space-y-2">
                      {(tenant.payment_methods ?? []).map((method) => {
                        const meta = PAYMENT_LABELS[method];
                        if (!meta) return null;
                        return (
                          <button
                            key={method}
                            onClick={() =>
                              setForm((f) => ({ ...f, payment_method: method }))
                            }
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                              form.payment_method === method
                                ? "border-[#D2BBFF] bg-[#D2BBFF]/5 text-white"
                                : "border-[#4A4455]/30 bg-[#131313]/50 text-[#CCC3D8] hover:border-[#D2BBFF]/30"
                            }`}
                          >
                            <span
                              className={
                                form.payment_method === method
                                  ? "text-[#D2BBFF]"
                                  : "text-[#CCC3D8]"
                              }
                            >
                              {meta.icon}
                            </span>
                            <span className="font-bold text-sm">
                              {meta.label}
                            </span>
                            {form.payment_method === method && (
                              <CheckCircle
                                size={18}
                                weight="fill"
                                className="text-[#D2BBFF] ml-auto"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brick do MP — aparece inline quando cartão é selecionado.
                      O brick tem seu próprio botão de submit, então
                      o footer com "Confirmar Pedido" fica oculto nesse caso. */}
                  {isCardPayment && mpReady && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-black text-[#CCC3D8] uppercase tracking-widest mb-3">
                        Dados do cartão
                      </label>
                      <div className="rounded-2xl overflow-hidden border border-[#4A4455]/30">
                        <CardPayment
                          initialization={{ amount: totalFinal }}
                          customization={{
                            paymentMethods: {
                              minInstallments: 1,
                              maxInstallments: 1,
                            },
                            visual: {
                              style: {
                                theme: "dark",
                                customVariables: {
                                  baseColor: "#D2BBFF",
                                  baseColorFirstVariant: "#1C1B1B",
                                  baseColorSecondVariant: "#2A2A2A",
                                  errorColor: "#ff4d4d",
                                  textPrimaryColor: "#E5E2E1",
                                  textSecondaryColor: "#CCC3D8",
                                  inputBackgroundColor: "#0D0D0D",
                                  formBackgroundColor: "#1C1B1B",
                                  inputFocusedBorderColor: "#D2BBFF",
                                },
                              },
                            },
                          }}
                          onSubmit={async (param) => {
                            // 🔥 NORMALIZAÇÃO (ESSENCIAL)
                            const payload = {
                              token: param.token,
                              payment_method_id: param.payment_method_id,
                              issuer_id: param.issuer_id,
                              installments: param.installments,
                              payer: {
                                email: param.payer?.email,
                                identification: {
                                  type:
                                    param.payer?.identification?.type || "CPF",
                                  number: param.payer?.identification?.number,
                                },
                              },
                            };

                            await handleCheckout(payload);
                          }}
                          onError={(error) => {
                            toast.error(
                              "Erro ao processar cartão. Tente novamente.",
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer com resumo e botão — oculto quando cartão está selecionado
                    porque o brick já tem seu próprio botão de submit */}
                {!isCardPayment && (
                  <div className="p-6 bg-[#201F1F] border-t border-[#4A4455]/20 space-y-3 shrink-0">
                    <div className="flex justify-between text-sm text-[#CCC3D8]">
                      <span>Subtotal</span>
                      <span>
                        {cartTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    {selectedZone && (
                      <div className="flex justify-between text-sm text-[#CCC3D8]">
                        <span>Taxa de entrega</span>
                        <span>
                          R$ {deliveryFee.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-[#4A4455]/20">
                      <span className="text-[#CCC3D8] text-xs font-bold uppercase tracking-widest">
                        Total
                      </span>
                      <span className="text-2xl font-black text-[#D2BBFF] tracking-tighter">
                        {totalFinal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCheckout()}
                      disabled={processing}
                      className="w-full py-4 bg-[#D2BBFF] text-[#25005A] font-black rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(210,187,255,0.2)] disabled:opacity-50 mb-20"
                    >
                      {processing ? (
                        <div className="w-5 h-5 border-2 border-[#25005A]/30 border-t-[#25005A] rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={20} weight="bold" /> Confirmar
                          Pedido
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {customizingProduct && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setCustomizingProduct(null)}
          />
          <div className="relative w-full max-w-lg bg-[#1C1B1B] border border-[#4A4455]/30 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-6 border-b border-[#4A4455]/20">
              <h3 className="text-xl font-black text-white uppercase italic">
                {customizingProduct.name}
              </h3>
              <p className="text-xs text-[#CCC3D8] mt-1">
                Turbine seu pedido com adicionais:
              </p>
            </div>

            {/* Lista de Adicionais */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {addons.map((addon) => {
                const isSelected = selectedAddons.some(
                  (a) => a.id === addon.id,
                );
                return (
                  <button
                    key={addon.id}
                    onClick={() => {
                      setSelectedAddons((prev) =>
                        isSelected
                          ? prev.filter((a) => a.id !== addon.id)
                          : [...prev, addon],
                      );
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-[#D2BBFF] bg-[#D2BBFF]/5"
                        : "border-[#4A4455]/20 bg-[#131313]/50"
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-white text-sm">
                        {addon.name}
                      </span>
                      <span className="text-[#D2BBFF] text-xs font-black">
                        +{" "}
                        {Number(addon.price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#D2BBFF] border-[#D2BBFF]"
                          : "border-[#4A4455]"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle
                          size={16}
                          weight="fill"
                          className="text-[#25005A]"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Modal */}
            <div className="p-6 bg-[#201F1F] border-t border-[#4A4455]/20">
              <button
                onClick={confirmAddToCart}
                className="w-full py-4 bg-[#D2BBFF] text-[#25005A] font-black rounded-2xl flex items-center justify-center gap-3"
              >
                Adicionar à sacola
                <span className="opacity-50 text-xs">•</span>
                {(
                  Number(customizingProduct.price) +
                  selectedAddons.reduce((acc, a) => acc + Number(a.price), 0)
                ).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

const inputCls = [
  "w-full bg-[#0D0D0D] border border-[#4A4455]/40 rounded-xl px-3.5 py-2.5",
  "text-sm text-white placeholder:text-[#CCC3D8]/40",
  "focus:outline-none focus:border-[#D2BBFF]/50 transition-all",
].join(" ");

function InfoField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black text-[#CCC3D8] uppercase tracking-widest">
        {icon && <span className="text-[#D2BBFF]/60">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
