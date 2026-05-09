import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Si se llama desde un Server Component puro (sin contexto de Action o Route Handler),
          // cookies().set() lanza error. Lo envolvemos en try/catch para no romper esos casos —
          // el refresh real lo hace el middleware en cada request, así que no perdemos nada.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component: ignorar.
          }
        },
      },
    }
  );
}
