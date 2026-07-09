import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SimuladorPageClient from "@/components/SimuladorPageClient";

export default async function AdminSimuladorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/");
  return <SimuladorPageClient />;
}
