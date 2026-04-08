import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function PostLoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: entries } = await supabase
    .from("entries")
    .select(`
      id,
      entry_number,
      pools (
        slug,
        name
      )
    `)
    .eq("user_id", user.id);

  if (!entries || entries.length === 0) {
    redirect("/");
  }

  if (entries.length === 1) {
    const entry = entries[0];
    const pool = Array.isArray(entry.pools) ? entry.pools[0] : entry.pools;

    redirect(`/pool/${pool.slug}/entry/${entry.id}`);
  }

  redirect("/my-entries");
}