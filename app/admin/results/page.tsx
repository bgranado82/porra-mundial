import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminResultsPageClient from "@/components/AdminResultsPageClient";

export default async function AdminResultsPage() {
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

  if (error || !profile) {
    redirect("/");
  }

  if (profile.role !== "admin") {
    redirect("/");
  }

  return <AdminResultsPageClient />;
}