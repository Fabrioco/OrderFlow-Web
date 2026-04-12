import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPainelRoute = request.nextUrl.pathname.includes("/painel/");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isUpgradeRoute = request.nextUrl.pathname.includes("/upgrade");

  // ── Sem sessão → login ──────────────────────────────────────
  if ((isPainelRoute || isAdminRoute) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isPainelRoute) {
    const urlSlug = request.nextUrl.pathname.split("/")[1];

    // Busca dados do usuário e do tenant em paralelo
    const [{ data: userRole }, { data: tenant }] = await Promise.all([
      supabase
        .from("tenant_users")
        .select("role, tenants(slug)")
        .eq("user_id", session.user.id)
        .single(),
      supabase
        .from("tenants")
        .select("plan, plan_expires_at, trial_started_at, is_blocked")
        .eq("slug", urlSlug)
        .single(),
    ]);

    const userTenantSlug = (userRole?.tenants as any)?.slug;

    // ── Protege o painel de outro tenant ───────────────────────
    if (userRole?.role !== "admin" && userTenantSlug !== urlSlug) {
      return NextResponse.redirect(
        new URL(`/${userTenantSlug}/painel/pedidos`, request.url),
      );
    }

    // ── Tenant bloqueado pelo admin ────────────────────────────
    if (tenant?.is_blocked && !isUpgradeRoute) {
      return NextResponse.redirect(
        new URL(`/${urlSlug}/upgrade?reason=blocked`, request.url),
      );
    }

    // ── Trial expirado ─────────────────────────────────────────
    // Só bloqueia se for plano free E trial_started_at existe E já passou 14 dias
    // plan_expires_at = NULL significa assinatura ativa sem expiração (ex: sogra)
    if (tenant && !isUpgradeRoute) {
      const plan = tenant.plan;
      const trialStarted = tenant.trial_started_at
        ? new Date(tenant.trial_started_at)
        : null;
      const planExpiresAt = tenant.plan_expires_at
        ? new Date(tenant.plan_expires_at)
        : null;

      const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
      const now = new Date();

      const isTrialExpired =
        plan === "free" &&
        !!trialStarted &&
        now.getTime() - trialStarted.getTime() > TRIAL_MS;

      // Assinatura paga expirada (plan_expires_at preenchido e já passou)
      const isPlanExpired =
        plan !== "free" && !!planExpiresAt && now > planExpiresAt;

      if (isTrialExpired || isPlanExpired) {
        return NextResponse.redirect(
          new URL(`/${urlSlug}/upgrade?reason=expired`, request.url),
        );
      }
    }
  }

  // ── Proteção Admin ──────────────────────────────────────────
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/:slug/painel/:path*", "/admin/:path*"],
};
