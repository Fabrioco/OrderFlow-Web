"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Printer } from "@phosphor-icons/react";
import { type Order } from "@/types/supabase";

export default function PrintPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase
        .from("orders")
        .select("*, customers(name, phone), order_items(*), tenants(name)")
        .eq("id", id)
        .single();
      setOrder((data as Order) ?? null);
      setLoading(false);
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Pedido não encontrado.</p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de ações — some na impressão */}
      <div className="print:hidden flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} weight="bold" />
          Voltar
        </button>

        <button
          onClick={() => {
            document.body.style.overflow = "hidden";
            window.print();
            document.body.style.overflow = "auto";
          }}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Printer size={16} weight="bold" />
          Imprimir
        </button>
      </div>
      {/* Cupom — centralizado na tela, aparece direto na impressão */}
      <div className="flex justify-center">
        <div
          id="receipt"
          style={{
            width: "300px",
            boxSizing: "border-box",
            padding: "16px",
            fontFamily: "'Courier New', monospace",
            color: "#000",
            background: "#fff",
            fontSize: "13px",
            lineHeight: "1.4",
            fontWeight: 700,
            letterSpacing: "0.5px",
            WebkitTextStroke: "0.2px black", // 🔥 aumenta densidade
          }}
        >
          {/* Header - NOME DINÂMICO */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #000", // Linha mais grossa
              paddingBottom: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "20px", // Aumentei um pouco
                fontWeight: "900", // Extra negrito
                textTransform: "uppercase",
              }}
            >
              {/* Pega o nome do restaurante do banco de dados */}
              The Order Flow
            </div>
            <div
              style={{ fontSize: "12px", marginTop: "2px", fontWeight: "bold" }}
            >
              {new Date(order.created_at).toLocaleString("pt-BR")}
            </div>
          </div>

          {/* Número do pedido */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: "900",
              marginBottom: "12px",
              textAlign: "center",
              borderBottom: "1px solid #000",
              paddingBottom: "4px",
            }}
          >
            PEDIDO #{String(order.order_number).padStart(4, "0")}
          </div>

          {/* Cliente */}
          <div style={{ marginBottom: "12px", fontWeight: "bold" }}>
            <strong>CLIENTE:</strong> {order.customers?.name || "Geral"}
            <br />
            <strong>TEL:</strong> {order.customers?.phone || "-"}
          </div>

          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />

          {/* Itens */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontWeight: "900",
                textDecoration: "underline",
                marginBottom: "8px",
              }}
            >
              ITENS:
            </div>
            {order.order_items?.map((item, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "900", // Mais peso no item principal
                  }}
                >
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span>
                    R$ {Number(item.unit_price).toFixed(2).replace(".", ",")}
                  </span>
                </div>

                {/* Adicionais com negrito */}
                {item.selected_addons?.map((addon, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginLeft: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    <span>+ {addon.name}</span>
                    <span>
                      R$ {Number(addon.price).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}

                {item.observation && (
                  <div
                    style={{
                      fontSize: "11px",
                      marginLeft: "12px",
                      fontStyle: "italic",
                      marginTop: "2px",
                    }}
                  >
                    * {item.observation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />

          {/* Endereço */}
          {order.delivery_address && (
            <div style={{ marginBottom: "12px", fontWeight: "bold" }}>
              <strong style={{ textDecoration: "underline" }}>
                ENTREGA EM:
              </strong>
              <br />
              {order.delivery_address.street}, {order.delivery_address.number}
              <br />
              {order.delivery_address.neighborhood} -{" "}
              {order.delivery_address.city || "SP"}
            </div>
          )}

          <div style={{ borderTop: "2px solid #000", margin: "8px 0" }} />

          {/* Pagamento Detalhado */}
          {/* Pagamento Detalhado com Traduções */}
          <div style={{ marginBottom: "8px", fontWeight: "900" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span>FORMA DE PAGTO:</span>
              <span style={{ textAlign: "right" }}>
                {order.payment_method === "credit_card" && "CARTÃO (ONLINE)"}
                {order.payment_method === "pix" && "PIX (NA ENTREGA)"}
                {order.payment_method === "cash" && "DINHEIRO (NA ENTREGA)"}
                {order.payment_method === "card_on_delivery" &&
                  "CARTÃO (NA ENTREGA)"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span>SUBTOTAL:</span>
              <span>
                R${" "}
                {Number(order.subtotal || 0)
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>TAXA ENTREGA:</span>
              <span>
                R${" "}
                {Number(order.delivery_fee || 0)
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>
          </div>
          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />

          {/* Total Gigante para não ter erro */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "20px",
              fontWeight: "900",
              marginTop: "5px",
            }}
          >
            <span>TOTAL:</span>
            <span>R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
          </div>

          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />

          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              marginTop: "10px",
              fontWeight: "bold",
            }}
          >
            {process.env.NEXT_PUBLIC_URL}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          /* 1. Remove qualquer margem do navegador */
          @page {
            size: 80mm auto; /* Tamanho exato da bobina */
            margin: 0 !important;
          }

          /* 2. Força o corpo a ser apenas o cupom */
          body,
          html {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important; /* Previne scroll que causa 2ª página */
          }

          /* 3. Oculta tudo que não é o nosso ID */
          body * {
            visibility: hidden;
          }

          #receipt,
          #receipt * {
            visibility: visible;
          }

          /* 4. O segredo: Cupom posicionado no topo, altura absoluta */
          #receipt {
            display: block !important;
            width: 78mm !important;
            margin: 0 !important;
            padding: 1mm 2mm 5mm 2mm !important; /* Espaço inferior para o corte */
            height: auto !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
        }
      `}</style>{" "}
    </>
  );
}
