import { createAdminClient } from "@/utils/supabase/admin";

type Standing = {
  entry_id: string;
  pool_id: string;
  total_points: number;
  name: string;
};

export async function saveStandingsSnapshot(standings: Standing[]) {
  const supabase = createAdminClient();

  if (!standings.length) return;

  const rows = standings.map((row, index) => ({
    pool_id: row.pool_id,
    entry_id: row.entry_id,
    position: index + 1,
    total_points: row.total_points,
  }));

  const { error } = await supabase
    .from("standings_snapshots")
    .insert(rows);

  if (error) {
    throw error;
  }
}