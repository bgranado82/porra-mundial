
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminStandingsPageClient from "@/components/AdminStandingsPageClient";

export default async function AdminStandingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/");
  return <AdminStandingsPageClient />;
}
