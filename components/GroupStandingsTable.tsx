import { StandingRow } from "@/lib/standings";

type Props = {
  title: string;
  rows: StandingRow[];
  labels: {
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    goalDifference: string;
    pointsShort: string;
  };
};

export default function GroupStandingsTable({ title, rows, labels }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-[var(--iberdrola-forest)]">
        {title}
      </h3>

      <table className="w-full text-sm">
        <thead className="text-[var(--iberdrola-forest)]">
          <tr className="border-b border-[var(--iberdrola-sky)]/40">
            <th className="py-2 text-left">{labels.team}</th>
            <th className="py-2 text-center">{labels.played}</th>
            <th className="py-2 text-center">{labels.won}</th>
            <th className="py-2 text-center">{labels.drawn}</th>
            <th className="py-2 text-center">{labels.lost}</th>
            <th className="py-2 text-center">{labels.goalsFor}</th>
            <th className="py-2 text-center">{labels.goalsAgainst}</th>
            <th className="py-2 text-center">{labels.goalDifference}</th>
            <th className="py-2 text-center">{labels.pointsShort}</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.teamId}
              className="border-b border-[var(--iberdrola-sky)]/20 last:border-b-0"
            >
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center">{index + 1}</span>
                  <span>{row.teamFlag}</span>
                  <span>{row.teamName}</span>
                </div>
              </td>
              <td className="py-2 text-center">{row.played}</td>
              <td className="py-2 text-center">{row.won}</td>
              <td className="py-2 text-center">{row.drawn}</td>
              <td className="py-2 text-center">{row.lost}</td>
              <td className="py-2 text-center">{row.goalsFor}</td>
              <td className="py-2 text-center">{row.goalsAgainst}</td>
              <td className="py-2 text-center">{row.goalDifference}</td>
              <td className="py-2 text-center font-bold text-[var(--iberdrola-green)]">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}