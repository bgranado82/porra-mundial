
import { StandingRow } from "@/lib/standings";

type Props = {
  title: string;
  groupCode: string;
  rows: StandingRow[];
  tiebreaks: Record<string, number>;
  onChangeTiebreak: (groupCode: string, teamId: string, value: string) => void;
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
    tiebreak: string;
  };
};

function getTiebreakKey(groupCode: string, teamId: string) {
  return `group:${groupCode}:${teamId}`;
}

export default function AdminGroupStandingsTable({
  title,
  groupCode,
  rows,
  tiebreaks,
  onChangeTiebreak,
  labels,
}: Props) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
        <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
          {title}
        </h2>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto rounded-2xl border border-[var(--iberdrola-sky)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--iberdrola-sand)] text-[var(--iberdrola-forest)]">
              <tr>
                <th className="px-3 py-2 text-left font-black">#</th>
                <th className="px-3 py-2 text-left font-black">{labels.team}</th>
                <th className="px-2 py-2 text-center font-black">{labels.played}</th>
                <th className="px-2 py-2 text-center font-black">{labels.won}</th>
                <th className="px-2 py-2 text-center font-black">{labels.drawn}</th>
                <th className="px-2 py-2 text-center font-black">{labels.lost}</th>
                <th className="px-2 py-2 text-center font-black">{labels.goalsFor}</th>
                <th className="px-2 py-2 text-center font-black">{labels.goalsAgainst}</th>
                <th className="px-2 py-2 text-center font-black">{labels.goalDifference}</th>
                <th className="px-2 py-2 text-center font-black">{labels.pointsShort}</th>
                <th className="px-2 py-2 text-center font-black">{labels.tiebreak}</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const tbKey = getTiebreakKey(groupCode, row.teamId);
                const tbValue = tiebreaks[tbKey] ?? "";

                return (
                  <tr
                    key={row.teamId}
                    className="border-t border-[var(--iberdrola-sky)] text-[var(--iberdrola-forest)]"
                  >
                    <td className="px-3 py-2 font-bold">{index + 1}</td>

                    <td className="whitespace-nowrap px-3 py-2 font-bold">
                      <div className="flex items-center gap-2">
                        {row.teamFlag ? (
                          <img
                            src={row.teamFlag}
                            alt={row.teamName}
                            className="h-4 w-6 rounded-sm object-cover"
                          />
                        ) : null}
                        <span>{row.teamName}</span>
                      </div>
                    </td>

                    <td className="px-2 py-2 text-center">{row.played}</td>
                    <td className="px-2 py-2 text-center">{row.won}</td>
                    <td className="px-2 py-2 text-center">{row.drawn}</td>
                    <td className="px-2 py-2 text-center">{row.lost}</td>
                    <td className="px-2 py-2 text-center">{row.goalsFor}</td>
                    <td className="px-2 py-2 text-center">{row.goalsAgainst}</td>
                    <td className="px-2 py-2 text-center">{row.goalDifference}</td>
                    <td className="px-2 py-2 text-center font-black">{row.points}</td>

                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={tbValue}
                        onChange={(e) =>
                          onChangeTiebreak(groupCode, row.teamId, e.target.value)
                        }
                        className="w-14 rounded-lg border border-[var(--iberdrola-green)] px-2 py-1 text-center text-sm font-bold text-[var(--iberdrola-forest)]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}