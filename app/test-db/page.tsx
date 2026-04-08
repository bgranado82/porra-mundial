import { getSupabase } from "@/lib/supabase";

export default async function TestDbPage() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("pools")
    .select("*");

  return (
    <main style={{ padding: 24 }}>
      <h1>Test DB</h1>

      {error ? (
        <pre>{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}