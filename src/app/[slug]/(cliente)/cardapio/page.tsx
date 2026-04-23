"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { toast } from "sonner";

// Componentes
import { CategoryNav } from "@/components/[slug]/(clientes)/cardapio/CategoryNav";
import { ProductGrid } from "@/components/[slug]/(clientes)/cardapio/ProductGrid";
import { CartSummary } from "@/components/[slug]/(clientes)/cardapio/CartSummary";
import DrawerHeader from "@/components/[slug]/(clientes)/cardapio/CartDrawer/DrawerHeader";
import DrawerCart from "@/components/[slug]/(clientes)/cardapio/CartDrawer/DrawerCart";
import DrawerInfo from "@/components/[slug]/(clientes)/cardapio/CartDrawer/DrawerInfo";
import CustomizeModal from "@/components/[slug]/(clientes)/cardapio/CustomizeModal";

// Hooks e Types
import { useCart } from "@/hooks/useCart";
import { CustomerForm } from "@/types/customerForm";
import { Addon, DeliveryZone, Product, Step, Tenant } from "@/types/supabase";
import { TenantHero } from "@/components/[slug]/(clientes)/cardapio/TenantHero";

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

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = createClient();

  // Estados de Dados
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de UI/Fluxo
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState<CustomerForm>(BLANK_FORM);
  const [processing, setProcessing] = useState(false);
  const [mpReady, setMpReady] = useState(false);

  // Estado de Customização (Modal)
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(
    null,
  );
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);

  // Hook do Carrinho (Lógica extraída)
  const {
    cart,
    add: addToCart,
    remove: removeFromCart,
    total: cartTotal,
  } = useCart();

  /* ── Fetch Inicial ── */
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: tenantData, error: tErr } = await supabase
          .from("tenants")
          .select(
            "id, name, slug, is_open, description, logo_url, payment_methods, pix_key, pix_key_type, mp_public_key, banner_url, primary_color, button_text_color, instagram_url, whatsapp_url",
          )
          .eq("slug", slug)
          .single();

        if (tErr || !tenantData) throw new Error("Lanchonete não encontrada");
        setTenant(tenantData as Tenant);

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
  }, [slug, supabase]);

  useEffect(() => {
    if (customizingProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // cleanup (importante)
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [customizingProduct]);

  /* ── Handlers de Produto ── */
  function handleProductClick(product: Product) {
    const isBeverage = product.categories?.name === "Bebidas";

    if (isBeverage || addons.length === 0) {
      // Bebida ou sem adicionais: adiciona direto
      addToCart(product, []);
      toast.success(`${product.name} adicionado!`);
    } else {
      // Outros com adicionais: abre o modal
      setCustomizingProduct(product);
      setSelectedAddons([]);
    }
  }

  function confirmAddToCart() {
    if (!customizingProduct) return;
    addToCart(customizingProduct, selectedAddons);
    setCustomizingProduct(null);
    setSelectedAddons([]);
  }

  /* ── Checkout ── */
  const selectedZone = zones.find((z) => z.neighborhood === form.neighborhood);
  const deliveryFee = selectedZone?.fee ?? 0;
  const totalFinal = cartTotal + deliveryFee;
  const isCardPayment = ["credit_card", "debit_card"].includes(
    form.payment_method,
  );

  async function handleCheckout(mpFormData?: any) {
    if (
      !form.name ||
      !form.phone ||
      !form.neighborhood ||
      !form.payment_method
    ) {
      return toast.error("Preencha todos os campos obrigatórios");
    }
    if (!tenant) return;

    const customer_phone = form.phone.replace(/\D/g, "");
    localStorage.setItem("customer_phone", customer_phone);

    setProcessing(true);
    try {
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
            selected_addons: i.selected_addons,
          })),
          use_mp: isCardPayment,
          mp_form_data: mpFormData,
        }),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message || "Erro ao processar pedido");

      toast.success("Pedido realizado!");
      router.push(`/${slug}/meus-pedidos/${json.orderId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }

  /* ── Filtros ── */
  const categories = [
    "Todos",
    ...Array.from(
      new Set(products.map((p) => p.categories?.name).filter(Boolean)),
    ),
  ] as string[];
  const filteredProds =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => p.categories?.name === activeCategory);

  if (loading)
    return (
      <div className="min-h-screen bg-menu-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#D2BBFF]" />
      </div>
    );

  return (
    <main className="min-h-screen bg-menu-bg text-menu-text font-sans relative pb-32 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* <MenuHeader tenant={tenant!} /> */}
      <TenantHero
        name={tenant?.name}
        logoUrl={tenant?.logo_url}
        bannerUrl={tenant?.banner_url}
        primaryColor={tenant?.primary_color}
        instagram_url={tenant?.instagram_url}
        whatsapp_url={tenant?.whatsapp_url}
      />

      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <section className="px-6 md:px-16 mt-10 max-w-7xl mx-auto">
        {!tenant?.is_open && (
          <div className="mb-8 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold text-center">
            Fechado no momento.
          </div>
        )}
        <ProductGrid
          products={filteredProds}
          onClick={handleProductClick}
          tenant={tenant!}
        />
      </section>

      {cart.length > 0 && !isCartOpen && (
        <CartSummary
          cartCount={cart.length}
          cartTotal={cartTotal}
          openCart={() => setIsCartOpen(true)}
        />
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-60 flex justify-end">
          <div
            className="absolute inset-0 bg-menu-bg/90 backdrop-blur-md"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-menu-surface border-l border-menu-border/30 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <DrawerHeader
              step={step}
              setStep={setStep}
              setIsCartOpen={setIsCartOpen}
            />

            {step === "cart" ? (
              <DrawerCart
                cart={cart}
                cartTotal={cartTotal}
                addToCart={(p) => addToCart(p, [])}
                removeFromCart={removeFromCart}
                setStep={setStep}
              />
            ) : (
              <DrawerInfo
                cartTotal={cartTotal}
                handleCheckout={handleCheckout}
                isCardPayment={isCardPayment}
                deliveryFee={deliveryFee}
                form={form}
                mpReady={mpReady}
                processing={processing}
                selectedZone={selectedZone}
                setForm={setForm}
                tenant={tenant!}
                totalFinal={totalFinal}
                zones={zones}
              />
            )}
          </div>
        </div>
      )}

      {customizingProduct && (
        <CustomizeModal
          addons={addons}
          confirmAddToCart={confirmAddToCart}
          customizingProduct={customizingProduct}
          selectedAddons={selectedAddons}
          setCustomizingProduct={setCustomizingProduct}
          setSelectedAddons={setSelectedAddons}
        />
      )}
    </main>
  );
}
