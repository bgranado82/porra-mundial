import { ThirdPlaceRow } from "@/lib/thirdPlace";

type Props = {
  title: string;
  subtitle?: string;
  rows: ThirdPlaceRow[];
  tiebreaks?: Record<string, number>;
  onChangeTiebreak?: (teamId: string, value: string) => void;
  tiedTeamIds?: Set<string>;
  labels: {
    position: string;
    group: string;
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    goalDifference: string;
    pointsShort: string;
    status: string;
    qualified: string;
    eliminated: string;
    tiebreak: string;
  };
};

function getTiebreakKey(teamId: string) {
  return `third_place:overall:${teamId}`;
}

export default function ThirdPlaceTable({
  title,
  subtitle,
  rows,
  tiebreaks,
  onChangeTiebreak,
  tiedTeamIds,
  labels,
}: Props) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="text-xl">🏅</span>
        <div>
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">{title}</h2>
          {subtitle ? <p className="text-xs text-[var(--iberdrola-forest)]/55">{subtitle}</p> : null}
        </div>
      </div>

      <div className="p-4">
        <div className="hidden overflow-x-auto rounded-2xl border border-[var(--iberdrola-sky)] lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--iberdrola-green-light)]/60 text-[var(--iberdrola-forest)]">
              <tr>
                <th className="px-3 py-2 text-left font-black">{labels.position}</th>
                <th className="px-3 py-2 text-left font-black">{labels.group}</th>
                <th className="px-3 py-2 text-left font-black">{labels.team}</th>
                <th className="px-2 py-2 text-center font-black">{labels.played}</th>
                <th className="px-2 py-2 text-center font-black">{labels.won}</th>
                <th className="px-2 py-2 text-center font-black">{labels.drawn}</th>
                <th className="px-2 py-2 text-center font-black">{labels.lost}</th>
                <th className="px-2 py-2 text-center font-black">{labels.goalsFor}</th>
                <th className="px-2 py-2 text-center font-black">
                  {labels.goalsAgainst}
                </th>
                <th className="px-2 py-2 text-center font-black">
                  {labels.pointsShort}
                </th>
                <th className="px-3 py-2 text-left font-black">{labels.status}</th>
                <th className="px-2 py-2 text-center font-black">{labels.tiebreak}</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const isTied = tiedTeamIds?.has(row.teamId) ?? false;
                const tbKey = getTiebreakKey(row.teamId);
                const tbValue = tiebreaks?.[tbKey] ?? "";

                return (
                  <tr
                    key={row.teamId}
                    className={`border-t border-[var(--iberdrola-sky)] text-[var(--iberdrola-forest)] ${isTied ? "bg-[var(--iberdrola-sunset)]/10" : ""}`}
                  >
                    <td className="px-3 py-2 font-bold">{index + 1}</td>
                    <td className="px-3 py-2 font-semibold">{row.group}</td>
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
                        {isTied ? (
                          <span className="rounded-full bg-[var(--iberdrola-sunset)] px-1.5 py-0.5 text-[10px] font-black text-white">
                            TB
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">{row.played}</td>
                    <td className="px-2 py-2 text-center">{row.won}</td>
                    <td className="px-2 py-2 text-center">{row.drawn}</td>
                    <td className="px-2 py-2 text-center">{row.lost}</td>
                    <td className="px-2 py-2 text-center">{row.goalsFor}</td>
                    <td className="px-2 py-2 text-center">{row.goalsAgainst}</td>
                    <td className="px-2 py-2 text-center font-black">{row.points}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          row.qualifies
                            ? "bg-[var(--iberdrola-green)] text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {row.qualifies ? labels.qualified : labels.eliminated}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {isTied ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={tbValue}
                          onChange={(e) => onChangeTiebreak?.(row.teamId, e.target.value)}
                          className="w-14 rounded-lg border border-[var(--iberdrola-sunset)] bg-[var(--iberdrola-sunset)]/5 px-2 py-1 text-center text-sm font-bold text-[var(--iberdrola-forest)] outline-none focus:border-[var(--iberdrola-sunset)] focus:ring-1 focus:ring-[var(--iberdrola-sunset)]"
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[var(--iberdrola-forest)]/50">
                <th className="px-2 py-1.5 text-left font-bold">#</th>
                <th className="px-2 py-1.5 text-left font-bold">{labels.team}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.group}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.played}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.won}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.drawn}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.lost}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.goalsFor}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.goalsAgainst}</th>
                <th className="px-1.5 py-1.5 text-center font-bold text-[var(--iberdrola-green)]">{labels.pointsShort}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.status}</th>
                <th className="px-1.5 py-1.5 text-center font-bold">{labels.tiebreak}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isTied = tiedTeamIds?.has(row.teamId) ?? false;
                const tbKey = getTiebreakKey(row.teamId);
                const tbValue = tiebreaks?.[tbKey] ?? "";
                return (
                  <tr
                    key={row.teamId}
                    className={`border-b border-gray-100 ${
                      isTied ? "bg-[var(--iberdrola-sunset)]/10" : index < 8 ? "bg-[var(--iberdrola-green-light)]/30" : ""
                    }`}
                  >
                    <td className="px-2 py-2 font-bold text-[var(--iberdrola-forest)]/60">{index + 1}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {row.teamFlag ? (
                          <img src={row.teamFlag} alt={row.teamName} className="h-4 w-5 rounded-[2px] border border-gray-100 object-cover" />
                        ) : null}
                        <span className="text-[11px] font-bold text-[var(--iberdrola-forest)]">{row.teamName}</span>
                        {isTied ? <span className="rounded-full bg-[var(--iberdrola-sunset)] px-1 py-0.5 text-[9px] font-black text-white">TB</span> : null}
                      </div>
                    </td>
                    <td className="px-1.5 py-2 text-center font-semibold text-[var(--iberdrola-forest)]/60">{row.group}</td>
                    <td className="px-1.5 py-2 text-center text-[var(--iberdrola-forest)]/70">{row.played}</td>
                    <td className="px-1.5 py-2 text-center text-[var(--iberdrola-forest)]/70">{row.won}</td>
                    <td className="px-1.5 py-2 text-center text-[var(--iberdrola-forest)]/70">{row.drawn}</td>
                    <td className="px-1.5 py-2 text-center text-[var(--iberdrola-forest)]/70">{row.lost}</td>
                    <td className="px-1.5 py-2 text-center text-[var(--iberdrola-forest)]/70">{row.goalsFor}</td>
                    <td className="px-1.5 py-2 text-center text-[var(--iberdrola-forest)]/70">{row.goalsAgainst}</td>
                    <td className="px-1.5 py-2 text-center font-black text-[var(--iberdrola-green)]">{row.points}</td>
                    <td className="px-1.5 py-2 text-center">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                        row.qualifies ? "bg-[var(--iberdrola-green)] text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        {row.qualifies ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 text-center">
                      {isTied ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={tbValue}
                          onChange={(e) => onChangeTiebreak?.(row.teamId, e.target.value)}
                          className="w-10 rounded-lg border border-[var(--iberdrola-sunset)] bg-[var(--iberdrola-sunset)]/5 px-1 py-0.5 text-center text-xs font-bold outline-none"
                        />
                      ) : <span className="text-gray-300">—</span>}
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