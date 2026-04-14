
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminPageClient from "@/components/AdminPageClient";

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

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return <AdminPageClient />;
}