
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
  rows: Row[];
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
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
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
                  {labels.goalDifference}
                </th>
                <th className="px-2 py-2 text-center font-black">
                  {labels.pointsShort}
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.teamId} className="border-b border-gray-100">
                  <td className="px-2 py-2 font-semibold">{index + 1}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-bold">
                    <div className="flex items-center gap-2">
                      {row.teamFlag ? (
                        <img
                          src={row.teamFlag}
                          alt={row.teamName ?? row.teamId}
                          className="h-4 w-6 object-cover rounded-sm"
                        />
                      ) : null}
                      <span>{row.teamName ?? row.teamId}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 lg:hidden">
          {rows.map((row, index) => (
            <div
              key={row.teamId}
              className="rounded-xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-sm font-black text-[var(--iberdrola-forest)] flex items-center gap-2">
                  {row.teamFlag ? (
                    <img
                      src={row.teamFlag}
                      alt={row.teamName ?? row.teamId}
                      className="h-4 w-6 object-cover rounded-sm"
                    />
                  ) : null}
                  <span>
                    {index + 1}. {row.teamName ?? row.teamId}
                  </span>
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
                  <div className="font-semibold opacity-70">{labels.goalsAgainst}</div>
                  <div className="font-black">{row.goalsAgainst}</div>
                </div>
                <div>
                  <div className="font-semibold opacity-70">{labels.goalDifference}</div>
                  <div className="font-black">{row.goalDifference}</div>
                </div>
                <div>
                  <div className="font-semibold opacity-70">{labels.pointsShort}</div>
                  <div className="font-black">{row.points}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}