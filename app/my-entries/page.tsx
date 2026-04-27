import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function MyEntriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: entries, error } = await supabase
    .from("entries")
    .select(`
      id,
      entry_number,
      status,
      pools (
        slug,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("entry_number", { ascending: true });

  if (error || !entries || entries.length === 0) {
    redirect("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, var(--iberdrola-green-light) 0%, #ffffff 50%, var(--iberdrola-sky-light) 100%)" }}
    >
      <div className="w-full max-w-lg fade-in">
        <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white/90 p-6 shadow-xl backdrop-blur-sm md:p-8">

          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-3xl bg-[var(--iberdrola-green)] opacity-10 blur-xl scale-110" />
              <img
                src="/logo.png"
                alt="Ibe World Cup"
                className="relative h-20 w-20 rounded-3xl shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--iberdrola-forest)]">
              Mis porras
            </h1>
            <p className="mt-2 text-sm text-[var(--iberdrola-forest)]/55">
              Elige qué porra quieres abrir.
            </p>
          </div>

          <div className="grid gap-3">
            {entries.map((entry) => {
              const pool = Array.isArray(entry.pools) ? entry.pools[0] : entry.pools;
              const isSubmitted = entry.status === "submitted";

              return (
                <Link
                  key={entry.id}
                  href={`/pool/${pool?.slug}/entry/${entry.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 p-5 transition hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/45">
                        {pool?.name}
                      </div>
                      <div className="mt-1 text-lg font-black text-[var(--iberdrola-forest)]">
                        Porra {entry.entry_number}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        isSubmitted
                          ? "bg-[var(--iberdrola-green)]/15 text-[var(--iberdrola-green)]"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {isSubmitted ? "✓ Enviada" : "✏️ Borrador"}
                      </span>
                      <svg className="h-5 w-5 text-[var(--iberdrola-forest)]/30 transition group-hover:translate-x-1 group-hover:text-[var(--iberdrola-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--iberdrola-forest)]/40">
          Ibe World Cup 2026 · ibewc2026.com
        </p>
      </div>
    </main>
  );
}
