import { CaretRightIcon } from "@phosphor-icons/react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-40 px-6 text-center relative">
      <div className="relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-10 tracking-tight text-text">
          Pronto para transformar <br /> sua operação?
        </h2>
        <Link
          href="/register"
          className="group px-12 py-5 w-fit rounded-2xl text-xl font-bold bg-linear-to-r from-[#C084FC] to-accent hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all flex items-center gap-3 mx-auto text-menu-text"
        >
          Criar minha lanchonete agora
          <CaretRightIcon
            size={24}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
        <p className="mt-6 text-text-muted text-sm font-medium">
          Teste grátis por 14 dias. Sem cartão de crédito.
        </p>
      </div>
    </section>
  );
}
