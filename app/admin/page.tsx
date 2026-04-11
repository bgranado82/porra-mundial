import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminPageClient from "@/components/AdminPageClient";

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Obtener usuario logueado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 2. Obtener su perfil
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/");
  }

  // 3. Comprobar si es admin
  if (profile.role !== "admin") {
    redirect("/");
  }

  // 4. Acceso permitido
  return <AdminPageClient />;
}