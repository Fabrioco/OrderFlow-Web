"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  XIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  InstagramLogoIcon,
  ShieldCheckIcon,
  FileTextIcon,
  ChartLineUpIcon,
  ChatCircleTextIcon,
  ArrowClockwiseIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react/ssr";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalType = "terms" | "privacy" | "status" | "contact" | null;
type ServiceStatus = "operational" | "degraded" | "outage";

interface ServiceResult {
  name: string;
  status: ServiceStatus;
  latency: number | null;
  error?: string;
}

interface StatusResponse {
  overall: ServiceStatus;
  services: ServiceResult[];
  checkedAt: string;
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-surface shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  icon,
  title,
  onClose,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  onClose: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
        <h2 className="text-lg font-bold tracking-tight text-text">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {action}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-all"
        >
          <XIcon size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function ModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-y-auto flex-1 px-8 py-6 text-sm text-text-secondary leading-relaxed space-y-6">
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-black mb-2 uppercase tracking-widest text-accent/80">
        {title}
      </h3>
      <div className="text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

// ─── TERMOS ───────────────────────────────────────────────────────────────────

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose}>
      <ModalHeader
        icon={<FileTextIcon size={20} weight="duotone" />}
        title="Termos de Uso"
        onClose={onClose}
      />
      <ModalBody>
        <p className="text-text-muted text-xs uppercase tracking-widest font-bold">
          Última atualização: janeiro de 2026
        </p>
        <Section title="1. Aceitação">
          Ao criar uma conta ou utilizar a plataforma OrderFlow, você concorda
          com estes Termos de Uso. Caso não concorde, não utilize nossos
          serviços.
        </Section>
        <Section title="2. Descrição do serviço">
          O OrderFlow é uma plataforma SaaS de gestão de pedidos voltada para
          lanchonetes, hamburguerias e negócios alimentícios de pequeno e médio
          porte. Oferecemos ferramentas de cardápio digital, PDV, gestão de
          mesas e métricas.
        </Section>
        <Section title="3. Conta e responsabilidades">
          Você é responsável por manter a confidencialidade das suas
          credenciais. Todo conteúdo adicionado à plataforma (cardápios, fotos,
          preços) é de sua responsabilidade. O OrderFlow não verifica a
          veracidade dessas informações.
        </Section>
        <Section title="4. Planos e pagamentos">
          Os planos pagos são cobrados mensalmente via Mercado Pago. O período
          de teste gratuito de 14 dias não requer cartão de crédito. Após o
          período trial, a conta é convertida automaticamente para o plano
          gratuito se nenhuma assinatura for ativada.
        </Section>
        <Section title="5. Cancelamento">
          Você pode cancelar sua assinatura a qualquer momento. O cancelamento
          entra em vigor ao final do período vigente. Não realizamos reembolsos
          proporcionais por período não utilizado.
        </Section>
        <Section title="6. Limitação de responsabilidade">
          O OrderFlow não se responsabiliza por lucros cessantes, perdas de
          dados ou danos indiretos decorrentes do uso ou impossibilidade de uso
          da plataforma.
        </Section>
        <Section title="7. Alterações">
          Podemos atualizar estes Termos a qualquer momento. Notificaremos por
          e-mail sobre mudanças relevantes. O uso continuado após a notificação
          configura aceitação.
        </Section>
        <Section title="8. Contato">
          Dúvidas sobre estes termos? Entre em contato via{" "}
          <span className="text-accent font-medium">
            fabricioolivieralopes50@gmail.com
          </span>
          .
        </Section>
      </ModalBody>
    </Modal>
  );
}

