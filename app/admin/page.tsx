import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// /admin no tiene página propia: al entrar, el admin va directo a resultados
// (que es donde se trabaja a diario). Si no es admin, vuelve a la home pública.
export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  redirect("/admin/results");
}
