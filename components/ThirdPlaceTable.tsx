import { ThirdPlaceRow } from "@/lib/thirdPlace";

type Props = {
  title: string;
  subtitle?: string;
  rows: ThirdPlaceRow[];
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
  };
};

export default function ThirdPlaceTable({
  title,
  subtitle,
  rows,
  labels,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--iberdrola-forest)] md:text-xl">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-[var(--iberdrola-forest)]">
              <th className="px-3 py-2">{labels.position}</th>
              <th className="px-3 py-2">{labels.group}</th>
              <th className="px-3 py-2">{labels.team}</th>
              <th className="px-3 py-2 text-center">{labels.played}</th>
              <th className="px-3 py-2 text-center">{labels.won}</th>
              <th className="px-3 py-2 text-center">{labels.drawn}</th>
              <th className="px-3 py-2 text-center">{labels.lost}</th>
              <th className="px-3 py-2 text-center">{labels.goalsFor}</th>
              <th className="px-3 py-2 text-center">{labels.goalsAgainst}</th>
              <th className="px-3 py-2 text-center">{labels.goalDifference}</th>
              <th className="px-3 py-2 text-center">{labels.pointsShort}</th>
              <th className="px-3 py-2">{labels.status}</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.teamId}
                className={`rounded-xl ${
                  row.qualifies
                    ? "bg-[var(--iberdrola-green-light)]/40"
                    : "bg-gray-50"
                }`}
              >
                <td className="rounded-l-xl px-3 py-3 font-semibold text-[var(--iberdrola-forest)]">
                  {index + 1}
                </td>
                <td className="px-3 py-3 text-[var(--iberdrola-forest)]">
                  {row.group}
                </td>
                <td className="px-3 py-3 font-medium text-[var(--iberdrola-forest)]">
                  {row.teamFlag} {row.teamName}
                </td>
                <td className="px-3 py-3 text-center">{row.played}</td>
                <td className="px-3 py-3 text-center">{row.won}</td>
                <td className="px-3 py-3 text-center">{row.drawn}</td>
                <td className="px-3 py-3 text-center">{row.lost}</td>
                <td className="px-3 py-3 text-center">{row.goalsFor}</td>
                <td className="px-3 py-3 text-center">{row.goalsAgainst}</td>
                <td className="px-3 py-3 text-center">{row.goalDifference}</td>
                <td className="px-3 py-3 text-center font-semibold">
                  {row.points}
                </td>
                <td className="rounded-r-xl px-3 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      row.qualifies
                        ? "bg-[var(--iberdrola-green)] text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {row.qualifies ? labels.qualified : labels.eliminated}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}