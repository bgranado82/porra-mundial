import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de Supabase: refresca el token de sesión en cada navegación.
 *
 * Sin esto, cuando el token expira (por defecto 1h) la sesión se pierde —
 * particularmente visible en PWA instaladas en pantalla de inicio (iOS/Android),
 * donde el contexto se "duerme" durante horas y al volver el token está caducado.
 *
 * El middleware llama a getUser() para forzar a Supabase a refrescar el token
 * usando el refresh_token y reescribir las cookies actualizadas en la respuesta.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() refresca el token si hace falta y dispara setAll.
  // No quitar esta línea aunque no se use el valor.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Saltar rutas estáticas y de Next internas:
     * - _next/static
     * - _next/image
     * - favicon.ico, imágenes
     * - manifest, robots
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
