
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminPageClient from "@/components/AdminPageClient";

export default async function AdminPoolsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return <AdminPageClient />; // reutilizas el mismo
}