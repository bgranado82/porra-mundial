import { teams } from "@/data/teams";

type Labels = {
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

type Props = {
  title: string;
  rows: any[];
  labels: Labels;
};

const teamMap = new Map(teams.map((team) => [team.id, team]));

export default function GroupStandingsTable({ title, rows, labels }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold text-[var(--iberdrola-forest)]">
        {title}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] table-fixed">
          <colgroup>
            <col style={{ width: "42px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
            <col style={{ width: "52px" }} />
          </colgroup>

          <thead>
            <tr className="text-left text-sm text-[var(--iberdrola-forest)]">
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 font-semibold">#</th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 font-semibold">
                {labels.team}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.played}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.won}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.drawn}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.lost}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.goalsFor}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.goalsAgainst}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.goalDifference}
              </th>
              <th className="border-b border-[var(--iberdrola-sky)] px-2 py-2 text-center font-semibold">
                {labels.pointsShort}
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const fallbackTeam = row.teamId ? teamMap.get(row.teamId) : null;
              const displayFlag = row.flag || fallbackTeam?.flag || "";
              const displayName = row.name || fallbackTeam?.name || row.teamId || "";

              return (
                <tr key={row.teamId ?? index} className="text-sm text-[var(--iberdrola-forest)]">
                  <td className="border-b border-gray-100 px-2 py-2.5">{index + 1}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="shrink-0 text-base">{displayFlag}</span>
                      <span className="truncate">{displayName}</span>
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.played}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.won}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.drawn}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.lost}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.goalsFor}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.goalsAgainst}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">{row.goalDifference}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center font-semibold text-[var(--iberdrola-green)]">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}