"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Pool = { id: string; name: string; slug: string };

type Props = {
  selectedPoolId: string;
  onChange: (poolId: string) => void;
  className?: string;
};

export function useAdminPools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("pools").select("id, name, slug").then(({ data }: { data: Pool[] | null }) => {
      if (data) setPools(data);
      setLoading(false);
    });
  }, []);

  return { pools, loading };
}

export default function AdminPoolSelector({ selectedPoolId, onChange, className = "" }: Props) {
  const { pools, loading } = useAdminPools();

  if (loading) return <div className={`h-10 animate-pulse rounded-xl bg-gray-100 ${className}`} />;

  return (
    <select
      value={selectedPoolId}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
      className={`rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)] ${className}`}
    >
      <option value="">— Selecciona un pool —</option>
      {pools.map((p: Pool) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
