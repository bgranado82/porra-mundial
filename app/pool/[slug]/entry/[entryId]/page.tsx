"use client";

import { useEffect } from "react";

type Props = {
  params: {
    slug: string;
    entryId: string;
  };
};

export default function EntryPage({ params }: Props) {
  useEffect(() => {
    localStorage.setItem("active_pool_slug", params.slug);
    localStorage.setItem("active_entry_id", params.entryId);
    window.location.href = "/predictions";
  }, [params.entryId, params.slug]);

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] flex items-center justify-center p-6">
      <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)]">
          Accediendo a tu porra...
        </h1>
      </div>
    </main>
  );
}