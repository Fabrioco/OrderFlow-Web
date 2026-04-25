// Gerado a partir do schema — atualize com:
// npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "cash" | "pix" | "card_on_delivery";

export type TenantPlan = "free" | "essencial" | "basico" | "pro";

export type UserRole = "owner" | "staff";

export type Step = "cart" | "info";

/* ── Tenant ───────────────────────────────────────────────── */
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string | null;
  banner_url: string | null;
  button_text_color: string | null;
  instagram_url: string | null;
  whatsapp_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  is_open: boolean;
  plan: TenantPlan;
  plan_expires_at: string | null; // novo
  trial_started_at: string; // novo
  is_blocked: boolean; // novo
  pix_key: string | null;
  pix_key_type: string | null;
  payment_methods: PaymentMethod[];
  mp_access_token: string | null;
  mp_refresh_token: string | null;
  mp_user_id: string | null;
  mp_public_key: string | null;
  mp_connected_at: string | null;
  created_at: string;
}
// Versão pública (sem dados sensíveis) — via view tenants_public
export type TenantPublic = Pick<
  Tenant,
  | "id"
  | "slug"
  | "name"
  | "logo_url"
  | "phone"
  | "address"
  | "city"
  | "is_open"
  | "plan"
  | "plan_expires_at" // novo
  | "trial_started_at" // novo
  | "is_blocked" // novo
  | "payment_methods"
  | "pix_key_type"
  | "mp_public_key"
  | "created_at"
>;

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: TenantPlan;
  status: "active" | "cancelled" | "expired";
  started_at: string;
  expires_at: string | null;
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Tenant User ──────────────────────────────────────────── */
export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  created_at: string;
}

/* ── Delivery Zone ────────────────────────────────────────── */
export interface DeliveryZone {
  id: string;
  tenant_id: string;
  neighborhood: string;
  fee: number;
  created_at: string;
}

/* ── Category ─────────────────────────────────────────────── */
export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  created_at: string;
}

/* ── Product ──────────────────────────────────────────────── */
export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  // joined
  categories?: Category;
}

/* ── Addon ────────────────────────────────────────────────── */
export interface Addon {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  is_available: boolean;
  created_at: string;
}

/* ── Customer ─────────────────────────────────────────────── */
export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  created_at: string;
}

/* ── Order ────────────────────────────────────────────────── */

export type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  observation: string | null;
  delivery_address: {
    street: string;
    number: string;
    neighborhood: string;
    city?: string;
    complement?: string;
  } | null;
  created_at: string;
  customers: { name: string; phone: string } | null;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    selected_addons: { name: string; price: number }[] | null;
    observation: string | null;
  }[];
  bills?: {
    table_id: string;
    tables: {
      number: number;
      label: string | null;
    };
  } | null;
};

/* ── Order Item ───────────────────────────────────────────── */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_addons: { name: string; price: number }[] | null;
  observation: string | null;
  created_at: string;
}

/* ── Payment ──────────────────────────────────────────────── */
export interface Payment {
  id: string;
  tenant_id: string;
  order_id: string;
  mp_payment_id: string | null;
  mp_status: string | null;
  mp_status_detail: string | null;
  payment_method: PaymentMethod;
  amount: number;
  mp_fee: number | null;
  net_amount: number | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  selected_addons: Addon[];
}
