import { PAYMENT_LABELS } from "@/constants/payment-methods";
import { CardPayment } from "@mercadopago/sdk-react";
import {
  CheckCircleIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { InfoField } from "./InfoField";
import { inputCls } from "@/constants/input-cls";
import { DeliveryZone, Tenant } from "@/types/supabase";
import { toast } from "sonner";
import { CustomerForm } from "@/types/customerForm";



type Payload = {
  token: string;
  payment_method_id: string;
  issuer_id: string;
  installments: number;
  payer: {
    email?: string;
    identification: {
      type?: string;
      number?: string;
    };
  };
};

export default function DrawerInfo({
  zones,
  setForm,
  form,
  tenant,
  isCardPayment,
  mpReady,
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
  isCardPayment: boolean;
  mpReady: boolean;
  totalFinal: number;
  handleCheckout: (payload?: Payload) => void;
  cartTotal: number;
  selectedZone: DeliveryZone | undefined;
  deliveryFee: number;
  processing: boolean;
}) {
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
                  <span className="font-bold text-sm">{meta.label}</span>
                  {form.payment_method === method && (
                    <CheckCircleIcon
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
                        type: param.payer?.identification?.type || "CPF",
                        number: param.payer?.identification?.number,
                      },
                    },
                  };

                  await handleCheckout(payload);
                }}
                onError={() => {
                  toast.error("Erro ao processar cartão. Tente novamente.");
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
              <span>R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
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
                <CheckCircleIcon size={20} weight="bold" /> Confirmar Pedido
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
