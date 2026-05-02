"use client";

import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  PrinterIcon,
  CheckCircleIcon,
  ChairIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  XIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────── */

type TableStatus = "free" | "occupied" | "bill_requested";

type Table = {
  id: string;
  number: number;
  label: string | null;
  status: TableStatus;
};

type Bill = {
  id: string;
  table_id: string;
  status: "open" | "closed";
  service_charge: boolean;
  payment_method: "cash" | "card" | "pix" | null;
  subtotal: number | null;
  service_amount: number | null;
  total: number | null;
  opened_at: string;
};

type BillOrder = {
  id: string;
  order_number: number;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    selected_addons: { name: string; price: number }[] | null;
    observation: string | null;
  }[];
};

type Category = {
  id: string;
  name: string;
  emoji: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  is_available: boolean;
};

type Addon = {
  id: string;
  name: string;
  price: number;
};

type CartItem = {
  product: Product;
  quantity: number;
  selected_addons: Addon[];
  observation: string;
};

type Step = "tables" | "bill" | "menu" | "checkout";
type PaymentMethod = "cash" | "card" | "pix";

const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  free: "Livre",
  occupied: "Ocupada",
  bill_requested: "Conta pedida",
};

const TABLE_STATUS_STYLE: Record<TableStatus, string> = {
  free: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  occupied: "border-accent/30 bg-accent/5 text-accent",
  bill_requested: "border-amber-500/30 bg-amber-500/5 text-amber-400",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "PIX",
};

/* ── Component ───────────────────────────────────────────────── */

