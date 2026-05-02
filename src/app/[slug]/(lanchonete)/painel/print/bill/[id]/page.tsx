"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Printer } from "@phosphor-icons/react";

type BillData = {
  id: string;
  subtotal: number;
  service_charge: boolean;
  service_amount: number;
  total: number;
  payment_method: string | null;
  created_at: string;
  tables: {
    label: string | null;
    number: number;
  } | null;
  orders: {
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
  }[];
};

export default function PrintBillPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBill() {
      const { data } = await supabase
        .from("bills")
        .select(
          `
          *,
          tables(label, number),
          orders(
            id,
            order_number,
            created_at,
            order_items(*)
          )
        `,
        )
        .eq("id", id)
        .single();

      setBill((data as BillData) ?? null);
      setLoading(false);
    }

    fetchBill();
  }, [id]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const receiptElement = document.getElementById("receipt");

    if (printWindow && receiptElement) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Comanda</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: 'Courier New', monospace; 
              display: flex;        /* ESSENCIAL: Inicia o flexbox */
              justify-content: center; /* ESSENCIAL: Centraliza horizontalmente */
            }
            #receipt { 
              width: 78mm; 
              padding: 5px; 
              box-sizing: border-box; /* Garante que o padding não aumente a largura */
            }
          </style>
        </head>
        <body>
          ${receiptElement.outerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-gray-400 rounded-full" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Comanda não encontrada.</p>
      </div>
    );
  }

  const tableLabel = bill.tables?.label ?? `Mesa ${bill.tables?.number ?? ""}`;

  const paymentLabel =
    {
      cash: "DINHEIRO",
      card: "CARTÃO",
      pix: "PIX",
    }[bill.payment_method || ""] || "—";

  return (
    <main className="lg:ml-64 min-h-screen bg-gray-100">
      {/* Barra */}
      <div className="print:hidden flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-menu-bg border text-menu-text text-sm font-bold"
        >
          <ArrowLeft size={16} weight="bold" />
          Voltar
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-menu-bg text-menu-text text-sm font-bold"
        >
          <Printer size={16} weight="bold" />
          Imprimir
        </button>
      </div>
      {/* Cupom */}
      {/* Cupom */}
      <div className="min-h-[calc(100vh-73px)] py-10 flex justify-center print:bg-white print:p-0">
        {" "}
        <div
          id="receipt"
          style={{
            width: "300px",
            padding: "16px",
            fontFamily: "'Courier New', monospace",
            color: "#000",
            background: "#fff",
            fontSize: "13px",
            lineHeight: "1.4",
            fontWeight: 700,
            letterSpacing: "0.5px",
            WebkitTextStroke: "0.2px black",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          }}
        >
          {" "}
          {/* HEADER */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px solid #000",
              paddingBottom: "8px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: "900",
                textTransform: "uppercase",
              }}
            >
              COMANDA
            </div>

            <div style={{ fontSize: "14px", fontWeight: "bold" }}>
              {tableLabel}
            </div>

            <div style={{ fontSize: "12px", fontWeight: "bold" }}>
              {new Date(bill.created_at).toLocaleString("pt-BR")}
            </div>
          </div>
          {/* PEDIDOS */}
          {bill.orders.map((order) => (
            <div key={order.id} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "900",
                  textAlign: "center",
                  borderBottom: "1px solid #000",
                  paddingBottom: "4px",
                  marginBottom: "6px",
                }}
              >
                PEDIDO #{String(order.order_number).padStart(4, "0")}
              </div>

              {order.order_items.map((item) => {
                const addonsTotal =
                  item.selected_addons?.reduce((s, a) => s + a.price, 0) ?? 0;

                const total = (item.unit_price + addonsTotal) * item.quantity;

                return (
                  <div key={item.id} style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "900",
                      }}
                    >
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                    </div>

                    {item.selected_addons?.map((addon, i) => (
                      <div
                        key={i}
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
                          R$ {addon.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    ))}

                    {item.observation && (
                      <div
                        style={{
                          fontSize: "11px",
                          marginLeft: "12px",
                          fontStyle: "italic",
                        }}
                      >
                        * {item.observation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />
          {/* TOTAIS */}
          <div style={{ fontWeight: "900" }}>
            {" "}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>SUBTOTAL:</span>
              <span>
                R$ {Number(bill.subtotal).toFixed(2).replace(".", ",")}
              </span>
            </div>
            {bill.service_charge && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>SERVIÇO (10%):</span>
                <span>
                  R$ {Number(bill.service_amount).toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
          </div>
          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />
          {/* TOTAL */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "20px",
              fontWeight: "900",
            }}
          >
            <span>TOTAL:</span>
            <span>R$ {Number(bill.total).toFixed(2).replace(".", ",")}</span>
          </div>
          <div style={{ borderTop: "2px dashed #000", margin: "8px 0" }} />
          {/* PAGAMENTO */}
          <div style={{ fontWeight: "900" }}>PAGAMENTO: {paymentLabel}</div>
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              marginTop: "10px",
              fontWeight: "bold",
            }}
          >
            The Order Flow
          </div>
        </div>
      </div>
      {/* CSS impressão */}
    </main>
  );
}
