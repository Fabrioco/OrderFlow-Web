import { useState } from "react";
import { Product, Tenant } from "@/types/supabase";
import { PlusIcon } from "@phosphor-icons/react";

export function ProductCard({
  product,
  tenant,
  handleProductClick,
}: {
  product: Product;
  tenant: Tenant;
  handleProductClick: (product: Product) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      key={product.id}
      onClick={() => {
        if (!tenant.is_open) return;
        handleProductClick(product);
      }}
      disabled={!tenant.is_open}
      className="group text-left bg-menu-surface border border-menu-border/20 rounded-4xl p-5 flex gap-5 hover:border-[#D2BBFF]/40 transition-all relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-menu-bg flex items-center justify-center text-4xl shadow-inner">
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
          <h3 className="font-black text-menu-text text-base uppercase tracking-tight italic group-hover:text-menu-accent transition-colors truncate">
            {product.name}
          </h3>

          <p
            className={`text-xs text-menu-text-secondary mt-1 leading-relaxed ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {product.description}
          </p>

          {product.description && product.description.length > 80 && (
            <span
              onClick={(e) => {
                e.stopPropagation(); // evita clicar no card
                setExpanded((prev) => !prev);
              }}
              className="text-xs text-menu-accent cursor-pointer mt-1 inline-block"
            >
              {expanded ? "ver menos" : "ver mais"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="font-black text-menu-accent text-lg">
            {Number(product.price).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>

          <div className="w-9 h-9 rounded-full bg-menu-accent/10 text-menu-accent flex items-center justify-center group-hover:bg-menu-accent group-hover:text-menu-accent-on transition-all">
            <PlusIcon size={18} weight="bold" />
          </div>
        </div>
      </div>
    </button>
  );
}
