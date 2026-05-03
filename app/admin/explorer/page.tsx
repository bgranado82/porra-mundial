
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminExplorerPageClient from "@/components/AdminExplorerPageClient";

export default async function AdminExplorerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/");
  return <AdminExplorerPageClient />;
}