export default function PDVPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { tenant } = useTenant(slug);
  const supabase = createClient();

  const [step, setStep] = useState<Step>("tables");
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  const [billOrders, setBillOrders] = useState<BillOrder[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemAddons, setItemAddons] = useState<Addon[]>([]);
  const [itemObs, setItemObs] = useState("");
  const [itemQty, setItemQty] = useState(1);

  const [serviceCharge, setServiceCharge] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const tenantId = tenant?.id ?? null;

  /* ── Fetch mesas ── */
  const fetchTables = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("number");
    setTables((data as Table[]) ?? []);
  }, [tenantId, supabase]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("tables-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchTables();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  /* ── Fetch cardápio ── */
  const fetchMenu = useCallback(async () => {
    if (!tenantId) return;
    const [catRes, prodRes, addonRes] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("sort_order"),
      supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_available", true)
        .order("sort_order"),
      supabase
        .from("addons")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_available", true),
    ]);
    setCategories((catRes.data as Category[]) ?? []);
    setProducts((prodRes.data as Product[]) ?? []);
    setAddons((addonRes.data as Addon[]) ?? []);
    if (catRes.data?.[0]) setSelectedCategory(catRes.data[0].id);
  }, [tenantId, supabase]);

  /* ── Fetch pedidos da comanda ── */
  const fetchBillOrders = useCallback(
    async (billId: string) => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, created_at, order_items(*)")
        .eq("bill_id", billId)
        .neq("status", "cancelled")
        .order("created_at");
      setBillOrders((data as BillOrder[]) ?? []);
    },
    [supabase],
  );

  /* ── Abrir/retomar mesa ── */
  async function handleSelectTable(table: Table) {
    console.log("Selecionando mesa:", table.number, "Status:", table.status);

    setSelectedTable(table);

    try {
      if (table.status === "free") {
        // Mesa livre: Limpa estados e vai direto para a tela de bill
        setActiveBill(null);
        setBillOrders([]);
        setStep("bill");
      } else {
        // Mesa ocupada: Busca a comanda
        const { data: bill, error } = await supabase
          .from("bills")
          .select("*")
          .eq("table_id", table.id)
          .eq("status", "open")
          .order("opened_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (!bill) {
          toast.error("Mesa ocupada, mas comanda não encontrada.");
          // Opcional: Se não achou, talvez a mesa devesse estar livre
          return;
        }

        setActiveBill(bill as Bill);
        await fetchBillOrders(bill.id);

        // Garante que o step seja bill APÓS carregar os dados
        setStep("bill");
      }
    } catch (err) {
      console.error("Erro em handleSelectTable:", err);
      toast.error("Erro ao processar mesa.");
    } finally {
      fetchMenu();
    }
  } /* ── Ir pro cardápio ── */
  function handleGoToMenu() {
    setCart([]);
    setSelectedProduct(null);
    setStep("menu");
  }

  /* ── Selecionar produto ── */
  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setItemAddons([]);
    setItemObs("");
    setItemQty(1);
  }

  function toggleAddon(addon: Addon) {
    setItemAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon],
    );
  }

  function addToCart() {
    if (!selectedProduct) return;
    setCart((prev) => [
      ...prev,
      {
        product: selectedProduct,
        quantity: itemQty,
        selected_addons: itemAddons,
        observation: itemObs,
      },
    ]);
    setSelectedProduct(null);
    toast.success(`${selectedProduct.name} adicionado.`);
  }

  /* ── Confirmar pedido ── */
  async function confirmOrder() {
    if (!activeBill || !tenantId || cart.length === 0) return;
    setLoading(true);

    try {
      // Pega próximo order_number
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const orderNumber = (count ?? 0) + 1;
      const subtotal = cart.reduce((acc, item) => {
        const addonsTotal = item.selected_addons.reduce(
          (s, a) => s + a.price,
          0,
        );
        return acc + (item.product.price + addonsTotal) * item.quantity;
      }, 0);

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          tenant_id: tenantId,
          bill_id: activeBill.id,
          source: "pdv",
          order_number: orderNumber,
          status: "preparing",
          payment_method: "cash",
          payment_status: "not_required",
          subtotal,
          delivery_fee: 0,
          total: subtotal,
        })
        .select()
        .single();

      if (error || !order) throw error;

      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
        selected_addons:
          item.selected_addons.length > 0 ? item.selected_addons : null,
        observation: item.observation || null,
      }));

      await supabase.from("order_items").insert(items);

      setCart([]);
      await fetchBillOrders(activeBill.id);
      toast.success("Pedido enviado para a cozinha!");
      setStep("bill");
    } catch {
      toast.error("Erro ao confirmar pedido.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Fechar conta ── */
  async function closeBill() {
    if (!activeBill || !selectedTable) return;
    setLoading(true);

    const subtotal = billOrders.reduce(
      (acc, order) =>
        acc +
        order.order_items.reduce((s, item) => {
          const addonsTotal =
            item.selected_addons?.reduce((a, b) => a + b.price, 0) ?? 0;
          return s + (item.unit_price + addonsTotal) * item.quantity;
        }, 0),
      0,
    );

    const serviceAmount = serviceCharge ? subtotal * 0.1 : 0;
    const total = subtotal + serviceAmount;

    await supabase
      .from("bills")
      .update({
        status: "closed",
        service_charge: serviceCharge,
        payment_method: paymentMethod,
        subtotal,
        service_amount: serviceAmount,
        total,
        closed_at: new Date().toISOString(),
      })
      .eq("id", activeBill.id);

    await supabase
      .from("tables")
      .update({ status: "free" })
      .eq("id", selectedTable.id);

    setActiveBill((prev) =>
      prev
        ? {
            ...prev,
            service_charge: serviceCharge,
            payment_method: paymentMethod,
            subtotal,
            service_amount: serviceAmount,
            total,
          }
        : prev,
    );

    await fetchTables();
    setLoading(false);
    toast.success("Conta fechada!");

    // Imprime automaticamente
    router.push(`/${slug}/painel/print/bill/${activeBill.id}`);
  }

  async function handleOpenBill() {
    if (!selectedTable) return;

    const { data: bill, error } = await supabase
      .from("bills")
      .insert({
        tenant_id: tenantId,
        table_id: selectedTable.id,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao abrir comanda");
      return;
    }

    await supabase
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", selectedTable.id);

    setActiveBill(bill);

    // 🔥 ATUALIZA AS MESAS LOCALMENTE
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id ? { ...t, status: "occupied" } : t,
      ),
    );

    toast.success("Comanda aberta");
    await fetchTables();
  }

  /* ── Derivados ── */
  const cartSubtotal = cart.reduce((acc, item) => {
    const addonsTotal = item.selected_addons.reduce((s, a) => s + a.price, 0);
    return acc + (item.product.price + addonsTotal) * item.quantity;
  }, 0);

  const billSubtotal = billOrders.reduce(
    (acc, order) =>
      acc +
      order.order_items.reduce((s, item) => {
        const addonsTotal =
          item.selected_addons?.reduce((a, b) => a + b.price, 0) ?? 0;
        return s + (item.unit_price + addonsTotal) * item.quantity;
      }, 0),
    0,
  );

  const serviceAmount = serviceCharge ? billSubtotal * 0.1 : 0;
  const billTotal = billSubtotal + serviceAmount;

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (!tenant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    );
  }

  if (step === "bill" && selectedTable && !activeBill) {
    return (
      <div className="p-10 flex flex-col items-center gap-4">
        <p className="text-text-muted">
          Essa mesa ainda não possui comanda aberta.
        </p>

        <div className="flex gap-3 w-full max-w-sm">
          {/* Voltar */}
          <button
            onClick={() => {
              setStep("tables");
              setSelectedTable(null);
              setActiveBill(null);
              setBillOrders([]);
            }}
            className="flex-1 py-3 rounded-xl border border-border bg-surface text-text-muted font-bold hover:text-text transition-all"
          >
            Voltar
          </button>

          {/* Abrir comanda */}
          <button
            onClick={handleOpenBill}
            className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:brightness-110 transition-all"
          >
            Abrir comanda
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg text-text font-sans relative selection:bg-accent/30">
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <section className="lg:ml-64 p-6 md:p-10 relative z-10 pb-32">
        {/* ── ETAPA 1: MESAS ── */}
        {step === "tables" && (
          <>
            <header className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                PDV — Modo Garçom
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Mesas</h1>
              <p className="text-text-muted mt-1">
                Selecione uma mesa para abrir ou continuar a comanda.
              </p>
            </header>

            {tables.length === 0 ? (
              <div className="py-20 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-text-muted">
                <ChairIcon
                  size={48}
                  weight="thin"
                  className="mb-4 opacity-20"
                />
                <p className="font-medium">Nenhuma mesa cadastrada.</p>
                <p className="text-sm mt-1">
                  Adicione mesas nas configurações.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all active:scale-95 hover:-translate-y-0.5 ${TABLE_STATUS_STYLE[table.status]}`}
                  >
                    <ChairIcon size={28} weight="duotone" />
                    <span className="text-xl font-black tracking-tight">
                      {table.label ?? `Mesa ${table.number}`}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                      {TABLE_STATUS_LABEL[table.status]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Legenda */}
            <div className="mt-10 flex flex-wrap gap-4">
              {(Object.keys(TABLE_STATUS_LABEL) as TableStatus[]).map((s) => (
                <div
                  key={s}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${TABLE_STATUS_STYLE[s]}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {TABLE_STATUS_LABEL[s]}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ETAPA 2: COMANDA ── */}
        {step === "bill" && selectedTable && (
          <>
            <header className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setStep("tables");
                    setSelectedTable(null);
                    setActiveBill(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <ArrowLeftIcon size={14} /> Mesas
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                    Comanda aberta
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {selectedTable.label ?? `Mesa ${selectedTable.number}`}
                  </h1>
                </div>
              </div>
              {!activeBill && (
                <button
                  onClick={handleOpenBill}
                  className="w-full py-4 rounded-xl bg-accent text-white font-bold"
                >
                  Abrir comanda
                </button>
              )}
              <button
                onClick={() => setStep("checkout")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                <ReceiptIcon size={16} weight="fill" /> Fechar conta
              </button>
            </header>

            {/* Pedidos da comanda */}
            {billOrders.length === 0 ? (
              <div className="py-16 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-text-muted mb-6">
                <ShoppingCartIcon
                  size={40}
                  weight="thin"
                  className="mb-3 opacity-20"
                />
                <p className="font-medium">Nenhum pedido ainda.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {billOrders.map((order) =>
                  order.order_items.map((item) => {
                    const addonsTotal =
                      item.selected_addons?.reduce((s, a) => s + a.price, 0) ??
                      0;

                    return (
                      <div key={item.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            <b className="text-text">{item.quantity}x</b>{" "}
                            {item.product_name}
                          </span>
                          <span className="font-mono text-text-muted">
                            R${" "}
                            {((item.unit_price + addonsTotal) * item.quantity)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>

                        {/* ADICIONAIS */}
                        {item.selected_addons &&
                          item.selected_addons.length > 0 && (
                            <div className="ml-5 mt-1 space-y-0.5">
                              {item.selected_addons.map((addon) => (
                                <div
                                  key={addon.name}
                                  className="flex justify-between text-xs text-text-muted"
                                >
                                  <span>+ {addon.name}</span>
                                  <span className="font-mono">
                                    R${" "}
                                    {addon.price.toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* OBSERVAÇÃO (opcional, mas consistente com o resto do sistema) */}
                        {item.observation && (
                          <p className="ml-5 text-[11px] text-text-muted italic">
                            "{item.observation}"
                          </p>
                        )}
                      </div>
                    );
                  }),
                )}{" "}
              </div>
            )}

            {/* Subtotal */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-border bg-surface mb-6">
              <span className="text-sm font-black uppercase tracking-widest text-text-muted">
                Subtotal
              </span>
              <span className="text-xl font-black text-text">
                R$ {billSubtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>

            {/* Botão adicionar */}
            <button
              onClick={handleGoToMenu}
              className="w-full py-4 rounded-2xl border border-accent/30 bg-accent/10 text-accent font-black text-sm uppercase tracking-widest hover:bg-accent/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <PlusIcon size={18} weight="bold" /> Adicionar itens
            </button>
          </>
        )}

        {/* ── ETAPA 3: CARDÁPIO ── */}
        {step === "menu" && (
          <>
            <header className="mb-6 flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setCart([]);
                  setStep("bill");
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              >
                <ArrowLeftIcon size={14} /> Comanda
              </button>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                  {selectedTable?.label ?? `Mesa ${selectedTable?.number}`}
                </p>
                <h1 className="text-2xl font-bold tracking-tight">Cardápio</h1>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Esquerda: produtos */}
              <div className="lg:col-span-2">
                {/* Categorias */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        selectedCategory === cat.id
                          ? "bg-accent text-white"
                          : "border border-border bg-surface text-text-muted hover:text-text"
                      }`}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Lista de produtos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className={`text-left p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                          isSelected
                            ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20"
                            : "border-border bg-surface hover:border-white/20"
                        }`}
                      >
                        <p className="font-bold text-text text-sm">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                        <p className="text-accent font-black mt-2">
                          R$ {product.price.toFixed(2).replace(".", ",")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direita: configurador do item */}
              <div className="lg:col-span-1">
                {selectedProduct ? (
                  <div className="sticky top-6 rounded-2xl border border-border bg-surface p-5 space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
                        Item selecionado
                      </p>
                      <h3 className="text-lg font-bold text-text">
                        {selectedProduct.name}
                      </h3>
                      <p className="text-accent font-black">
                        R$ {selectedProduct.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                        Quantidade
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setItemQty((q) => Math.max(1, q - 1))}
                          className="w-9 h-9 rounded-xl border border-border bg-surface-alt flex items-center justify-center hover:border-accent/40 transition-all"
                        >
                          <MinusIcon size={14} weight="bold" />
                        </button>
                        <span className="text-xl font-black w-8 text-center">
                          {itemQty}
                        </span>
                        <button
                          onClick={() => setItemQty((q) => q + 1)}
                          className="w-9 h-9 rounded-xl border border-border bg-surface-alt flex items-center justify-center hover:border-accent/40 transition-all"
                        >
                          <PlusIcon size={14} weight="bold" />
                        </button>
                      </div>
                    </div>

                    {/* Adicionais */}
                    {addons.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                          Adicionais
                        </p>
                        <div className="space-y-2">
                          {addons.map((addon) => {
                            const active = itemAddons.find(
                              (a) => a.id === addon.id,
                            );
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddon(addon)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${
                                  active
                                    ? "border-accent/40 bg-accent/5 text-accent"
                                    : "border-border bg-surface-alt text-text-secondary hover:border-white/20"
                                }`}
                              >
                                <span>{addon.name}</span>
                                <span className="font-mono text-xs">
                                  +R$ {addon.price.toFixed(2).replace(".", ",")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Observação */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                        Observação
                      </p>
                      <textarea
                        value={itemObs}
                        onChange={(e) => setItemObs(e.target.value)}
                        placeholder="Ex: sem cebola, bem passado..."
                        rows={2}
                        className="w-full bg-surface-alt border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-accent/40"
                      />
                    </div>

                    <button
                      onClick={addToCart}
                      className="w-full py-3 rounded-xl bg-accent text-white font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                ) : (
                  <div className="sticky top-6 rounded-2xl border border-dashed border-border p-8 flex flex-col items-center justify-center text-text-muted text-center">
                    <ShoppingCartIcon
                      size={32}
                      weight="thin"
                      className="mb-2 opacity-30"
                    />
                    <p className="text-sm">Selecione um produto</p>
                  </div>
                )}
              </div>
            </div>

            {/* Carrinho flutuante */}
            {cart.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                <div className="bg-surface border border-accent/30 rounded-2xl p-4 shadow-2xl shadow-accent/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                      Carrinho ({cart.reduce((s, i) => s + i.quantity, 0)}{" "}
                      itens)
                    </p>
                    <button
                      onClick={() => setCart([])}
                      className="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                  <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-xs text-text-secondary"
                      >
                        <span>
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-mono">
                          R${" "}
                          {(
                            (item.product.price +
                              item.selected_addons.reduce(
                                (s, a) => s + a.price,
                                0,
                              )) *
                            item.quantity
                          )
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-text">
                      R$ {cartSubtotal.toFixed(2).replace(".", ",")}
                    </span>
                    <button
                      onClick={confirmOrder}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-accent text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? "Enviando..." : "Confirmar pedido"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ETAPA 4: CHECKOUT / FECHAR CONTA ── */}
        {step === "checkout" && selectedTable && activeBill && (
          <>
            <header className="mb-8 flex items-center gap-4">
              <button
                onClick={() => setStep("bill")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              >
                <ArrowLeftIcon size={14} /> Comanda
              </button>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                  Fechamento
                </p>
                <h1 className="text-2xl font-bold tracking-tight">
                  {selectedTable.label ?? `Mesa ${selectedTable.number}`}
                </h1>
              </div>
            </header>

            <div className="max-w-lg space-y-4">
              {/* Resumo dos itens */}
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">
                  Resumo
                </p>
                <div className="space-y-3">
                  {billOrders.map((order) =>
                    order.order_items.map((item) => {
                      const addonsTotal =
                        item.selected_addons?.reduce(
                          (s, a) => s + a.price,
                          0,
                        ) ?? 0;
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-text-secondary">
                            <b className="text-text">{item.quantity}x</b>{" "}
                            {item.product_name}
                          </span>
                          <span className="font-mono text-text-muted">
                            R${" "}
                            {((item.unit_price + addonsTotal) * item.quantity)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      );
                    }),
                  )}
                </div>

                <div className="border-t border-border mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span>R$ {billSubtotal.toFixed(2).replace(".", ",")}</span>
                  </div>

                  {/* Taxa de serviço */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setServiceCharge((v) => !v)}
                      className={`flex items-center gap-2 text-sm transition-all ${serviceCharge ? "text-accent" : "text-text-muted"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${serviceCharge ? "bg-accent border-accent" : "border-border"}`}
                      >
                        {serviceCharge && (
                          <CheckCircleIcon
                            size={10}
                            weight="fill"
                            className="text-white"
                          />
                        )}
                      </div>
                      Gorjeta (10%)
                    </button>
                    <span
                      className={`text-sm font-mono ${serviceCharge ? "text-accent" : "text-text-muted"}`}
                    >
                      {serviceCharge
                        ? `+ R$ ${serviceAmount.toFixed(2).replace(".", ",")}`
                        : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between text-xl font-black text-accent pt-2 border-t border-border">
                    <span>Total</span>
                    <span>R$ {billTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </div>

              {/* Método de pagamento */}
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                  Forma de pagamento
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "card", "pix"] as PaymentMethod[]).map(
                    (method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 rounded-xl border text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${
                          paymentMethod === method
                            ? "border-accent/50 bg-accent/10 text-accent ring-1 ring-accent/20"
                            : "border-border bg-surface-alt text-text-muted hover:text-text"
                        }`}
                      >
                        {PAYMENT_LABELS[method]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Botão fechar */}
              <button
                onClick={closeBill}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-accent text-white font-black text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PrinterIcon size={18} weight="fill" />
                {loading ? "Fechando..." : "Fechar conta e imprimir"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* ── NOTA PARA IMPRESSÃO ── */}
      <div className="hidden print:block p-8 text-black font-mono text-sm">
        <div className="text-center mb-6">
          <p className="text-xl font-bold">{tenant.name}</p>
          <p className="text-sm">{tenant.address}</p>
          <p className="text-sm">{tenant.phone}</p>
          <div className="border-t border-black my-3" />
          <p className="font-bold">
            {selectedTable?.label ?? `Mesa ${selectedTable?.number}`}
          </p>
          <p className="text-xs">{new Date().toLocaleString("pt-BR")}</p>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        {billOrders.map((order) =>
          order.order_items.map((item) => {
            const addonsTotal =
              item.selected_addons?.reduce((s, a) => s + a.price, 0) ?? 0;
            const total = (item.unit_price + addonsTotal) * item.quantity;
            return (
              <div key={item.id} className="flex justify-between mb-1">
                <span>
                  {item.quantity}x {item.product_name}
                </span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            );
          }),
        )}

        <div className="border-t border-dashed border-black my-3" />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>R$ {billSubtotal.toFixed(2).replace(".", ",")}</span>
        </div>

        {serviceCharge && (
          <div className="flex justify-between">
            <span>Gorjeta (10%)</span>
            <span>R$ {serviceAmount.toFixed(2).replace(".", ",")}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-base mt-2 border-t border-black pt-2">
          <span>TOTAL</span>
          <span>R$ {billTotal.toFixed(2).replace(".", ",")}</span>
        </div>

        <div className="flex justify-between mt-1">
          <span>Pagamento</span>
          <span>{paymentMethod ? PAYMENT_LABELS[paymentMethod] : "—"}</span>
        </div>

        <div className="border-t border-dashed border-black my-4" />
        <p className="text-center text-xs">Obrigado pela visita!</p>
        <p className="text-center text-xs mt-1">Powered by The Order Flow</p>
      </div>
    </main>
  );
}
