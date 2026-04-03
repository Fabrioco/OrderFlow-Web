"use client";

import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/client";
import {
  Plus,
  PencilSimple,
  Trash,
  Image as ImageIcon,
  X,
  Check,
  ArrowClockwise,
  Tag,
  Hamburger,
  PlusCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────── */

type Category = {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  category_id: string | null;
  categories?: { name: string; emoji: string | null } | null;
};

type Addon = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  category_id: string;
  sort_order: string;
};

type AddonForm = { name: string; price: string };

type Panel = "products" | "categories" | "addons";

const BLANK_PRODUCT: ProductForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_available: true,
  category_id: "",
  sort_order: "0",
};

const BLANK_ADDON: AddonForm = { name: "", price: "" };

/* ── Component ───────────────────────────────────────────────── */

export default function MenuManagement() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = createClient();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePanel, setActivePanel] = useState<Panel>("products");

  // Product modal
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(BLANK_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category modal
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  // Addon modal
  const [addonModal, setAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonForm, setAddonForm] = useState<AddonForm>(BLANK_ADDON);
  const [savingAddon, setSavingAddon] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product" | "category" | "addon";
    id: string;
    name: string;
  } | null>(null);

  /* ── Fetch ── */
  const fetchData = useCallback(
    async (tid?: string) => {
      const id = tid ?? tenantId;
      if (!id) return;
      try {
        const [{ data: cats }, { data: prods }, { data: ads }] =
          await Promise.all([
            supabase
              .from("categories")
              .select("*")
              .eq("tenant_id", id)
              .order("sort_order"),
            supabase
              .from("products")
              .select("*, categories(name, emoji)")
              .eq("tenant_id", id)
              .order("sort_order"),
            supabase
              .from("addons")
              .select("*")
              .eq("tenant_id", id)
              .order("name"),
          ]);
        setCategories((cats as Category[]) ?? []);
        setProducts((prods as Product[]) ?? []);
        setAddons((ads as Addon[]) ?? []);
      } catch (err) {
        console.error(err);
      }
    },
    [tenantId, supabase],
  );

  useEffect(() => {
    async function init() {
      setLoading(true);
      // Buscamos sem o .single() para evitar o erro de coerção se não achar nada
      const { data, error } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug);

      if (error || !data || data.length === 0) {
        console.error("Estabelecimento não encontrado");
        setLoading(false);
        return;
      }

      const tenant = data[0];
      setTenantId(tenant.id);
      await fetchData(tenant.id);
      setLoading(false);
    }
    init();
  }, [slug]);
  /* ── Product CRUD ── */
  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm(BLANK_PRODUCT);
    setProductModal(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      image_url: p.image_url ?? "",
      is_available: p.is_available,
      category_id: p.category_id ?? "",
      sort_order: String(p.sort_order),
    });
    setProductModal(true);
  }

  async function saveProduct() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log(user);
    if (!productForm.name || !productForm.price) {
      toast.error("Nome e preço são obrigatórios.");
      return;
    }
    if (!tenantId) return;
    setSavingProduct(true);
    try {
      // 1. Criamos o payload BASE
      const basePayload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url.trim() || null,
        is_available: productForm.is_available,
        category_id: productForm.category_id || null,
        sort_order: parseInt(productForm.sort_order) || 0,
      };

      if (editingProduct) {
        // 2. No UPDATE, não enviamos o tenant_id (evita bloqueio de RLS)
        const { data, error } = await supabase
          .from("products")
          .update(basePayload)
          .eq("id", editingProduct.id)
          .eq("tenant_id", tenantId) // 🔥 IMPORTANTE
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error("RLS bloqueou o update (verifique policies)");
        }
        console.log("Produto atualizado com sucesso:", data);

        if (!data || data.length === 0) {
          throw new Error(
            "Não foi possível atualizar o produto. Verifique as permissões.",
          );
        }

        toast.success("Produto atualizado!");
      } else {
        // 3. No INSERT, incluímos o tenant_id obrigatoriamente
        const { error } = await supabase
          .from("products")
          .insert({ ...basePayload, tenant_id: tenantId });

        if (error) throw error;
        toast.success("Produto criado!");
      }

      setProductModal(false);
      // 4. Importante: Limpar o estado do produto editado
      setEditingProduct(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto.");
      console.error(err);
    } finally {
      setSavingProduct(false);
    }
  }
  async function toggleAvailability(id: string, current: boolean) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_available: !current } : p)),
    );
    const { error } = await supabase
      .from("products")
      .update({ is_available: !current })
      .eq("id", id);
    if (error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_available: current } : p)),
      );
      toast.error("Erro ao atualizar.");
    }
  }

  /* ── Category CRUD ── */
  function openCreateCategory() {
    setEditingCategory(null);
    setCatName("");
    setCatEmoji("");
    setCategoryModal(true);
  }

  function openEditCategory(c: Category) {
    setEditingCategory(c);
    setCatName(c.name);
    setCatEmoji(c.emoji ?? "");
    setCategoryModal(true);
  }

  async function saveCategory() {
    if (!catName.trim() || !tenantId) return;
    setSavingCat(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: catName.trim(),
        emoji: catEmoji.trim() || null,
      };
      if (editingCategory) {
        await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        toast.success("Categoria atualizada!");
      } else {
        await supabase.from("categories").insert(payload);
        toast.success("Categoria criada!");
      }
      setCategoryModal(false);
      await fetchData();
    } catch {
      toast.error("Erro ao salvar categoria.");
    } finally {
      setSavingCat(false);
    }
  }

  /* ── Addon CRUD ── */
  function openCreateAddon() {
    setEditingAddon(null);
    setAddonForm(BLANK_ADDON);
    setAddonModal(true);
  }

  function openEditAddon(a: Addon) {
    setEditingAddon(a);
    setAddonForm({ name: a.name, price: String(a.price) });
    setAddonModal(true);
  }

  async function saveAddon() {
    if (!addonForm.name.trim() || !tenantId) return;
    setSavingAddon(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: addonForm.name.trim(),
        price: parseFloat(addonForm.price) || 0,
      };
      if (editingAddon) {
        await supabase.from("addons").update(payload).eq("id", editingAddon.id);
        toast.success("Adicional atualizado!");
      } else {
        await supabase.from("addons").insert(payload);
        toast.success("Adicional criado!");
      }
      setAddonModal(false);
      await fetchData();
    } catch {
      toast.error("Erro ao salvar adicional.");
    } finally {
      setSavingAddon(false);
    }
  }

  async function toggleAddon(id: string, current: boolean) {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_available: !current } : a)),
    );
    await supabase
      .from("addons")
      .update({ is_available: !current })
      .eq("id", id);
  }

  /* ── Delete ── */
  async function confirmDelete() {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    try {
      if (type === "product")
        await supabase.from("products").delete().eq("id", id);
      if (type === "category")
        await supabase.from("categories").delete().eq("id", id);
      if (type === "addon") await supabase.from("addons").delete().eq("id", id);
      toast.success("Excluído com sucesso.");
      setDeleteTarget(null);
      await fetchData();
    } catch {
      toast.error("Erro ao excluir.");
    }
  }

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category_id === activeCategory);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${tenantId}/${Math.random()}.${fileExt}`; // Pasta por tenant
    const filePath = `${fileName}`;

    toast.promise(
      async () => {
        const { data, error } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            upsert: true,
          });

        if (error) throw error;

        // Pega a URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(filePath);

        setProductForm((f) => ({ ...f, image_url: publicUrl }));
      },
      {
        loading: "Enviando imagem...",
        success: "Imagem enviada com sucesso!",
        error: "Erro ao enviar imagem.",
      },
    );
  }

  /* ── Render ── */
  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      

      <section className="lg:ml-64 p-8 md:p-12 relative z-10">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Gestão de Cardápio
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">
              Produtos & Itens
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="p-2.5 rounded-xl border border-border bg-surface text-text-muted hover:text-accent transition-colors"
            >
              <ArrowClockwise
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={openCreateProduct}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
            >
              <Plus size={18} weight="bold" /> Novo Produto
            </button>
          </div>
        </header>

        {/* Panel tabs */}
        <div className="flex gap-2 mb-10 border-b border-border pb-1">
          {(
            [
              {
                key: "products",
                label: "Produtos",
                icon: <Hamburger size={16} />,
              },
              {
                key: "categories",
                label: "Categorias",
                icon: <Tag size={16} />,
              },
              {
                key: "addons",
                label: "Adicionais",
                icon: <PlusCircle size={16} />,
              },
            ] as { key: Panel; label: string; icon: React.ReactNode }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePanel(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-all border-b-2 -mb-px ${
                activePanel === tab.key
                  ? "text-accent border-accent"
                  : "text-text-muted border-transparent hover:text-text"
              }`}
            >
              {tab.icon} {tab.label}
              <span className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded">
                {tab.key === "products"
                  ? products.length
                  : tab.key === "categories"
                    ? categories.length
                    : addons.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── PRODUCTS PANEL ── */}
        {activePanel === "products" && (
          <>
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                  activeCategory === "all"
                    ? "bg-text text-bg border-text"
                    : "bg-surface border-border text-text-secondary hover:text-text"
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? "bg-accent text-white border-accent"
                      : "bg-surface border-border text-text-secondary hover:text-text"
                  }`}
                >
                  {cat.emoji} {cat.name}
                  <span className="opacity-60">
                    ({products.filter((p) => p.category_id === cat.id).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`group relative p-4 rounded-3xl border transition-all duration-300 bg-surface shadow-xl ${
                    product.is_available
                      ? "border-border hover:border-accent/30"
                      : "opacity-50 border-dashed border-border"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 bg-surface-alt border border-border">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <ImageIcon size={36} weight="thin" />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditProduct(product)}
                        className="p-1.5 rounded-lg bg-bg/80 backdrop-blur-sm text-text hover:text-accent transition-colors"
                      >
                        <PencilSimple size={14} weight="bold" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "product",
                            id: product.id,
                            name: product.name,
                          })
                        }
                        className="p-1.5 rounded-lg bg-bg/80 backdrop-blur-sm text-text hover:text-red-400 transition-colors"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                    {product.categories && (
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2 py-1 rounded-md bg-bg/80 backdrop-blur-sm border border-border text-[9px] font-black uppercase tracking-widest text-accent">
                          {product.categories.emoji} {product.categories.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-1">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="text-base font-bold text-text tracking-tight flex-1 pr-2 truncate">
                        {product.name}
                      </h3>
                      <span className="text-base font-bold text-accent shrink-0">
                        {Number(product.price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-5 h-8">
                      {product.description || "Sem descrição."}
                    </p>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Toggle
                          checked={product.is_available}
                          onChange={() =>
                            toggleAvailability(product.id, product.is_available)
                          }
                        />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                          {product.is_available ? "Disponível" : "Esgotado"}
                        </span>
                      </div>
                      <button
                        onClick={() => openEditProduct(product)}
                        className="text-[10px] font-bold text-text-muted hover:text-accent transition-colors uppercase tracking-wider"
                      >
                        Editar →
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add placeholder */}
              <button
                onClick={openCreateProduct}
                className="min-h-[340px] rounded-3xl border-2 border-dashed border-border hover:border-accent/40 hover:bg-surface-alt/50 transition-all flex flex-col items-center justify-center group gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted group-hover:text-accent group-hover:scale-110 transition-all">
                  <Plus size={22} weight="bold" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-text-secondary group-hover:text-text transition-colors">
                    Novo Produto
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
                    Adicionar ao cardápio
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── CATEGORIES PANEL ── */}
        {activePanel === "categories" && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={openCreateCategory}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                <Plus size={16} weight="bold" /> Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.category_id === cat.id,
                ).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-surface hover:border-accent/30 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border flex items-center justify-center text-2xl shrink-0">
                      {cat.emoji || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text truncate">{cat.name}</p>
                      <p className="text-xs text-text-muted">
                        {count} {count === 1 ? "produto" : "produtos"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-accent transition-colors"
                      >
                        <PencilSimple size={15} weight="bold" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "category",
                            id: cat.id,
                            name: cat.name,
                          })
                        }
                        className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={openCreateCategory}
                className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-border hover:border-accent/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
                  <Plus size={22} weight="bold" />
                </div>
                <p className="font-bold text-text-secondary group-hover:text-text transition-colors">
                  Nova categoria
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ── ADDONS PANEL ── */}
        {activePanel === "addons" && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={openCreateAddon}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                <Plus size={16} weight="bold" /> Novo Adicional
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className={`flex items-center gap-4 p-5 rounded-2xl border bg-surface transition-all group ${addon.is_available ? "border-border hover:border-accent/30" : "border-dashed opacity-50"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text truncate">{addon.name}</p>
                    <p className="text-sm text-accent font-bold mt-0.5">
                      +{" "}
                      {Number(addon.price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={addon.is_available}
                      onChange={() => toggleAddon(addon.id, addon.is_available)}
                    />
                    <button
                      onClick={() => openEditAddon(addon)}
                      className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-accent transition-colors"
                    >
                      <PencilSimple size={15} weight="bold" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: "addon",
                          id: addon.id,
                          name: addon.name,
                        })
                      }
                      className="p-2 rounded-lg hover:bg-surface-alt text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={openCreateAddon}
                className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-border hover:border-accent/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
                  <Plus size={20} weight="bold" />
                </div>
                <p className="font-bold text-text-secondary group-hover:text-text transition-colors">
                  Novo adicional
                </p>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          PRODUCT MODAL (create / edit)
      ══════════════════════════════════════════════════════ */}
      {productModal && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={() => setProductModal(false)}
          />
          <div className="relative w-full max-w-lg bg-surface border-l border-border h-screen p-8 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">
                  {editingProduct ? "Editar" : "Novo"} Produto
                </p>
                <h2 className="text-2xl font-bold tracking-tighter text-text">
                  {editingProduct ? editingProduct.name : "Criar produto"}
                </h2>
              </div>
              <button
                onClick={() => setProductModal(false)}
                className="p-2 hover:bg-surface-alt rounded-full text-text transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Imagem preview */}
              <div className="h-40 rounded-2xl border border-border bg-surface-alt overflow-hidden flex items-center justify-center">
                {productForm.image_url ? (
                  <img
                    src={productForm.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    <ImageIcon size={32} weight="thin" />
                    <p className="text-xs">Nenhuma imagem</p>
                  </div>
                )}
              </div>

              {/* Substitua o FormField de "URL da imagem" por este: */}
              <FormField label="Foto do Produto">
                <div className="flex flex-col gap-3">
                  {/* Botão de Upload Customizado */}
                  <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-border rounded-xl bg-surface-alt hover:border-accent/60 cursor-pointer transition-all group">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <ImageIcon
                      size={20}
                      className="text-text-muted group-hover:text-accent"
                    />
                    <span className="text-sm font-bold text-text-secondary group-hover:text-text">
                      {productForm.image_url
                        ? "Alterar foto"
                        : "Fazer upload da foto"}
                    </span>
                  </label>

                  {/* Input de texto escondido ou pequeno apenas para conferência (opcional) */}
                  {productForm.image_url && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Check size={14} className="text-green-500" />
                      <span className="text-[10px] text-green-500 font-bold uppercase truncate max-w-[200px]">
                        Imagem pronta para salvar
                      </span>
                      <button
                        onClick={() =>
                          setProductForm((f) => ({ ...f, image_url: "" }))
                        }
                        className="ml-auto text-red-400 hover:text-red-500"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </FormField>

              <FormField label="Nome *">
                <input
                  className={inputCls}
                  placeholder="Nome do produto"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </FormField>

              <FormField label="Descrição">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Descreva o produto..."
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Preço (R$) *">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, price: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Ordem">
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={productForm.sort_order}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        sort_order: e.target.value,
                      }))
                    }
                  />
                </FormField>
              </div>

              <FormField label="Categoria">
                <select
                  className={inputCls}
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm((f) => ({
                      ...f,
                      category_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-alt">
                <div>
                  <p className="text-sm font-bold text-text">Disponível</p>
                  <p className="text-xs text-text-muted">
                    Aparece no cardápio público
                  </p>
                </div>
                <Toggle
                  checked={productForm.is_available}
                  onChange={(v) =>
                    setProductForm((f) => ({ ...f, is_available: v }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setProductModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:text-text font-bold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProduct}
                  disabled={savingProduct}
                  className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
                >
                  {savingProduct
                    ? "Salvando..."
                    : editingProduct
                      ? "Salvar alterações"
                      : "Criar produto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CATEGORY MODAL
      ══════════════════════════════════════════════════════ */}
      {categoryModal && (
        <Modal
          title={editingCategory ? "Editar categoria" : "Nova categoria"}
          onClose={() => setCategoryModal(false)}
        >
          <FormField label="Emoji">
            <input
              className={inputCls}
              placeholder="🌭"
              maxLength={4}
              value={catEmoji}
              onChange={(e) => setCatEmoji(e.target.value)}
            />
          </FormField>
          <FormField label="Nome *">
            <input
              className={inputCls}
              placeholder="Ex: Cachorros Quentes"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
          </FormField>
          <ModalActions
            onCancel={() => setCategoryModal(false)}
            onConfirm={saveCategory}
            saving={savingCat}
            label={editingCategory ? "Salvar" : "Criar categoria"}
          />
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          ADDON MODAL
      ══════════════════════════════════════════════════════ */}
      {addonModal && (
        <Modal
          title={editingAddon ? "Editar adicional" : "Novo adicional"}
          onClose={() => setAddonModal(false)}
        >
          <FormField label="Nome *">
            <input
              className={inputCls}
              placeholder="Ex: Queijo"
              value={addonForm.name}
              onChange={(e) =>
                setAddonForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Preço (R$)">
            <input
              className={inputCls}
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={addonForm.price}
              onChange={(e) =>
                setAddonForm((f) => ({ ...f, price: e.target.value }))
              }
            />
          </FormField>
          <ModalActions
            onCancel={() => setAddonModal(false)}
            onConfirm={saveAddon}
            saving={savingAddon}
            label={editingAddon ? "Salvar" : "Criar adicional"}
          />
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          DELETE CONFIRMATION
      ══════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm bg-surface border border-border rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <WarningCircle
                  size={28}
                  className="text-red-400"
                  weight="duotone"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">
                  Confirmar exclusão
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Deseja excluir{" "}
                  <span className="font-bold text-text">
                    "{deleteTarget.name}"
                  </span>
                  ? Essa ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:text-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

const inputCls = [
  "w-full bg-bg border border-border rounded-xl px-3.5 py-2.5",
  "text-sm text-text placeholder:text-text-muted",
  "focus:outline-none focus:border-accent/60 transition-all",
].join(" ");

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-alt rounded-full text-text-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  saving,
  label,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-bold text-sm hover:text-text transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        disabled={saving}
        className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
      >
        {saving ? "Salvando..." : label}
      </button>
    </div>
  );
}

/* Toggle — w-11 (44px) knob w-4 (16px)
   OFF → translate-x-1 (4px)  ✓
   ON  → translate-x-6 (24px) → 24+16=40 < 44 ✓ */
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none ${
        checked
          ? "bg-accent shadow-[0_0_10px_rgba(139,92,246,0.4)]"
          : "bg-surface-alt border border-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}
