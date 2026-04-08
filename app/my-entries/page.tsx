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
    .order("created_at", { ascending: true });

  if (error || !entries || entries.length === 0) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--iberdrola-green)] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-[var(--iberdrola-forest)]">
          Mis porras
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Elige qué porra quieres abrir.
        </p>

        <div className="mt-6 grid gap-3">
          {entries.map((entry) => {
            const pool = Array.isArray(entry.pools) ? entry.pools[0] : entry.pools;

            return (
              <Link
                key={entry.id}
                href={`/pool/${pool.slug}/entry/${entry.id}`}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4 transition hover:bg-[var(--iberdrola-green-light)]/30"
              >
                <div className="text-lg font-semibold text-[var(--iberdrola-forest)]">
                  {pool.name}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Porra {entry.entry_number}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Estado: {entry.status}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}