// ─── PRIVACIDADE ──────────────────────────────────────────────────────────────

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose}>
      <ModalHeader
        icon={<ShieldCheckIcon size={20} weight="duotone" />}
        title="Política de Privacidade"
        onClose={onClose}
      />
      <ModalBody>
        <p className="text-text-muted text-xs uppercase tracking-widest font-bold">
          Última atualização: janeiro de 2026
        </p>
        <Section title="1. Dados coletados">
          Coletamos apenas os dados necessários para o funcionamento da
          plataforma: nome, e-mail, dados do negócio (nome, CNPJ opcional) e
          informações de uso para melhorar a experiência.
        </Section>
        <Section title="2. Como usamos seus dados">
          Seus dados são usados exclusivamente para: autenticação na plataforma,
          processamento de pagamentos via Mercado Pago, envio de notificações
          operacionais e melhoria contínua do produto. Nunca vendemos seus dados
          a terceiros.
        </Section>
        <Section title="3. Compartilhamento">
          Compartilhamos dados apenas com parceiros essenciais: Supabase
          (hospedagem do banco de dados) e Mercado Pago (processamento de
          pagamentos). Ambos possuem políticas de privacidade próprias e aderem
          à LGPD.
        </Section>
        <Section title="4. Segurança">
          Utilizamos criptografia em trânsito (TLS) e em repouso. O acesso aos
          dados é controlado por Row Level Security (RLS) no banco de dados,
          garantindo isolamento entre tenants.
        </Section>
        <Section title="5. Seus direitos (LGPD)">
          Em conformidade com a Lei Geral de Proteção de Dados (Lei
          13.709/2018), você tem direito a: acessar, corrigir ou excluir seus
          dados, revogar consentimentos e solicitar portabilidade. Exerça esses
          direitos pelo e-mail{" "}
          <span className="text-accent font-medium">privacidade@order</span>.
        </Section>
        <Section title="6. Cookies">
          Utilizamos cookies de sessão para autenticação e cookies analíticos
          anônimos para entender o uso da plataforma. Não utilizamos cookies de
          rastreamento publicitário.
        </Section>
        <Section title="7. Retenção de dados">
          Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da
          conta, os dados são removidos em até 30 dias dos nossos servidores.
        </Section>
      </ModalBody>
    </Modal>
  );
}

// ─── STATUS ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  operational: {
    label: "Operacional",
    color: "text-emerald-400",
    icon: (
      <CheckCircleIcon size={18} weight="fill" className="text-emerald-400" />
    ),
  },
  degraded: {
    label: "Degradado",
    color: "text-yellow-400",
    icon: (
      <WarningCircleIcon size={18} weight="fill" className="text-yellow-400" />
    ),
  },
  outage: {
    label: "Fora do ar",
    color: "text-red-400",
    icon: (
      <WarningCircleIcon size={18} weight="fill" className="text-red-400" />
    ),
  },
};

function formatLatency(ms: number | null) {
  if (ms === null) return "—";
  if (ms === 0) return "<1ms";
  return `${ms}ms`;
}

function StatusModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error();
      const json: StatusResponse = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const overall = data?.overall ?? "operational";
  const cfg = STATUS_CONFIG[overall];

  return (
    <Modal open onClose={onClose}>
      <ModalHeader
        icon={<ChartLineUpIcon size={20} weight="duotone" />}
        title="Status da Plataforma"
        onClose={onClose}
        action={
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-all disabled:opacity-40"
            title="Atualizar"
          >
            <ArrowClockwiseIcon
              size={16}
              weight="bold"
              className={loading ? "animate-spin" : ""}
            />
          </button>
        }
      />
      <ModalBody>
        {loading && !data ? (
          <div className="flex items-center justify-center py-10 gap-3 text-text-muted">
            <SpinnerGapIcon size={20} className="animate-spin" />
            <span className="text-sm">Verificando serviços…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <WarningCircleIcon
              size={28}
              weight="fill"
              className="text-red-400"
            />
            <p className="text-sm text-text-secondary">
              Não foi possível verificar o status agora.
            </p>
            <button
              onClick={fetchStatus}
              className="text-xs font-bold text-accent hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                overall === "operational"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : overall === "degraded"
                    ? "border-yellow-500/20 bg-yellow-500/5"
                    : "border-red-500/20 bg-red-500/5"
              }`}
            >
              {cfg.icon}
              <div className="flex-1">
                <p className="font-bold text-text text-sm">
                  {overall === "operational"
                    ? "Todos os sistemas operacionais"
                    : overall === "degraded"
                      ? "Alguns sistemas com instabilidade"
                      : "Interrupção detectada"}
                </p>
                {data?.checkedAt && (
                  <p className="text-text-muted text-xs mt-0.5">
                    Verificado às{" "}
                    {new Date(data.checkedAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {data?.services.map((svc) => {
                const scfg = STATUS_CONFIG[svc.status];
                return (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between py-3 px-4 rounded-xl border border-border bg-surface-alt/50"
                  >
                    <div className="flex items-center gap-2.5">
                      {scfg.icon}
                      <span className="text-sm text-text font-medium">
                        {svc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-text-muted font-mono">
                        {formatLatency(svc.latency)}
                      </span>
                      <span className={`text-xs font-bold ${scfg.color}`}>
                        {scfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}

// ─── CONTATO ─────────────────────────────────────────────────────────────────

function ContactModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "Erro ao enviar. Tente novamente.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.");
      setState("error");
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader
        icon={<ChatCircleTextIcon size={20} weight="duotone" />}
        title="Fale conosco"
        onClose={onClose}
      />
      <ModalBody>
        {state === "success" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircleIcon
                size={32}
                weight="fill"
                className="text-accent"
              />
            </div>
            <h3 className="text-text font-bold text-lg">Mensagem enviada!</h3>
            <p className="text-text-secondary text-sm max-w-xs">
              Recebemos sua mensagem e responderemos em até 24 horas no e-mail
              informado.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm bg-accent text-white hover:brightness-110 transition-all"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="mailto:fabricioolivieralopes50@gmail.com"
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-alt hover:border-accent/40 hover:bg-accent/5 transition-all group"
              >
                <EnvelopeIcon
                  size={20}
                  weight="duotone"
                  className="text-accent shrink-0"
                />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    E-mail
                  </p>
                  <p className="text-xs text-text font-medium group-hover:text-accent transition-colors">
                    fabricioolivieralopes50@gmail.com
                  </p>
                </div>
              </a>
              <a
                href="https://instagram.com/eufafalopes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-alt hover:border-accent/40 hover:bg-accent/5 transition-all group"
              >
                <InstagramLogoIcon
                  size={20}
                  weight="duotone"
                  className="text-accent shrink-0"
                />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Instagram
                  </p>
                  <p className="text-xs text-text font-medium group-hover:text-accent transition-colors">
                    @eufafalopes
                  </p>
                </div>
              </a>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:bg-accent/5 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:bg-accent/5 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                  Mensagem
                </label>
                <textarea
                  rows={4}
                  placeholder="Como podemos te ajudar?"
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:bg-accent/5 transition-all resize-none"
                />
              </div>

              {state === "error" && (
                <p className="text-red-400 text-xs font-medium px-1">
                  {errorMsg}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  !form.name ||
                  !form.email ||
                  !form.message ||
                  state === "loading"
                }
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-accent text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                {state === "loading" ? (
                  <>
                    <SpinnerGapIcon size={16} className="animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar mensagem"
                )}
              </button>
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}

// ─── Footer com modais ────────────────────────────────────────────────────────

export function FooterWithModals() {
  const [active, setActive] = useState<ModalType>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <>
      <footer className="py-12 px-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-text-muted text-[10px] tracking-widest font-bold uppercase">
        <div className="text-center md:text-left">
          <p className="text-text-secondary mb-1">OrderFlow Solutions</p>
          <p>© 2026 ORDERFLOW. Todos os direitos reservados.</p>
        </div>
        <div className="flex gap-8">
          {(
            [
              ["terms", "Termos"],
              ["privacy", "Privacidade"],
              ["status", "Status"],
              ["contact", "Contatos"],
            ] as [ModalType, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className="hover:text-text transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </footer>

      {active === "terms" && <TermsModal onClose={close} />}
      {active === "privacy" && <PrivacyModal onClose={close} />}
      {active === "status" && <StatusModal onClose={close} />}
      {active === "contact" && <ContactModal onClose={close} />}
    </>
  );
}

export { TermsModal, PrivacyModal, StatusModal, ContactModal };
