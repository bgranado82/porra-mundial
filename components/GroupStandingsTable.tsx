type Row = {
  teamId: string;
  teamName?: string;
  teamFlag?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type Props = {
  title: string;
  groupCode?: string;
  rows: Row[];
  tiebreaks?: Record<string, number>;
  onChangeTiebreak?: (groupCode: string, teamId: string, value: string) => void;
  showTiebreak?: boolean;
  tiedTeamIds?: Set<string>;
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

export default function GroupStandingsTable({
  title,
  groupCode,
  rows,
  tiebreaks,
  onChangeTiebreak,
  showTiebreak = false,
  tiedTeamIds,
  labels,
}: Props) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white shadow-sm transition hover:shadow-md">
      <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
        <h3 className="text-lg font-black text-[var(--iberdrola-forest)]">
          {title}
        </h3>
      </div>

      <div className="p-4">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
            <thead className="text-[var(--iberdrola-forest)]">
              <tr className="border-b border-[var(--iberdrola-sky)]">
                <th className="px-2 py-2 text-left font-black">#</th>
                <th className="px-2 py-2 text-left font-black">{labels.team}</th>
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
                {showTiebreak ? (
                  <th className="px-2 py-2 text-center font-black">
                    {labels.tiebreak}
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const isTied = tiedTeamIds?.has(row.teamId) ?? false;
                const tbKey =
                  showTiebreak && groupCode
                    ? getTiebreakKey(groupCode, row.teamId)
                    : "";
                const tbValue =
                  showTiebreak && tbKey ? tiebreaks?.[tbKey] ?? "" : "";

                return (
                  <tr
                    key={row.teamId}
                    className={`border-b border-gray-100 transition ${isTied ? "bg-[var(--iberdrola-sunset)]/10" : index < 2 ? "bg-[var(--iberdrola-green-light)]/40" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-2 py-2 font-semibold">{index + 1}</td>
                    <td className="whitespace-nowrap px-2 py-2 font-bold">
                      <div className="flex items-center gap-2">
                        {row.teamFlag ? (
                          <img
                            src={row.teamFlag}
                            alt={row.teamName ?? row.teamId}
                            className="h-5 w-7 rounded-[3px] border border-gray-100 object-cover shadow-sm"
                          />
                        ) : null}
                        <span className="text-[13px] font-bold">
                        {row.teamName ?? row.teamId}
                        </span>
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
                    <td className="px-2 py-2 text-center font-black">
                      {row.points}
                    </td>

                    {showTiebreak ? (
                      <td className="px-2 py-2 text-center">
                        {isTied ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={tbValue}
                            onChange={(e) => {
                              if (!groupCode) return;
                              onChangeTiebreak?.(
                                groupCode,
                                row.teamId,
                                e.target.value
                              );
                            }}
                            className="w-14 rounded-lg border border-[var(--iberdrola-sunset)] bg-[var(--iberdrola-sunset)]/5 px-2 py-1 text-center text-sm font-bold text-[var(--iberdrola-forest)] outline-none focus:border-[var(--iberdrola-sunset)] focus:ring-1 focus:ring-[var(--iberdrola-sunset)]"
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 lg:hidden">
          {rows.map((row, index) => {
            const isTied = tiedTeamIds?.has(row.teamId) ?? false;
            const tbKey =
              showTiebreak && groupCode
                ? getTiebreakKey(groupCode, row.teamId)
                : "";
            const tbValue =
              showTiebreak && tbKey ? tiebreaks?.[tbKey] ?? "" : "";

            return (
              <div
                key={row.teamId}
                className={`rounded-xl border px-3 py-3 ${
                  isTied
                    ? "border-[var(--iberdrola-sunset)] bg-[var(--iberdrola-sunset)]/10"
                    : "border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2 text-sm font-black text-[var(--iberdrola-forest)]">
                    {row.teamFlag ? (
                      <img
                        src={row.teamFlag}
                        alt={row.teamName ?? row.teamId}
                        className="h-5 w-7 rounded-[3px] border border-gray-100 object-cover shadow-sm"
                      />
                    ) : null}
                    <span>
                      {index + 1}. {row.teamName ?? row.teamId}
                    </span>
                    {isTied ? (
                      <span className="rounded-full bg-[var(--iberdrola-sunset)] px-1.5 py-0.5 text-[10px] font-black text-white">
                        TB
                      </span>
                    ) : null}
                  </div>

                  <div className="rounded-full bg-[var(--iberdrola-green)] px-2.5 py-1 text-xs font-black text-white">
                    {row.points} {labels.pointsShort}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs text-[var(--iberdrola-forest)]">
                  <div>
                    <div className="font-semibold opacity-70">{labels.played}</div>
                    <div className="font-black">{row.played}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">{labels.won}</div>
                    <div className="font-black">{row.won}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">{labels.drawn}</div>
                    <div className="font-black">{row.drawn}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">{labels.lost}</div>
                    <div className="font-black">{row.lost}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">{labels.goalsFor}</div>
                    <div className="font-black">{row.goalsFor}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">
                      {labels.goalsAgainst}
                    </div>
                    <div className="font-black">{row.goalsAgainst}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">
                      {labels.goalDifference}
                    </div>
                    <div className="font-black">{row.goalDifference}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-70">
                      {labels.pointsShort}
                    </div>
                    <div className="font-black">{row.points}</div>
                  </div>
                </div>

                {showTiebreak && isTied ? (
                  <div className="mt-3 border-t border-[var(--iberdrola-sunset)]/30 pt-3">
                    <div className="mb-1 text-xs font-semibold text-[var(--iberdrola-forest)]/70">
                      {labels.tiebreak}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={tbValue}
                      onChange={(e) => {
                        if (!groupCode) return;
                        onChangeTiebreak?.(groupCode, row.teamId, e.target.value);
                      }}
                      className="w-16 rounded-lg border border-[var(--iberdrola-sunset)] bg-[var(--iberdrola-sunset)]/5 px-2 py-1 text-center text-sm font-bold text-[var(--iberdrola-forest)] outline-none focus:ring-1 focus:ring-[var(--iberdrola-sunset)]"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}