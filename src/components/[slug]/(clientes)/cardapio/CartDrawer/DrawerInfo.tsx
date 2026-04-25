import { PAYMENT_LABELS } from "@/constants/payment-methods";
import {
  CheckCircleIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { InfoField } from "./InfoField";
import { inputCls } from "@/constants/input-cls";
import { DeliveryZone, Tenant } from "@/types/supabase";
import { CustomerForm } from "@/types/customerForm";

export default function DrawerInfo({
  zones,
  setForm,
  form,
  tenant,
  totalFinal,
  handleCheckout,
  selectedZone,
  cartTotal,
  deliveryFee,
  processing,
}: {
  zones: { id: string; neighborhood: string; fee: number }[];
  setForm: (f: (form: CustomerForm) => CustomerForm) => void;
  form: CustomerForm;
  tenant: Tenant;
  totalFinal: number;
  handleCheckout: () => void;
  cartTotal: number;
  selectedZone: DeliveryZone | undefined;
  deliveryFee: number;
  processing: boolean;
}) {
  const primary = tenant.primary_color || "#D2BBFF";
  const textColor = tenant.button_text_color || "#000";

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <InfoField label="Nome completo" icon={<UserIcon size={16} />}>
          <input
            className={inputCls}
            placeholder="Seu nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </InfoField>

        <InfoField label="WhatsApp" icon={<PhoneIcon size={16} />}>
          <input
            className={inputCls}
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </InfoField>

        <InfoField label="Bairro" icon={<MapPinIcon size={16} />}>
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
                {z.neighborhood} — taxa R$ {z.fee.toFixed(2).replace(".", ",")}
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
            placeholder="Alguma observação?"
            value={form.observation}
            onChange={(e) =>
              setForm((f) => ({ ...f, observation: e.target.value }))
            }
          />
        </InfoField>

        {/* PAGAMENTO */}
        <div>
          <label className="block text-[10px] font-black text-menu-text-secondary uppercase tracking-widest mb-2">
            Forma de pagamento
          </label>

          <div className="space-y-2">
            {(tenant.payment_methods ?? []).map((method) => {
              const meta = PAYMENT_LABELS[method];
              if (!meta) return null;

              const selected = form.payment_method === method;

              return (
                <button
                  key={method}
                  onClick={() =>
                    setForm((f) => ({ ...f, payment_method: method }))
                  }
                  style={
                    selected
                      ? {
                          borderColor: primary,
                          backgroundColor: primary, // Aplicando a cor primária no fundo
                          color: textColor, // A cor do texto (button_text_color)
                        }
                      : {
                          borderColor: "rgba(var(--menu-border-rgb), 0.3)", // Ajuste conforme seu CSS
                          backgroundColor: "transparent",
                          color: "inherit",
                        }
                  }
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                    selected
                      ? ""
                      : "border-menu-border/30 bg-menu-bg/50 text-menu-text-secondary"
                  }`}
                >
                  {/* O ícone herdará a cor do texto do botão */}
                  <span style={{ color: selected ? textColor : undefined }}>
                    {meta.icon}
                  </span>

                  <span className="font-bold text-sm">{meta.label}</span>

                  {selected && (
                    <CheckCircleIcon
                      size={18}
                      weight="fill"
                      style={{ color: textColor }} // Forçando o ícone de check usar o button_text_color
                      className="ml-auto"
                    />
                  )}
                </button>
              );
            })}{" "}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-menu-border/20 space-y-3 shrink-0">
          <div className="flex justify-between text-sm text-menu-text-secondary">
            <span>Subtotal</span>
            <span>
              {cartTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>

          {selectedZone && (
            <div className="flex justify-between text-sm text-menu-text-secondary">
              <span>Entrega</span>
              <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-menu-border/20">
            <span className="text-xs font-bold uppercase">Total</span>
            <span className="text-2xl font-black" style={{ color: primary }}>
              {totalFinal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processing}
            style={{
              backgroundColor: primary,
              color: textColor,
            }}
            className="w-full py-4 font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 mb-20"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircleIcon size={20} weight="bold" />
                Confirmar Pedido
              </>
            )}
          </button>
        </div>
    </>
  );
}
