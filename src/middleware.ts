import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // --- LÓGICA DE PROTEÇÃO DO ORDERFLOW ---
  const isPainelRoute = request.nextUrl.pathname.includes("/painel/pedidos");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if ((isPainelRoute || isAdminRoute) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session) {
    const { data: userRole } = await supabase
      .from("tenant_users")
      .select("role, tenants(slug)")
      .eq("user_id", session.user.id)
      .single();

    const urlSlug = request.nextUrl.pathname.split("/")[1];
    const userTenantSlug = (userRole?.tenants as any)?.slug;

    // Proteção Dono
    if (
      isPainelRoute &&
      userRole?.role !== "admin" &&
      userTenantSlug !== urlSlug
    ) {
      return NextResponse.redirect(
        new URL(`/${userTenantSlug}/painel/pedidos`, request.url),
      );
    }

    // Proteção Admin (Você)
    if (isAdminRoute && userRole?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/:slug/painel/:path*", "/admin/:path*"],
};
