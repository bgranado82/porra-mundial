"use client";

type Standing = {
  entry_id: string;
  name: string;
  email: string;
  day_points: Record<string, number>;
  group_total: number;
  r32_points: number;
  r16_points: number;
  qf_points: number;
  sf_points: number;
  third_points: number;
  final_points: number;
  total_points: number;
  outcome_percent: number;
  exact_percent: number;
  position: number;
  movement: "up" | "down" | "same";
};

type Props = {
  days: number[];
  standings: Standing[];
};

function MovementBadge({ movement }: { movement: Standing["movement"] }) {
  if (movement === "up") {
    return <span className="ml-1 text-green-600">🔺</span>;
  }

  if (movement === "down") {
    return <span className="ml-1 text-red-600">🔻</span>;
  }

  return <span className="ml-1 text-gray-400">=</span>;
}

export default function StandingsTable({ days, standings }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--iberdrola-green)] bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--iberdrola-green-light)]">
          <tr>
            <th className="px-3 py-3 text-left">#</th>
            <th className="px-3 py-3 text-left">Jugador</th>

            {days.map((day) => (
              <th key={day} className="px-3 py-3 text-center whitespace-nowrap">
                Día {day}
              </th>
            ))}

            <th className="px-3 py-3 text-center whitespace-nowrap">Grupos</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">32</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">16</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">QF</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">SF</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">3º</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">Final</th>
            <th className="px-3 py-3 text-center whitespace-nowrap font-bold">Total</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">% signo</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">% exacto</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row) => (
            <tr key={row.entry_id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-3 font-bold whitespace-nowrap">
                {row.position}
                <MovementBadge movement={row.movement} />
              </td>

              <td className="px-3 py-3 font-medium whitespace-nowrap">
                {row.name || row.email || "Jugador"}
              </td>

              {days.map((day) => (
                <td key={day} className="px-3 py-3 text-center">
                  {row.day_points[String(day)] ?? 0}
                </td>
              ))}

              <td className="px-3 py-3 text-center font-semibold">{row.group_total}</td>
              <td className="px-3 py-3 text-center">{row.r32_points}</td>
              <td className="px-3 py-3 text-center">{row.r16_points}</td>
              <td className="px-3 py-3 text-center">{row.qf_points}</td>
              <td className="px-3 py-3 text-center">{row.sf_points}</td>
              <td className="px-3 py-3 text-center">{row.third_points}</td>
              <td className="px-3 py-3 text-center">{row.final_points}</td>
              <td className="px-3 py-3 text-center font-bold">{row.total_points}</td>
              <td className="px-3 py-3 text-center">{row.outcome_percent}%</td>
              <td className="px-3 py-3 text-center">{row.exact_percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}